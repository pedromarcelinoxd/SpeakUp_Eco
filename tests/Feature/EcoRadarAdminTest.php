<?php

namespace Tests\Feature;

use App\Models\CategoriaOcorrencia;
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
 * Administração: acesso só da equipe, moderação de denúncias, contas,
 * categorias e ecopontos.
 */
class EcoRadarAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Http::fake([ExpoPushChannel::ENDPOINT => Http::response(['data' => [['status' => 'ok']]])]);
    }

    private function admin(): User
    {
        $u = User::factory()->create(['name' => 'Equipe']);
        $u->forceFill(['is_admin' => true])->save();

        return $u;
    }

    /** Denúncia feita por uma conta comum (denunciar exige conta). */
    private function denuncia(): int
    {
        Sanctum::actingAs(User::factory()->create());
        $path = tempnam(sys_get_temp_dir(), 'eco').'.png';
        file_put_contents($path, file_get_contents(base_path('tests/Feature/fixtures/foto-200.png')));

        return $this->post('/api/denuncias', [
            'foto' => new UploadedFile($path, 'foto.png', 'image/png', null, true),
            'categoria' => 'entulho', 'titulo' => 'Entulho na calçada', 'latitude' => -23.5, 'longitude' => -47.45,
        ], ['Accept' => 'application/json'])->assertCreated()->json('id');
    }

    public function test_somente_a_equipe_acessa_a_administracao(): void
    {
        $this->getJson('/api/admin/resumo')->assertUnauthorized();
        $this->postJson('/api/ecopontos', ['nome' => 'X', 'latitude' => -23.5, 'longitude' => -47.4, 'residuos_aceitos' => ['Papel']])->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/resumo')->assertForbidden();
        $this->getJson('/api/admin/usuarios')->assertForbidden();
        // Antes, qualquer conta criava ecopontos: agora só a equipe
        $this->postJson('/api/ecopontos', ['nome' => 'X', 'latitude' => -23.5, 'longitude' => -47.4, 'residuos_aceitos' => ['Papel']])->assertForbidden();

        Sanctum::actingAs($this->admin());
        $this->getJson('/api/admin/resumo')->assertOk()
            ->assertJsonStructure(['denuncias' => ['total', 'por_status', 'aguardando_moderacao', 'tempo_medio_solucao_horas', 'por_categoria'], 'usuarios' => ['total', 'bloqueados'], 'regras' => ['validacao', 'limites']]);
    }

    public function test_ocultar_e_reexibir_denuncia(): void
    {
        $id = $this->denuncia();
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $this->postJson("/api/admin/denuncias/{$id}/ocultar", ['motivo' => 'Foto com rosto de pessoa'])->assertOk();
        $this->getJson('/api/admin/denuncias?status=ocultas')->assertOk()->assertJsonPath('0.oculta.motivo', 'Foto com rosto de pessoa');
        $this->app['auth']->forgetGuards();

        // Some do mapa público, do detalhe e não aceita votos
        $this->getJson('/api/denuncias')->assertOk()->assertJsonCount(0);
        $this->getJson("/api/denuncias/{$id}")->assertNotFound();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => 'existe'])->assertForbidden();
        $this->app['auth']->forgetGuards();

        Sanctum::actingAs($admin);
        $this->deleteJson("/api/admin/denuncias/{$id}/ocultar")->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/denuncias')->assertJsonCount(1);
        $this->assertNull(Denuncia::find($id)->oculta_em);
    }

    public function test_moderacao_ve_votos_e_altera_status(): void
    {
        $id = $this->denuncia();
        Sanctum::actingAs(User::factory()->create(['name' => 'Vizinho Teste']));
        $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => 'existe'])->assertOk();

        Sanctum::actingAs($this->admin());
        $this->getJson("/api/admin/denuncias/{$id}/votos")->assertOk()->assertJsonCount(1)->assertJsonPath('0.tipo', 'existe')->assertJsonPath('0.quem', 'Vizinho Teste');
        $this->getJson('/api/admin/denuncias?status=aguardando')->assertJsonPath('0.votos.existe', 1);
        $this->patchJson("/api/denuncias/{$id}/status", ['status' => 'verificada', 'observacao' => 'Vistoria feita'])->assertOk()->assertJsonPath('status', 'verificada');
    }

    public function test_bloquear_conta_impede_login_denuncia_e_voto(): void
    {
        $admin = $this->admin();
        $pessoa = User::factory()->create(['email' => 'pessoa@exemplo.test', 'password' => bcrypt('segredo123')]);
        $pessoa->createToken('app');

        Sanctum::actingAs($admin);
        $this->patchJson("/api/admin/usuarios/{$pessoa->id}", ['bloqueado' => true])->assertUnprocessable(); // motivo obrigatório
        $this->patchJson("/api/admin/usuarios/{$pessoa->id}", ['bloqueado' => true, 'motivo' => 'Denúncias falsas repetidas'])->assertOk();
        $this->assertSame(0, $pessoa->tokens()->count());
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/login', ['email' => 'pessoa@exemplo.test', 'password' => 'segredo123'])->assertForbidden();

        $id = $this->denuncia();
        Sanctum::actingAs($pessoa->fresh());
        $this->postJson("/api/denuncias/{$id}/validar", ['tipo' => 'existe'])->assertForbidden();

        Sanctum::actingAs($admin);
        $this->patchJson("/api/admin/usuarios/{$pessoa->id}", ['bloqueado' => false])->assertOk();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/login', ['email' => 'pessoa@exemplo.test', 'password' => 'segredo123'])->assertOk();
    }

    public function test_promover_administrador_e_protecoes(): void
    {
        $admin = $this->admin();
        $pessoa = User::factory()->create();
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/usuarios/{$admin->id}", ['bloqueado' => true, 'motivo' => 'teste'])->assertUnprocessable();
        $this->patchJson("/api/admin/usuarios/{$pessoa->id}", ['is_admin' => true])->assertOk();
        $this->assertTrue($pessoa->fresh()->is_admin);
        $this->getJson('/api/admin/usuarios?busca='.urlencode($pessoa->name))->assertOk()->assertJsonPath('0.is_admin', true);
    }

    public function test_categorias_editaveis_com_contraste_e_ativacao(): void
    {
        $cat = CategoriaOcorrencia::where('slug', 'entulho')->first();
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/admin/categorias/{$cat->id}", ['nome' => 'Entulho', 'cor' => '#FFF59D', 'ativo' => true])->assertUnprocessable();
        $this->putJson("/api/admin/categorias/{$cat->id}", ['nome' => 'Entulho e restos de obra', 'cor' => '#6B4423', 'ativo' => false])->assertOk();
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/categorias')->assertOk()->assertJsonMissing(['slug' => 'entulho']);
        // Categoria desativada não aceita novas denúncias
        Sanctum::actingAs(User::factory()->create());
        $path = tempnam(sys_get_temp_dir(), 'eco').'.png';
        file_put_contents($path, file_get_contents(base_path('tests/Feature/fixtures/foto-200.png')));
        $this->post('/api/denuncias', [
            'foto' => new UploadedFile($path, 'foto.png', 'image/png', null, true),
            'categoria' => 'entulho', 'titulo' => 'Entulho na calçada', 'latitude' => -23.5, 'longitude' => -47.45,
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors(['categoria']);
    }

    public function test_equipe_gerencia_ecopontos(): void
    {
        Sanctum::actingAs($this->admin());
        $id = $this->postJson('/api/ecopontos', [
            'nome' => 'Ecoponto Novo', 'categoria' => 'ecoponto', 'latitude' => -23.51, 'longitude' => -47.46,
            'endereco' => 'Rua A, 10', 'horario' => 'Seg a Sex · 8h às 17h', 'residuos_aceitos' => ['Entulho', 'Podas'],
        ])->assertCreated()->json('id');
        $this->putJson("/api/ecopontos/{$id}", [
            'nome' => 'Ecoponto Novo (ampliado)', 'categoria' => 'ecoponto', 'latitude' => -23.51, 'longitude' => -47.46,
            'residuos_aceitos' => ['Entulho', 'Podas', 'Móveis'],
        ])->assertOk()->assertJsonPath('nome', 'Ecoponto Novo (ampliado)');
        $this->deleteJson("/api/ecopontos/{$id}")->assertNoContent();
    }
}
