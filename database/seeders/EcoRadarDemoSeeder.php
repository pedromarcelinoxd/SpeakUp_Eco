<?php

namespace Database\Seeders;

use App\Models\Ecoponto;
use Illuminate\Database\Seeder;

/**
 * DADOS DEMONSTRATIVOS (opcional) — pontos de descarte fictícios em Sorocaba,
 * úteis para apresentar o app e o painel com o banco vazio.
 * Todos os nomes terminam com "(demonstração)" e os endereços são ilustrativos.
 *
 *   php artisan db:seed --class=EcoRadarDemoSeeder
 *
 * Para remover: Ecoponto::where('nome', 'like', '%(demonstração)')->delete();
 */
class EcoRadarDemoSeeder extends Seeder
{
    public function run(): void
    {
        $pontos = [
            ['Ecoponto Vila Hortência', 'ecoponto', -23.4905, -47.4465, 'Seg a Sáb · 7h às 17h', ['Entulho (até 1 m³)', 'Móveis', 'Podas', 'Recicláveis']],
            ['Ecoponto Campolim', 'ecoponto', -23.5315, -47.4670, 'Seg a Sáb · 7h às 17h', ['Entulho (até 1 m³)', 'Volumosos', 'Pneus']],
            ['Coleta de Pilhas — Centro', 'pilhas', -23.5003, -47.4571, 'Seg a Sáb · 8h às 20h', ['Pilhas', 'Baterias de celular']],
            ['Central de Eletrônicos', 'eletronicos', -23.5155, -47.4504, 'Seg a Sex · 8h às 17h', ['Computadores', 'Celulares', 'Cabos']],
            ['Ponto de Óleo — Além Ponte', 'oleo', -23.4871, -47.4677, 'Sábados · 7h às 13h', ['Óleo de cozinha usado']],
            ['Descarte de Medicamentos — Vergueiro', 'medicamentos', -23.5128, -47.4781, 'Todos os dias · 7h às 23h', ['Medicamentos vencidos', 'Blísteres']],
            ['Coleta de Lâmpadas — Barcelona', 'lampadas', -23.5154, -47.4409, 'Seg a Sáb · 8h às 20h', ['Lâmpadas fluorescentes', 'Lâmpadas LED']],
            ['Cooperativa de Reciclagem — Ipanema', 'reciclagem', -23.4644, -47.4772, 'Seg a Sex · 8h às 17h', ['Papel', 'Plástico', 'Vidro', 'Metal']],
            ['Coleta de Eletrônicos — Campus FACENS', 'eletronicos', -23.4703, -47.4296, 'Seg a Sex · 8h às 22h', ['Celulares', 'Carregadores', 'Periféricos']],
        ];

        foreach ($pontos as [$nome, $categoria, $lat, $lng, $horario, $residuos]) {
            Ecoponto::updateOrCreate(['nome' => "{$nome} (demonstração)"], [
                'categoria' => $categoria,
                'latitude' => $lat,
                'longitude' => $lng,
                'endereco' => 'Endereço ilustrativo · Sorocaba – SP',
                'horario' => $horario,
                'descricao_local' => 'Local demonstrativo. Confirme horários e materiais antes de se deslocar.',
                'residuos_aceitos' => $residuos,
            ]);
        }
    }
}
