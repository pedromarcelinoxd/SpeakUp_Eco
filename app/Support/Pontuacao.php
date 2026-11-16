<?php

namespace App\Support;

use App\Models\Denuncia;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Regras de pontuação do SpeakUp Eco — única fonte para app, painel e ranking.
 *
 *  - Denúncia validada (verificada ou resolvida): +50
 *  - Confirmação de ocorrência que foi validada:  +10
 *
 * Pontos só existem após validação, para não incentivar denúncias falsas.
 */
class Pontuacao
{
    public const DENUNCIA_VALIDADA = 50;

    public const CONFIRMACAO_VALIDADA = 10;

    public const NIVEIS = [
        ['chave' => 'semente', 'nome' => 'Semente', 'minimo' => 0],
        ['chave' => 'broto', 'nome' => 'Broto', 'minimo' => 200],
        ['chave' => 'guardiao', 'nome' => 'Guardião Ambiental', 'minimo' => 600],
        ['chave' => 'protetor', 'nome' => 'Protetor Ambiental', 'minimo' => 1500],
    ];

    /**
     * Pontos por usuário desde uma data (null = todo o período).
     *
     * @return Collection<int, int> user_id => pontos
     */
    public static function porUsuario(?CarbonInterface $desde = null): Collection
    {
        $validadas = DB::table('denuncias')
            ->whereNotNull('user_id')
            ->whereIn('status', Denuncia::STATUS_VALIDADOS)
            ->when($desde, fn ($q) => $q->where('created_at', '>=', $desde))
            ->groupBy('user_id')
            ->select('user_id', DB::raw('count(*) as total'))
            ->pluck('total', 'user_id');

        // Validações comunitárias feitas com conta, em ocorrências que se confirmaram
        $confirmacoes = DB::table('denuncia_validacoes')
            ->join('denuncias', 'denuncias.id', '=', 'denuncia_validacoes.denuncia_id')
            ->whereNotNull('denuncia_validacoes.user_id')
            ->whereIn('denuncias.status', Denuncia::STATUS_VALIDADOS)
            ->when($desde, fn ($q) => $q->where('denuncia_validacoes.created_at', '>=', $desde))
            ->groupBy('denuncia_validacoes.user_id')
            ->select('denuncia_validacoes.user_id', DB::raw('count(*) as total'))
            ->pluck('total', 'denuncia_validacoes.user_id');

        return $validadas->keys()->merge($confirmacoes->keys())->unique()
            ->mapWithKeys(fn ($id) => [
                $id => (int) ($validadas[$id] ?? 0) * self::DENUNCIA_VALIDADA
                    + (int) ($confirmacoes[$id] ?? 0) * self::CONFIRMACAO_VALIDADA,
            ]);
    }

    public static function doUsuario(User $user): int
    {
        return (int) (self::porUsuario()->get($user->id) ?? 0);
    }

    public static function nivel(int $pontos): array
    {
        $atual = self::NIVEIS[0];
        $proximo = null;
        foreach (self::NIVEIS as $i => $nivel) {
            if ($pontos >= $nivel['minimo']) {
                $atual = $nivel;
                $proximo = self::NIVEIS[$i + 1] ?? null;
            }
        }

        return [
            ...$atual,
            'proximo' => $proximo,
            'faltam' => $proximo ? $proximo['minimo'] - $pontos : 0,
        ];
    }
}
