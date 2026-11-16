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
 * Fluxo comunitário completo: denúncia sem conta, mapa público, validações
 * ("ainda existe" / "foi resolvido"), regras de status, histórico e anti-abuso.
 */
class EcoRadarComunidadeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Http::fake([ExpoPushChannel::ENDPOINT => Http::response(['data' => [['status' => 'ok']]])]);
        config(['ecoradar.validacao' => ['confirmar_minimo' => 2, 'possivel_resolucao_minimo' => 1, 'resolver_minimo' => 3]]);
    }

    private function foto(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'eco').'.png';
        file_put_contents($path, file_get_contents(base_path('tests/Feature/fixtures/foto-200.png')));

        return new UploadedFile($path, 'foto.png', 'image/png', null, true);
    }

    /** Cabeçalho de um dispositivo anônimo. */
    private function dispositivo(string $nome): array
    {
        return ['Accept' => 'application/json', 'X-EcoRadar-Dispositivo' => str_pad($nome, 24, '0')];
    }

    private function denunciar(array $headers, array $extra = [])
    {
        return $this->post('/api/denuncias', [
            'foto' => $this->foto(),
            'categoria' => 'descarte_irregular',
            'titulo' => 'Sacos de lixo na calçada',
            'descricao' => 'Lixo acumulado ao lado do ponto de ônibus.',
            'latitude' => -23.5008,
            'longitude' => -47.4583,
            ...$extra,
        ], $headers);
    }

    private function votar(int $id, string $tipo, array $headers)
    {
        return $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => $tipo], $headers);
    }

    public function test_fluxo_completo_de_validacao_comunitaria(): void
    {
        // 1. Uma pessoa sem conta registra a denúncia
        $criada = $this->denunciar($this->dispositivo('autor'))
            ->assertCreated()
            ->assertJsonPath('status', 'pendente')
            ->assertJsonPath('autor.anonimo', true)
            ->assertJsonPath('autor.nome', 'Cidadão anônimo')
            ->assertJsonPath('autor.sou_eu', true)
            ->assertJsonPath('pode_validar', false);
        $id = $criada->json('id');
        $this->assertNull(Denuncia::find($id)->user_id);
        $this->assertArrayNotHasKey('autor_hash', $criada->json());

        // 2. A denúncia aparece no mapa para qualquer pessoa, sem conta
        $this->getJson('/api/denuncias')->assertOk()->assertJsonPath('0.id', $id)->assertJsonPath('0.pode_validar', false);
        $this->getJson('/api/denuncias', $this->dispositivo('outra'))->assertJsonPath('0.pode_validar', true);

        // O autor não valida a própria denúncia
        $this->votar($id, 'existe', $this->dispositivo('autor'))->assertForbidden();

        // 3-4. Outra pessoa confirma: conta, mas ainda falta 1 confirmação
        $this->votar($id, 'existe', $this->dispositivo('vizinha'))
            ->assertOk()
            ->assertJsonPath('voto_registrado', true)
            ->assertJsonPath('denuncia.validacoes.existe', 1)
            ->assertJsonPath('denuncia.meu_voto', 'existe')
            ->assertJsonPath('denuncia.status', 'pendente');

        // A mesma pessoa não vota de novo
        $this->votar($id, 'existe', $this->dispositivo('vizinha'))
            ->assertOk()->assertJsonPath('voto_registrado', false)->assertJsonPath('denuncia.validacoes.existe', 1);

        // 5. Uma segunda pessoa (com conta) confirma → Confirmada pela comunidade
        Sanctum::actingAs(User::factory()->create(['name' => 'Carlos Menezes']));
        $this->votar($id, 'existe', ['Accept' => 'application/json'])
            ->assertJsonPath('denuncia.validacoes.existe', 2)
            ->assertJsonPath('denuncia.status', 'confirmada')
            ->assertJsonPath('status_mudou', true);
        $this->app['auth']->forgetGuards();

        // 6. Alguém informa que foi resolvido → Possivelmente resolvida
        $this->travel(1)->minutes();
        $this->votar($id, 'resolvida', $this->dispositivo('resolve1'))
            ->assertJsonPath('denuncia.status', 'possivelmente_resolvida')
            ->assertJsonPath('denuncia.validacoes.resolvida', 1);

        // Uma nova confirmação contesta a resolução → volta a Confirmada
        $this->travel(1)->minutes();
        $this->votar($id, 'existe', $this->dispositivo('contesta'))->assertJsonPath('denuncia.status', 'confirmada');

        // 7. Mais avisos de resolução superam a contestação → Resolvida
        $this->travel(1)->minutes();
        $this->votar($id, 'resolvida', $this->dispositivo('resolve2'))->assertJsonPath('denuncia.status', 'possivelmente_resolvida');
        $this->votar($id, 'resolvida', $this->dispositivo('resolve3'))
            ->assertJsonPath('denuncia.status', 'resolvida')
            ->assertJsonPath('denuncia.validacoes.resolvida', 3);

        // Encerrada: não recebe mais votos
        $this->votar($id, 'existe', $this->dispositivo('tardia'))->assertForbidden();

        // 8. Histórico completo, com a origem de cada mudança
        $historico = $this->getJson("/api/denuncias/{$id}")->assertOk()->json('historico');
        $this->assertSame(
            ['pendente', 'confirmada', 'possivelmente_resolvida', 'confirmada', 'possivelmente_resolvida', 'resolvida'],
            array_column($historico, 'status'),
        );
        $this->assertSame('autor', $historico[0]['origem']);
        $this->assertSame(['comunidade'], array_values(array_unique(array_column(array_slice($historico, 1), 'origem'))));

        // Cada voto fica registrado com data e identificação (conta ou hash do dispositivo)
        // vizinha, Carlos, resolve1, contesta, resolve2, resolve3 (autor, repetido e tardia recusados)
        $this->assertDatabaseCount('denuncia_validacoes', 6);
        $this->assertDatabaseMissing('denuncia_validacoes', ['votante' => 'd:'.str_pad('vizinha', 24, '0')]);
    }

    public function test_status_oficial_da_equipe_e_preservado_pela_comunidade(): void
    {
        $id = $this->denunciar($this->dispositivo('autor'))->json('id');
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($admin);
        // A equipe passa por "em análise" e depois "verificada": vale o mais recente
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'em_analise'])->assertOk();
        $this->travel(1)->minutes();
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'verificada'])->assertOk();
        $this->app['auth']->forgetGuards();

        // Confirmações não rebaixam "verificada pela equipe" para "confirmada"
        $this->votar($id, 'existe', $this->dispositivo('a'));
        $this->votar($id, 'existe', $this->dispositivo('b'))->assertJsonPath('denuncia.status', 'verificada');

        // Resolução pela comunidade continua possível
        $this->travel(1)->minutes();
        $this->votar($id, 'resolvida', $this->dispositivo('c'))->assertJsonPath('denuncia.status', 'possivelmente_resolvida');
    }

    public function test_usuario_comum_nao_altera_status_arbitrariamente(): void
    {
        $id = $this->denunciar($this->dispositivo('autor'))->json('id');
        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'resolvida'])->assertForbidden();
        $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => 'apagar'])->assertUnprocessable();
        $this->assertSame('pendente', Denuncia::find($id)->status);
    }

    public function test_duplicata_proxima_e_avisada(): void
    {
        $original = $this->denunciar($this->dispositivo('autor'))->json('id');

        $this->denunciar($this->dispositivo('outra'), ['latitude' => -23.50085, 'longitude' => -47.45835])
            ->assertStatus(409)
            ->assertJsonPath('duplicata.id', $original);

        // Categoria diferente, ou insistindo conscientemente, é aceita
        $this->denunciar($this->dispositivo('outra'), ['categoria' => 'entulho', 'latitude' => -23.50085, 'longitude' => -47.45835])->assertCreated();
        $this->denunciar($this->dispositivo('outra'), ['latitude' => -23.50085, 'longitude' => -47.45835, 'ignorar_duplicata' => 1])->assertCreated();
    }

    public function test_limites_de_envio_e_validacao_de_entradas(): void
    {
        // Sem identificação de dispositivo nem conta: recusado
        $this->post('/api/denuncias', ['foto' => $this->foto(), 'categoria' => 'entulho', 'titulo' => 'Entulho na rua', 'latitude' => -23.5, 'longitude' => -47.4], ['Accept' => 'application/json'])
            ->assertStatus(422);

        // Contato pessoal ou link no texto: recusado (denúncias são públicas)
        $this->denunciar($this->dispositivo('x'), ['descricao' => 'Liga pra mim (15) 99876-5432'])->assertUnprocessable()->assertJsonValidationErrors(['descricao']);
        $this->denunciar($this->dispositivo('x'), ['titulo' => 'Veja www.exemplo.com agora'])->assertUnprocessable()->assertJsonValidationErrors(['titulo']);

        // Arquivo que não é imagem: recusado
        $this->post('/api/denuncias', [
            'foto' => UploadedFile::fake()->create('virus.exe', 10, 'application/octet-stream'),
            'categoria' => 'entulho', 'titulo' => 'Entulho na rua', 'latitude' => -23.5, 'longitude' => -47.4,
        ], $this->dispositivo('x'))->assertUnprocessable()->assertJsonValidationErrors(['foto']);

        // Limite de envios por pessoa
        config(['ecoradar.limites.denuncias_por_hora' => 2]);
        $this->denunciar($this->dispositivo('spam'), ['latitude' => -23.51])->assertCreated();
        $this->denunciar($this->dispositivo('spam'), ['latitude' => -23.52])->assertCreated();
        $this->denunciar($this->dispositivo('spam'), ['latitude' => -23.53])->assertStatus(429);
    }

    public function test_privacidade_do_autor_e_categorias_publicas(): void
    {
        Sanctum::actingAs(User::factory()->create(['name' => 'Marina Souza Lima', 'email' => 'marina@exemplo.test']));
        $res = $this->denunciar(['Accept' => 'application/json'])->assertCreated();
        $this->app['auth']->forgetGuards();

        $publico = $this->getJson("/api/denuncias/{$res->json('id')}")->assertOk();
        $publico->assertJsonPath('autor.nome', 'Marina')->assertJsonPath('user.name', 'Marina');
        $this->assertStringNotContainsString('marina@exemplo.test', $publico->getContent());
        $this->assertStringNotContainsString('Souza', $publico->getContent());

        $this->getJson('/api/categorias')->assertOk()->assertJsonCount(7)->assertJsonPath('2.slug', 'eletronicos');
    }
}
