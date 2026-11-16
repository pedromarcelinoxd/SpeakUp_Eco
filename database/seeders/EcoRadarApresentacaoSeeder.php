<?php

namespace Database\Seeders;

use App\Models\Denuncia;
use App\Models\User;
use App\Notifications\EcoRadarNotification;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * DADOS DE APRESENTAÇÃO (opcional): moradores fictícios, denúncias espalhadas por
 * Sorocaba com histórico de status, confirmações, notificações e pontos de descarte.
 *
 *   php artisan db:seed --class=EcoRadarApresentacaoSeeder
 *
 * - Todas as contas fictícias usam e-mails @exemplo.test.
 * - Conta para apresentar:  apresentacao@exemplo.test
 * - Conta da equipe (admin): equipe@exemplo.test (altera status no painel)
 *   Senha das duas: variável ECORADAR_DEMO_PASSWORD (padrão: EcoRadar2026).
 * - Fotos das denúncias: fotos livres da Unsplash (ver database/seeders/fotos/CREDITOS.md).
 * - Fotos de perfil: avatares ilustrados (database/seeders/avatares), não pessoas reais.
 * - Idempotente: se a conta de apresentação já existe, não faz nada.
 *
 * Para remover: apagar usuários com e-mail @exemplo.test (as denúncias saem em cascata)
 * e os ecopontos com "(demonstração)" no nome.
 */
class EcoRadarApresentacaoSeeder extends Seeder
{
    private const DOMINIO = '@exemplo.test';

    public function run(): void
    {
        if (User::where('email', 'apresentacao'.self::DOMINIO)->exists()) {
            $this->command?->info('Dados de apresentação já existem; nada a fazer.');

            return;
        }

        $this->call(EcoRadarDemoSeeder::class);
        self::publicarFotos();

        $senha = Hash::make(env('ECORADAR_DEMO_PASSWORD', 'EcoRadar2026'));
        $agora = Carbon::now();

        // ---------------------------------------------------------- Pessoas
        $equipe = User::create(['name' => 'Equipe SpeakUp Eco', 'email' => 'equipe'.self::DOMINIO, 'password' => $senha, 'bairro' => 'Centro', 'foto_perfil_path' => 'avatares/equipe.jpg']);
        $equipe->forceFill(['is_admin' => true, 'email_verified_at' => $agora])->save();

        $pessoas = [
            ['apresentacao', 'Ana Exemplo', 'Campolim'],
            ['marina', 'Marina Souza', 'Vila Hortência'],
            ['rafael', 'Rafael Lima', 'Jardim Vergueiro'],
            ['juliana', 'Juliana Prado', 'Além Ponte'],
            ['carlos', 'Carlos Menezes', 'Centro'],
            ['beatriz', 'Beatriz Fontes', 'Santa Rosália'],
            ['thiago', 'Thiago Alves', 'Jardim Simus'],
            ['camila', 'Camila Rocha', 'Vila Haro'],
            ['lucas', 'Lucas Ferreira', 'Éden'],
            ['patricia', 'Patrícia Nunes', 'Wanel Ville'],
            ['gabriel', 'Gabriel Martins', 'Jardim Europa'],
            ['larissa', 'Larissa Duarte', 'Vila Carvalho'],
        ];
        $u = [];
        foreach ($pessoas as [$login, $nome, $bairro]) {
            $u[$login] = User::create(['name' => $nome, 'email' => $login.self::DOMINIO, 'password' => $senha, 'bairro' => $bairro, 'foto_perfil_path' => 'avatares/'.$login.'.jpg']);
            $u[$login]->forceFill(['email_verified_at' => $agora])->save();
        }

        // ---------------------------------------------------------- Denúncias
        // [autor, categoria, título, descrição, lat, lng, endereço, criticidade, status, dias atrás, confirmadores]
        $denuncias = [
            ['apresentacao', 'descarte_irregular', 'Sacos de lixo na calçada da praça', 'Vários sacos acumulados há dias ao lado do ponto de ônibus, atraindo animais.', -23.5008, -47.4583, 'Praça Cel. Fernando Prestes, Centro', 'media', 'pendente', 0, ['marina', 'carlos']],
            ['apresentacao', 'entulho', 'Entulho de obra bloqueando a calçada', 'Restos de reforma ocupam metade da passagem; pedestres andam pela rua.', -23.5102, -47.4651, 'Rua Santa Clara, Vila Santana', 'alta', 'em_analise', 3, ['rafael', 'juliana', 'thiago']],
            ['apresentacao', 'queimada', 'Fumaça em terreno baldio', 'Queima de lixo no fim da tarde, fumaça forte entrando nas casas.', -23.4921, -47.4493, 'Jardim Vergueiro', 'alta', 'verificada', 9, ['rafael', 'camila', 'lucas', 'beatriz']],
            ['apresentacao', 'poluicao_agua', 'Óleo no córrego Supiriri', 'Mancha escura na água perto da ponte, com cheiro forte.', -23.5221, -47.4712, 'Av. Dom Aguirre, Campolim', 'media', 'resolvida', 21, ['marina', 'gabriel']],
            ['apresentacao', 'descarte_irregular', 'Sofá abandonado na esquina', 'Móvel velho deixado na calçada há uma semana.', -23.5290, -47.4695, 'Rua Antônio Perez Hernandez, Campolim', 'baixa', 'resolvida', 34, ['larissa']],
            ['marina', 'descarte_irregular', 'Pneus descartados em área verde', 'Cerca de dez pneus jogados perto da trilha, acumulando água.', -23.4898, -47.4402, 'Vila Hortência', 'alta', 'confirmada', 6, ['apresentacao', 'carlos', 'patricia']],
            ['marina', 'dano_ambiental', 'Corte de árvores sem autorização', 'Três árvores derrubadas no canteiro central durante a madrugada.', -23.4935, -47.4378, 'Av. São Paulo, Vila Hortência', 'alta', 'em_analise', 2, ['apresentacao', 'juliana']],
            ['marina', 'entulho', 'Restos de demolição no terreno', 'Caçamba irregular despejada direto no terreno da esquina.', -23.4871, -47.4455, 'Rua Aparecida, Vila Hortência', 'media', 'resolvida', 48, []],
            ['rafael', 'queimada', 'Queimada no pasto ao lado da escola', 'Fogo alto atrás da escola estadual; fumaça na hora da saída.', -23.4855, -47.4521, 'Jardim Vergueiro', 'alta', 'resolvida', 15, ['apresentacao', 'beatriz', 'thiago', 'lucas']],
            ['rafael', 'eletronicos', 'Lixo eletrônico na calçada', 'Monitores e CPUs abandonados em frente ao terreno vazio.', -23.4899, -47.4560, 'Rua Humberto de Campos, Jardim Vergueiro', 'media', 'pendente', 1, []],
            ['juliana', 'poluicao_agua', 'Esgoto a céu aberto', 'Vazamento de esgoto escorrendo pela sarjeta até o córrego.', -23.4862, -47.4688, 'Rua Paula Souza, Além Ponte', 'alta', 'verificada', 11, ['rafael', 'gabriel', 'camila']],
            ['juliana', 'descarte_irregular', 'Lixo acumulado na margem do rio', 'Sacolas e garrafas presas na vegetação da margem.', -23.4840, -47.4710, 'Margem do Rio Sorocaba, Além Ponte', 'media', 'em_analise', 5, ['apresentacao']],
            ['juliana', 'outros', 'Ponto de entrega voluntária cheio', 'Contêiner de recicláveis transbordando há vários dias.', -23.4879, -47.4660, 'Av. Gen. Osório, Além Ponte', 'baixa', 'resolvida', 27, ['marina']],
            ['carlos', 'descarte_irregular', 'Descarte de colchões na rua', 'Dois colchões largados em frente ao comércio fechado.', -23.5032, -47.4551, 'Rua XV de Novembro, Centro', 'baixa', 'resolvida', 40, ['juliana']],
            ['carlos', 'entulho', 'Caçamba irregular na via', 'Caçamba sem sinalização ocupando a faixa de estacionamento.', -23.4998, -47.4610, 'Rua Dr. Braguinha, Centro', 'media', 'nao_confirmada', 19, []],
            ['carlos', 'poluicao_agua', 'Água com espuma no córrego', 'Espuma branca e odor químico perto da galeria pluvial.', -23.5060, -47.4490, 'Av. Afonso Vergueiro, Centro', 'alta', 'pendente', 0, ['beatriz']],
            ['beatriz', 'dano_ambiental', 'Aterro em área de nascente', 'Caminhões despejando terra sobre a nascente do bairro.', -23.5205, -47.4380, 'Santa Rosália', 'alta', 'verificada', 8, ['apresentacao', 'marina', 'lucas', 'larissa', 'patricia']],
            ['beatriz', 'descarte_irregular', 'Restos de poda na calçada', 'Galhos grandes bloqueando a passagem há duas semanas.', -23.5170, -47.4405, 'Rua Vergueiro, Santa Rosália', 'baixa', 'resolvida', 30, []],
            ['thiago', 'entulho', 'Telhas e madeiras no terreno baldio', 'Material de construção abandonado com pregos expostos.', -23.5235, -47.4880, 'Jardim Simus', 'media', 'em_analise', 4, ['gabriel']],
            ['thiago', 'queimada', 'Fogo em vegetação às margens da rodovia', 'Focos de incêndio próximos ao acostamento.', -23.5290, -47.4950, 'Rod. Raposo Tavares, Jardim Simus', 'alta', 'resolvida', 55, ['rafael', 'camila']],
            ['camila', 'descarte_irregular', 'Animais mortos descartados', 'Descarte de restos de animais em saco plástico, mau cheiro forte.', -23.5150, -47.4720, 'Vila Haro', 'alta', 'confirmada', 13, ['juliana', 'thiago']],
            ['camila', 'outros', 'Lixeira pública quebrada', 'Lixeira derrubada e lixo espalhado pela calçada.', -23.5128, -47.4760, 'Rua Coronel Nogueira Padilha, Vila Haro', 'baixa', 'pendente', 2, []],
            ['lucas', 'poluicao_agua', 'Lixo boiando no lago do parque', 'Garrafas PET e isopor acumulados no canto do lago.', -23.4985, -47.4335, 'Parque Campolim', 'media', 'resolvida', 25, ['apresentacao', 'marina']],
            ['lucas', 'dano_ambiental', 'Captura de pássaros silvestres', 'Gaiolas com pássaros silvestres expostas para venda.', -23.4790, -47.4420, 'Éden', 'alta', 'em_analise', 6, []],
            ['patricia', 'descarte_irregular', 'Entulho e lixo doméstico misturados', 'Montanha de lixo cresce a cada semana na esquina.', -23.5345, -47.4590, 'Wanel Ville', 'alta', 'verificada', 10, ['carlos', 'beatriz', 'lucas']],
            ['patricia', 'entulho', 'Restos de reforma em praça', 'Azulejos e cimento descartados ao lado do parquinho.', -23.5378, -47.4625, 'Praça do Wanel Ville', 'media', 'pendente', 1, ['larissa']],
            ['gabriel', 'queimada', 'Queima de fios para retirar cobre', 'Fumaça preta com cheiro de plástico queimado à noite.', -23.4705, -47.4602, 'Jardim Europa', 'alta', 'resolvida', 38, ['juliana', 'rafael']],
            ['gabriel', 'eletronicos', 'Baterias e celulares no terreno', 'Baterias estufadas e celulares quebrados jogados no mato.', -23.4740, -47.4655, 'Jardim Europa', 'alta', 'verificada', 7, ['apresentacao', 'patricia', 'camila']],
            ['larissa', 'poluicao_agua', 'Bueiro entupido com lixo', 'Bueiro transborda a cada chuva por causa do lixo acumulado.', -23.5080, -47.4800, 'Vila Carvalho', 'media', 'em_analise', 3, ['thiago']],
            ['larissa', 'outros', 'Faltam lixeiras de coleta seletiva', 'Rua inteira sem ponto de coleta seletiva; moradores misturam tudo.', -23.5055, -47.4840, 'Vila Carvalho', 'baixa', 'nao_confirmada', 44, []],
            ['marina', 'descarte_irregular', 'Garrafas de vidro quebradas na calçada', 'Cacos de vidro espalhados perto da escola.', -23.4920, -47.4430, 'Vila Hortência', 'media', 'possivelmente_resolvida', 18, ['lucas']],
            ['rafael', 'dano_ambiental', 'Desmatamento em área de preservação', 'Máquinas abrindo clareira em mata ciliar.', -23.4780, -47.4510, 'Jardim Vergueiro', 'alta', 'verificada', 16, ['juliana', 'marina', 'gabriel', 'patricia']],
            ['juliana', 'entulho', 'Concreto descartado no acostamento', 'Blocos de concreto deixados no acostamento da avenida.', -23.4820, -47.4745, 'Av. Ipanema, Além Ponte', 'media', 'resolvida', 60, ['carlos']],
            ['carlos', 'outros', 'Odor forte vindo de galpão', 'Cheiro de produto químico perto do galpão desativado.', -23.4965, -47.4640, 'Centro', 'media', 'em_analise', 2, ['larissa']],
            ['beatriz', 'poluicao_agua', 'Tinta despejada na sarjeta', 'Resíduo de tinta escorrendo até a boca de lobo.', -23.5190, -47.4440, 'Santa Rosália', 'media', 'pendente', 0, []],
            ['thiago', 'descarte_irregular', 'Restos de feira no chão', 'Caixas e frutas estragadas deixadas após a feira de domingo.', -23.5260, -47.4840, 'Jardim Simus', 'baixa', 'resolvida', 12, ['camila']],
            ['camila', 'entulho', 'Gesso e drywall abandonados', 'Placas de gesso deixadas ao lado da lixeira.', -23.5165, -47.4690, 'Vila Haro', 'baixa', 'em_analise', 1, []],
            ['lucas', 'queimada', 'Fogo em terreno com lixo', 'Lixo pegando fogo e fumaça atravessando a rua.', -23.4810, -47.4385, 'Éden', 'alta', 'pendente', 0, ['gabriel']],
            ['patricia', 'poluicao_agua', 'Córrego com cor alterada', 'Água amarelada e peixes mortos na margem.', -23.5320, -47.4555, 'Wanel Ville', 'alta', 'resolvida', 29, ['beatriz', 'carlos', 'apresentacao']],
            ['gabriel', 'outros', 'Carcaça de carro abandonada', 'Carro sem rodas parado há meses, juntando lixo e água.', -23.4720, -47.4580, 'Jardim Europa', 'media', 'nao_confirmada', 36, []],
        ];

        $observacoes = [
            'confirmada' => 'Pessoas da comunidade confirmaram que o problema existe.',
            'possivelmente_resolvida' => '1 pessoa informou que o problema foi resolvido. Aguardando mais validações.',
            'em_analise' => 'Equipe iniciou a análise da ocorrência.',
            'verificada' => 'Ocorrência confirmada pela equipe no local.',
            'resolvida' => 'Órgão responsável fez a limpeza/solução no local.',
            'nao_confirmada' => 'Equipe não encontrou a ocorrência no endereço informado.',
        ];
        // [status, origem] de cada etapa até o status final
        $caminho = [
            'pendente' => [],
            'confirmada' => [['confirmada', 'comunidade']],
            'em_analise' => [['em_analise', 'equipe']],
            'verificada' => [['em_analise', 'equipe'], ['verificada', 'equipe']],
            'possivelmente_resolvida' => [['confirmada', 'comunidade'], ['possivelmente_resolvida', 'comunidade']],
            'resolvida' => [['em_analise', 'equipe'], ['verificada', 'equipe'], ['resolvida', 'equipe']],
            'nao_confirmada' => [['em_analise', 'equipe'], ['nao_confirmada', 'equipe']],
        ];

        foreach ($denuncias as $i => [$autor, $cat, $titulo, $descricao, $lat, $lng, $endereco, $crit, $status, $dias, $confirmadores]) {
            $criada = $agora->copy()->subDays($dias)->subHours(($i * 5) % 11 + 1)->subMinutes(($i * 17) % 50);
            $d = new Denuncia([
                'categoria' => $cat, 'titulo' => $titulo, 'descricao' => $descricao,
                'latitude' => $lat, 'longitude' => $lng, 'endereco' => $endereco.' · Sorocaba – SP',
                'foto_path' => 'demo/'.$cat.'-'.($i % 2 + 1).'.jpg',
                'criticidade' => $crit, 'status' => $status, 'origem' => $i % 3 === 0 ? 'web' : 'app',
            ]);
            $d->user_id = $u[$autor]->id;
            $d->created_at = $criada;
            $d->updated_at = $criada;
            $d->save();

            $this->historico($d, 'pendente', $u[$autor]->id, 'Denúncia registrada. Aguardando validação da comunidade.', $criada, 'autor');
            $passo = $criada->copy();
            foreach ($caminho[$status] as $k => [$st, $origem]) {
                $passo = $passo->copy()->addHours(6 + $k * 20);
                if ($passo->greaterThan($agora)) {
                    $passo = $agora->copy()->subMinutes(10 - $k);
                }
                $this->historico($d, $st, $origem === 'equipe' ? $equipe->id : null, $observacoes[$st], $passo, $origem);
            }
            if ($caminho[$status]) {
                DB::table('denuncias')->where('id', $d->id)->update(['updated_at' => $passo]);
            }

            // Votos da comunidade: confirmações e, nas resolvidas pela comunidade, avisos de resolução
            foreach ($confirmadores as $j => $login) {
                $quando = $criada->copy()->addHours(2 + $j * 3);
                DB::table('denuncia_validacoes')->insert([
                    'denuncia_id' => $d->id, 'user_id' => $u[$login]->id, 'votante' => 'u:'.$u[$login]->id,
                    'tipo' => 'existe', 'created_at' => $quando, 'updated_at' => $quando,
                ]);
            }
            if ($status === 'possivelmente_resolvida') {
                $votante = $u['camila'];
                DB::table('denuncia_validacoes')->insert([
                    'denuncia_id' => $d->id, 'user_id' => $votante->id, 'votante' => 'u:'.$votante->id,
                    'tipo' => 'resolvida', 'created_at' => $passo, 'updated_at' => $passo,
                ]);
            }

            // Notificações para a conta de apresentação (o que o usuário veria no app)
            if ($autor === 'apresentacao' && $status !== 'pendente') {
                $d->refresh();
                $u['apresentacao']->notifyNow(EcoRadarNotification::statusAtualizado($d), ['database']);
            }
            if ($autor === 'apresentacao' && count($confirmadores) > 0) {
                $u['apresentacao']->notifyNow(EcoRadarNotification::confirmada($d, count($confirmadores)), ['database']);
            }
        }

        $this->command?->info('Dados de apresentação criados: '.count($pessoas).' moradores, '.count($denuncias).' denúncias.');
    }

    private function historico(Denuncia $d, string $status, ?int $autor, string $obs, Carbon $quando, string $origem): void
    {
        DB::table('denuncia_status_historico')->insert([
            'denuncia_id' => $d->id, 'user_id' => $autor, 'status' => $status, 'origem' => $origem, 'observacao' => $obs,
            'created_at' => $quando, 'updated_at' => $quando,
        ]);
    }

    /**
     * Copia as fotos de exemplo para o disco público (storage/app/public/demo e
     * /avatares) e aplica os avatares aos moradores fictícios que ainda não têm foto.
     * Chamado também na inicialização do servidor, porque o disco da hospedagem
     * gratuita é apagado a cada reinício.
     */
    public static function publicarFotos(): void
    {
        $pastas = ['seeders/fotos' => 'demo', 'seeders/avatares' => 'avatares'];
        foreach ($pastas as $origem => $destino) {
            foreach (glob(database_path($origem.'/*.jpg')) as $arquivo) {
                $alvo = $destino.'/'.basename($arquivo);
                $disco = Storage::disk('public');
                // Atualiza se o arquivo mudou (ex.: troca das imagens de exemplo)
                if (! $disco->exists($alvo) || $disco->size($alvo) !== filesize($arquivo)) {
                    $disco->put($alvo, file_get_contents($arquivo));
                }
            }
        }

        // Moradores fictícios (@exemplo.test) sem foto recebem o avatar com o mesmo nome
        foreach (User::where('email', 'like', '%'.self::DOMINIO)->whereNull('foto_perfil_path')->get() as $user) {
            $login = strstr($user->email, '@', true);
            if (file_exists(database_path("seeders/avatares/{$login}.jpg"))) {
                $user->forceFill(['foto_perfil_path' => "avatares/{$login}.jpg"])->save();
            }
        }
    }
}
