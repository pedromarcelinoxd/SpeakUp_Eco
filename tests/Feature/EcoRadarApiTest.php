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
 * Integração app mobile ⇄ painel web pela API central:
 * uma denúncia criada por um cliente aparece no outro, com as mesmas regras.
 */
class EcoRadarApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Http::fake([ExpoPushChannel::ENDPOINT => Http::response(['data' => [['status' => 'ok']]])]);
    }

    /** PNG 1x1 real (o ambiente de testes não tem GD para gerar imagens). */
    private function foto(string $nome = 'foto.png'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'eco').'.png';
        file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));

        return new UploadedFile($path, $nome, 'image/png', null, true);
    }

    private function denunciaPeloApp(User $user, array $extra = []): Denuncia
    {
        Sanctum::actingAs($user);
        $res = $this->post('/api/denuncias', [
            'foto' => $this->foto(),
            'fotos' => [$this->foto('extra.png')],
            'categoria' => 'queimada',
            'titulo' => 'Foco de queimada no terreno',
            'descricao' => 'Fumaça intensa vista do ponto de ônibus.',
            'latitude' => -23.5015,
            'longitude' => -47.458,
            'endereco' => 'Centro, Sorocaba',
            'criticidade' => 'alta',
            'origem' => 'app',
            ...$extra,
        ], ['Accept' => 'application/json']);
        $res->assertCreated();

        return Denuncia::findOrFail($res->json('id'));
    }

    public function test_denuncia_do_app_aparece_para_o_painel_web(): void
    {
        $autor = User::factory()->create();
        $denuncia = $this->denunciaPeloApp($autor);

        $this->assertSame('app', $denuncia->origem);
        $this->assertCount(1, $denuncia->fotos_extras);
        Storage::disk('public')->assertExists($denuncia->foto_path);

        // Outro usuário (ex.: no painel web) enxerga a mesma denúncia
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/denuncias')
            ->assertOk()
            ->assertJsonPath('0.id', $denuncia->id)
            ->assertJsonPath('0.titulo', 'Foco de queimada no terreno')
            ->assertJsonPath('0.latitude', -23.5015)
            ->assertJsonPath('0.origem', 'app')
            ->assertJsonCount(2, '0.fotos')
            ->assertJsonPath('0.permissoes.confirmar', true)
            ->assertJsonPath('0.permissoes.alterar_status', false);

        $this->getJson("/api/denuncias/{$denuncia->id}")
            ->assertOk()
            ->assertJsonPath('historico.0.status', 'pendente');
    }

    public function test_formato_legado_do_campus_continua_aceito(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->post('/api/denuncias', [
            'foto' => $this->foto(),
            'ponto_referencia' => 'predio_a',
            'criticidade' => 'baixa',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('ponto_referencia', 'predio_a')
            ->assertJsonPath('origem', 'web');
    }

    public function test_localizacao_e_obrigatoria(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->post('/api/denuncias', ['foto' => $this->foto(), 'criticidade' => 'media'], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude', 'ponto_referencia']);
    }

    public function test_texto_com_codificacao_invalida_e_rejeitado(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->post('/api/denuncias', [
            'foto' => $this->foto(),
            'titulo' => "Fuma\xE7a no terreno", // byte Latin-1 (0xE7): não é UTF-8
            'latitude' => -23.5,
            'longitude' => -47.45,
            'criticidade' => 'media',
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['titulo']);

        $this->assertDatabaseCount('denuncias', 0);
        $this->getJson('/api/denuncias')->assertOk();
    }

    public function test_somente_admin_altera_status_e_autor_e_notificado_com_push(): void
    {
        $autor = User::factory()->create();
        $autor->pushTokens()->create(['token' => 'ExponentPushToken[abc123]', 'plataforma' => 'android']);
        $denuncia = $this->denunciaPeloApp($autor);

        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/denuncias/{$denuncia->id}/status", ['status' => 'resolvida'])->assertForbidden();

        $this->travel(1)->minutes();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($admin);
        $this->patchJson("/api/denuncias/{$denuncia->id}/status", ['status' => 'verificada', 'observacao' => 'Equipe confirmou no local'])
            ->assertOk()
            ->assertJsonPath('status', 'verificada')
            ->assertJsonPath('historico.1.observacao', 'Equipe confirmou no local');

        // Notificação gravada (lida pelo app e pelo painel) + push enviado ao dispositivo
        Sanctum::actingAs($autor);
        $this->getJson('/api/notificacoes')
            ->assertOk()
            ->assertJsonPath('notificacoes.0.titulo', 'Sua denúncia foi verificada')
            ->assertJsonPath('nao_lidas', 2);
        Http::assertSent(fn ($req) => $req->url() === ExpoPushChannel::ENDPOINT
            && $req[0]['to'] === 'ExponentPushToken[abc123]'
            && $req[0]['title'] === 'Sua denúncia foi verificada');

        $this->postJson('/api/notificacoes/lidas')->assertOk();
        $this->getJson('/api/notificacoes')->assertJsonPath('nao_lidas', 0);
    }

    public function test_confirmacoes_e_ranking_seguem_as_regras(): void
    {
        $autor = User::factory()->create(['name' => 'Autora']);
        $vizinho = User::factory()->create(['name' => 'Vizinho']);
        $denuncia = $this->denunciaPeloApp($autor);

        // Autor não confirma a própria denúncia
        Sanctum::actingAs($autor);
        $this->postJson("/api/denuncias/{$denuncia->id}/confirmar")->assertForbidden();

        Sanctum::actingAs($vizinho);
        $this->postJson("/api/denuncias/{$denuncia->id}/confirmar")
            ->assertOk()
            ->assertJsonPath('confirmacoes_count', 1)
            ->assertJsonPath('confirmada_por_mim', true);
        $this->postJson("/api/denuncias/{$denuncia->id}/confirmar")->assertJsonPath('confirmacoes_count', 1);

        // Sem validação, ninguém pontua
        $this->getJson('/api/ranking?periodo=geral')->assertOk()->assertJsonCount(0, 'ranking');

        $denuncia->update(['status' => 'resolvida']);
        $this->getJson('/api/ranking?periodo=semanal')
            ->assertOk()
            ->assertJsonPath('ranking.0.nome', 'Autora')
            ->assertJsonPath('ranking.0.pontos', 50)
            ->assertJsonPath('ranking.1.nome', 'Vizinho')
            ->assertJsonPath('ranking.1.pontos', 10)
            ->assertJsonPath('eu.posicao', 2);

        // Denúncia resolvida não aceita novas confirmações
        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/denuncias/{$denuncia->id}/confirmar")->assertForbidden();

        Sanctum::actingAs($autor);
        $this->getJson('/api/perfil/resumo')
            ->assertOk()
            ->assertJsonPath('pontos', 50)
            ->assertJsonPath('estatisticas.validadas', 1)
            ->assertJsonPath('nivel.nome', 'Semente');
    }

    public function test_autor_exclui_apenas_enquanto_pendente(): void
    {
        $autor = User::factory()->create();
        $denuncia = $this->denunciaPeloApp($autor);

        Sanctum::actingAs(User::factory()->create());
        $this->deleteJson("/api/denuncias/{$denuncia->id}")->assertForbidden();

        $denuncia->update(['status' => 'em_analise']);
        Sanctum::actingAs($autor);
        $this->deleteJson("/api/denuncias/{$denuncia->id}")->assertForbidden();

        $denuncia->update(['status' => 'pendente']);
        $this->deleteJson("/api/denuncias/{$denuncia->id}")->assertNoContent();
        Storage::disk('public')->assertMissing($denuncia->foto_path);
        $this->getJson('/api/notificacoes')->assertJsonCount(0, 'notificacoes');
    }

    public function test_push_token_e_ecopontos_geolocalizados(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/push-tokens', ['token' => 'invalido'])->assertUnprocessable();
        $this->postJson('/api/push-tokens', ['token' => 'ExponentPushToken[xyz]', 'plataforma' => 'ios'])->assertCreated();
        $this->assertDatabaseHas('push_tokens', ['user_id' => $user->id, 'token' => 'ExponentPushToken[xyz]']);

        $ponto = $this->postJson('/api/ecopontos', [
            'nome' => 'Coleta de pilhas',
            'categoria' => 'pilhas',
            'latitude' => -23.47,
            'longitude' => -47.43,
            'residuos_aceitos' => ['Pilhas'],
        ])->assertCreated()->json('id');

        // Apenas administradores alteram ou removem ecopontos
        $this->deleteJson("/api/ecopontos/{$ponto}")->assertForbidden();

        $this->getJson('/api/ecopontos')->assertOk()->assertJsonPath('0.categoria', 'pilhas');
    }
}
