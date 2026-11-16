<?php

namespace Tests\Feature;

use App\Models\Denuncia;
use App\Models\User;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Fluxo comunitário completo: consulta pública, denúncia e validação só com conta,
 * regras de status ("ainda existe" / "foi resolvido"), histórico e anti-abuso.
 */
class EcoRadarComunidadeTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, User> */
    private array $pessoas = [];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Http::fake([ExpoPushChannel::ENDPOINT => Http::response(['data' => [['status' => 'ok']]])]);
        config(['ecoradar.validacao' => ['confirmar_minimo' => 2, 'possivel_resolucao_minimo' => 1, 'resolver_minimo' => 3]]);
    }

    /** Age como a pessoa (conta criada na primeira vez). */
    private function como(string $nome): User
    {
        $this->pessoas[$nome] ??= User::factory()->create(['name' => ucfirst($nome).' Silva']);
        Sanctum::actingAs($this->pessoas[$nome]);

        return $this->pessoas[$nome];
    }

    private function visitante(): void
    {
        $this->app['auth']->forgetGuards();
    }

    private function foto(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'eco').'.png';
        file_put_contents($path, file_get_contents(base_path('tests/Feature/fixtures/foto-200.png')));

        return new UploadedFile($path, 'foto.png', 'image/png', null, true);
    }

    private function denunciar(array $extra = [])
    {
        return $this->post('/api/denuncias', [
            'foto' => $this->foto(),
            'categoria' => 'descarte_irregular',
            'titulo' => 'Sacos de lixo na calçada',
            'descricao' => 'Lixo acumulado ao lado do ponto de ônibus.',
            'latitude' => -23.5008,
            'longitude' => -47.4583,
            ...$extra,
        ], ['Accept' => 'application/json']);
    }

    private function votar(int $id, string $tipo)
    {
        return $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => $tipo]);
    }

    public function test_visitante_consulta_mas_nao_denuncia_nem_valida(): void
    {
        $this->como('autora');
        $id = $this->denunciar()->assertCreated()->json('id');
        $this->visitante();

        // Consultar continua livre
        $this->getJson('/api/denuncias')->assertOk()->assertJsonPath('0.id', $id)
            ->assertJsonPath('0.pode_validar', false)->assertJsonPath('0.precisa_login', true);
        $this->getJson("/api/denuncias/{$id}")->assertOk();

        // Participar exige conta
        $this->denunciar()->assertUnauthorized();
        $this->votar($id, 'existe')->assertUnauthorized();
        $this->postJson("/api/denuncias/{$id}/confirmar")->assertUnauthorized();
        $this->assertDatabaseCount('denuncia_validacoes', 0);
    }

    public function test_fluxo_completo_de_validacao_comunitaria(): void
    {
        // 1. Uma pessoa com conta registra a denúncia
        $this->como('autora');
        $criada = $this->denunciar()
            ->assertCreated()
            ->assertJsonPath('status', 'pendente')
            ->assertJsonPath('autor.nome', 'Autora')
            ->assertJsonPath('autor.sou_eu', true)
            ->assertJsonPath('pode_validar', false);
        $id = $criada->json('id');
        $this->assertArrayNotHasKey('autor_hash', $criada->json());

        // O autor não valida a própria denúncia
        $this->votar($id, 'existe')->assertForbidden();

        // 2. A denúncia aparece para outras pessoas, que podem validar
        $this->como('vizinha');
        $this->getJson('/api/denuncias')->assertJsonPath('0.id', $id)->assertJsonPath('0.pode_validar', true);

        // 3-4. Outra pessoa confirma: conta, mas ainda falta 1 confirmação
        $this->votar($id, 'existe')
            ->assertOk()
            ->assertJsonPath('voto_registrado', true)
            ->assertJsonPath('denuncia.validacoes.existe', 1)
            ->assertJsonPath('denuncia.meu_voto', 'existe')
            ->assertJsonPath('denuncia.status', 'pendente');

        // A mesma pessoa não vota de novo
        $this->votar($id, 'existe')->assertOk()->assertJsonPath('voto_registrado', false)->assertJsonPath('denuncia.validacoes.existe', 1);

        // 5. Uma segunda pessoa confirma → Confirmada pela comunidade
        $this->como('carlos');
        $this->votar($id, 'existe')
            ->assertJsonPath('denuncia.validacoes.existe', 2)
            ->assertJsonPath('denuncia.status', 'confirmada')
            ->assertJsonPath('status_mudou', true);

        // 6. Alguém informa que foi resolvido → Possivelmente resolvida
        $this->travel(1)->minutes();
        $this->como('resolve1');
        $this->votar($id, 'resolvida')->assertJsonPath('denuncia.status', 'possivelmente_resolvida')->assertJsonPath('denuncia.validacoes.resolvida', 1);

        // Uma nova confirmação contesta a resolução → volta a Confirmada
        $this->travel(1)->minutes();
        $this->como('contesta');
        $this->votar($id, 'existe')->assertJsonPath('denuncia.status', 'confirmada');

        // 7. Mais avisos de resolução superam a contestação → Resolvida
        $this->travel(1)->minutes();
        $this->como('resolve2');
        $this->votar($id, 'resolvida')->assertJsonPath('denuncia.status', 'possivelmente_resolvida');
        $this->como('resolve3');
        $this->votar($id, 'resolvida')->assertJsonPath('denuncia.status', 'resolvida')->assertJsonPath('denuncia.validacoes.resolvida', 3);

        // Encerrada: não recebe mais votos
        $this->como('tardia');
        $this->votar($id, 'existe')->assertForbidden();

        // 8. Histórico completo, com a origem de cada mudança
        $historico = $this->getJson("/api/denuncias/{$id}")->assertOk()->json('historico');
        $this->assertSame(
            ['pendente', 'confirmada', 'possivelmente_resolvida', 'confirmada', 'possivelmente_resolvida', 'resolvida'],
            array_column($historico, 'status'),
        );
        $this->assertSame('autor', $historico[0]['origem']);
        $this->assertSame(['comunidade'], array_values(array_unique(array_column(array_slice($historico, 1), 'origem'))));

        // vizinha, Carlos, resolve1, contesta, resolve2, resolve3 (autor, repetido e tardia recusados)
        $this->assertDatabaseCount('denuncia_validacoes', 6);
    }

    public function test_status_oficial_da_equipe_e_preservado_pela_comunidade(): void
    {
        $this->como('autora');
        $id = $this->denunciar()->json('id');
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($admin);
        // A equipe passa por "em análise" e depois "verificada": vale o mais recente
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'em_analise'])->assertOk();
        $this->travel(1)->minutes();
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'verificada'])->assertOk();

        $this->como('a');
        $this->votar($id, 'existe');
        $this->como('b');
        $this->votar($id, 'existe')->assertJsonPath('denuncia.status', 'verificada');

        $this->travel(1)->minutes();
        $this->como('c');
        $this->votar($id, 'resolvida')->assertJsonPath('denuncia.status', 'possivelmente_resolvida');
    }

    public function test_usuario_comum_nao_altera_status_arbitrariamente(): void
    {
        $this->como('autora');
        $id = $this->denunciar()->json('id');
        $this->como('outra');
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'resolvida'])->assertForbidden();
        $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => 'apagar'])->assertUnprocessable();
        $this->assertSame('pendente', Denuncia::find($id)->status);
    }

    public function test_duplicata_proxima_e_avisada(): void
    {
        $this->como('autora');
        $original = $this->denunciar()->json('id');

        $this->como('outra');
        $this->denunciar(['latitude' => -23.50085, 'longitude' => -47.45835])->assertStatus(409)->assertJsonPath('duplicata.id', $original);

        // Categoria diferente, ou insistindo conscientemente, é aceita
        $this->denunciar(['categoria' => 'entulho', 'latitude' => -23.50085, 'longitude' => -47.45835])->assertCreated();
        $this->denunciar(['latitude' => -23.50085, 'longitude' => -47.45835, 'ignorar_duplicata' => 1])->assertCreated();
    }

    public function test_limites_de_envio_e_validacao_de_entradas(): void
    {
        $this->como('x');

        // Contato pessoal ou link no texto: recusado (denúncias são públicas)
        $this->denunciar(['descricao' => 'Liga pra mim (15) 99876-5432'])->assertUnprocessable()->assertJsonValidationErrors(['descricao']);
        $this->denunciar(['titulo' => 'Veja www.exemplo.com agora'])->assertUnprocessable()->assertJsonValidationErrors(['titulo']);

        // Arquivo que não é imagem: recusado
        $this->post('/api/denuncias', [
            'foto' => UploadedFile::fake()->create('virus.exe', 10, 'application/octet-stream'),
            'categoria' => 'entulho', 'titulo' => 'Entulho na rua', 'latitude' => -23.5, 'longitude' => -47.4,
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors(['foto']);

        // Limite de envios por pessoa
        config(['ecoradar.limites.denuncias_por_hora' => 2]);
        $this->como('spam');
        $this->denunciar(['latitude' => -23.51])->assertCreated();
        $this->denunciar(['latitude' => -23.52])->assertCreated();
        $this->denunciar(['latitude' => -23.53])->assertStatus(429);
    }

    public function test_privacidade_do_autor_e_categorias_publicas(): void
    {
        Sanctum::actingAs(User::factory()->create(['name' => 'Marina Souza Lima', 'email' => 'marina@exemplo.test']));
        $res = $this->denunciar()->assertCreated();
        $this->visitante();

        $publico = $this->getJson("/api/denuncias/{$res->json('id')}")->assertOk();
        $publico->assertJsonPath('autor.nome', 'Marina')->assertJsonPath('user.name', 'Marina');
        $this->assertStringNotContainsString('marina@exemplo.test', $publico->getContent());
        $this->assertStringNotContainsString('Souza', $publico->getContent());

        $this->getJson('/api/categorias')->assertOk()->assertJsonCount(7)->assertJsonPath('2.slug', 'eletronicos');
    }
}
