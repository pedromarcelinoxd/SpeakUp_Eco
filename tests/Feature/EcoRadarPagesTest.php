<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Garante que todas as páginas da interface EcoRadar renderizam
 * e que a rota raiz da API continua inalterada.
 */
class EcoRadarPagesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public static function pages(): array
    {
        return [
            'visão geral' => ['/app', 'Confira o que está acontecendo na sua região.'],
            'mapa' => ['/app/mapa', 'Pesquisar local ou categoria...'],
            'denúncias' => ['/app/denuncias', 'Pesquisar por título ou bairro'],
            'nova denúncia' => ['/app/denuncias/nova', 'Ajude a cuidar do meio ambiente.'],
            'detalhe denúncia' => ['/app/denuncias/d-1042', 'Acompanhamento'],
            'pontos de descarte' => ['/app/descarte', 'Encontre o destino correto para seus resíduos.'],
            'detalhe ponto' => ['/app/descarte/p-01', 'Materiais aceitos'],
            'ranking' => ['/app/ranking', 'Guardiões da cidade'],
            'panorama' => ['/app/panorama', 'Mapa de calor das ocorrências'],
            'perfil' => ['/app/perfil', 'Minhas denúncias'],
            'notificações' => ['/app/notificacoes', 'Marcar todas como lidas'],
            'configurações' => ['/app/configuracoes', 'Exibir dados demonstrativos'],
            'entrar' => ['/app/entrar', 'Explorar no modo demonstração'],
        ];
    }

    #[DataProvider('pages')]
    public function test_page_renders(string $url, string $text): void
    {
        $this->get($url)->assertOk()->assertSee($text, false);
    }

    public function test_api_root_status_is_preserved(): void
    {
        $this->get('/')->assertOk()->assertExactJson(['api' => 'Laravel API', 'status' => 'online']);
    }

    public function test_invalid_ids_are_rejected(): void
    {
        $this->get('/app/denuncias/<script>')->assertNotFound();
    }
}
