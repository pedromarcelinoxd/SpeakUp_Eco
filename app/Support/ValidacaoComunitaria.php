<?php

namespace App\Support;

use App\Models\Denuncia;
use App\Models\DenunciaValidacao;
use App\Notifications\EcoRadarNotification;
use Illuminate\Support\Facades\DB;

/**
 * Regras da validação comunitária (não é confirmação oficial da prefeitura).
 *
 * Validar exige conta. Cada pessoa tem um voto por ocorrência — "existe" ou "resolvida" — e pode mudar
 * de opinião, mas não votar duas vezes. O autor não vota na própria denúncia.
 * Nenhuma pessoa sozinha muda o status: ele é recalculado a partir dos votos.
 *
 *  - N votos "existe" (confirmar_minimo)                       → confirmada
 *  - votos "resolvida" ≥ possivel_resolucao_minimo e superando
 *    os "existe" dados depois do primeiro aviso de resolução    → possivelmente_resolvida
 *  - votos "resolvida" ≥ resolver_minimo, com a mesma condição  → resolvida
 *
 * Status oficiais da equipe (em_analise, verificada) são preservados, exceto
 * quando a comunidade indica resolução. Ocorrências encerradas não recebem votos.
 */
class ValidacaoComunitaria
{
    /** Motivo pelo qual o votante não pode votar, ou null se pode. */
    public const PRECISA_LOGIN = 'Entre na sua conta para validar ocorrências.';

    public static function bloqueio(Denuncia $denuncia, ?Votante $votante): ?string
    {
        if ($denuncia->oculta_em) {
            return 'Esta ocorrência foi retirada do mapa pela moderação.';
        }
        if (in_array($denuncia->status, Denuncia::STATUS_FINAIS, true)) {
            return 'Esta ocorrência já foi encerrada.';
        }
        // Validar exige conta (consultar continua livre)
        if (! $votante?->user) {
            return self::PRECISA_LOGIN;
        }
        if ($votante->user->bloqueado_em) {
            return 'Esta conta está bloqueada e não pode validar ocorrências.';
        }
        if ($votante->ehAutor($denuncia)) {
            return 'Você registrou esta denúncia; a validação é feita por outras pessoas.';
        }

        return null;
    }

    /**
     * Registra (ou atualiza) o voto e recalcula o status.
     *
     * @return array{novo: bool, status_mudou: bool}
     */
    public static function votar(Denuncia $denuncia, Votante $votante, string $tipo): array
    {
        return DB::transaction(function () use ($denuncia, $votante, $tipo) {
            $voto = DenunciaValidacao::where('denuncia_id', $denuncia->id)
                ->whereIn('votante', $votante->chaves())
                ->lockForUpdate()
                ->first();

            $novo = ! $voto;
            if ($novo) {
                $voto = DenunciaValidacao::create([
                    'denuncia_id' => $denuncia->id,
                    'user_id' => $votante->user?->id,
                    'votante' => $votante->chave(),
                    'tipo' => $tipo,
                ]);
            } elseif ($voto->tipo !== $tipo) {
                $voto->update(['tipo' => $tipo]);
            } else {
                return ['novo' => false, 'status_mudou' => false];
            }

            $mudou = self::recalcular($denuncia->refresh());

            if ($novo && $tipo === 'existe' && ! $mudou && $denuncia->user) {
                $total = $denuncia->validacoes()->where('tipo', 'existe')->count();
                $denuncia->user->notify(EcoRadarNotification::confirmada($denuncia, $total));
            }

            return ['novo' => $novo, 'status_mudou' => $mudou];
        });
    }

    /** Recalcula o status a partir dos votos. Retorna true se mudou. */
    public static function recalcular(Denuncia $denuncia): bool
    {
        if (in_array($denuncia->status, Denuncia::STATUS_FINAIS, true)) {
            return false;
        }

        $cfg = config('ecoradar.validacao');
        $votos = $denuncia->validacoes()->get(['tipo', 'updated_at']);
        $existe = $votos->where('tipo', 'existe');
        $resolvida = $votos->where('tipo', 'resolvida');

        // Confirmações dadas depois do primeiro aviso de resolução contestam a resolução.
        $primeiraResolucao = $resolvida->min('updated_at');
        $contestacoes = $primeiraResolucao
            ? $existe->filter(fn ($v) => $v->updated_at > $primeiraResolucao)->count()
            : 0;
        $r = $resolvida->count();

        // Base: último status oficial da equipe, ou o estado da comunidade.
        // reorder(): a relação historico() já ordena do mais antigo para o mais novo
        $oficial = $denuncia->historico()->reorder()->where('origem', 'equipe')
            ->whereIn('status', ['em_analise', 'verificada'])->orderByDesc('id')->value('status');
        $base = $oficial ?? ($existe->count() >= $cfg['confirmar_minimo'] ? 'confirmada' : 'pendente');

        $novo = match (true) {
            $r >= $cfg['resolver_minimo'] && $r > $contestacoes => 'resolvida',
            $r >= $cfg['possivel_resolucao_minimo'] && $r > $contestacoes => 'possivelmente_resolvida',
            default => $base,
        };

        if ($novo === $denuncia->status) {
            return false;
        }

        $observacao = match ($novo) {
            'confirmada' => self::pessoas($existe->count()).' confirmaram que o problema existe.',
            'possivelmente_resolvida' => ($r === 1 ? '1 pessoa informou' : "{$r} pessoas informaram").' que o problema foi resolvido. Aguardando mais validações.',
            'resolvida' => 'Resolução confirmada por '.mb_strtolower(self::pessoas($r)).' da comunidade.',
            default => 'Novas confirmações indicam que o problema ainda existe.',
        };

        $denuncia->update(['status' => $novo]);
        $denuncia->registrarStatus($novo, null, $observacao, 'comunidade');
        $denuncia->user?->notify(EcoRadarNotification::statusAtualizado($denuncia));

        return true;
    }

    private static function pessoas(int $n): string
    {
        return $n === 1 ? '1 pessoa' : "{$n} pessoas";
    }
}
