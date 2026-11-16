<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Denuncia;
use App\Models\PushToken;
use App\Models\User;
use App\Support\Pontuacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Ranking, resumo do perfil, notificações e tokens de push.
 * Compartilhado entre o app mobile e o painel web.
 */
class EngajamentoController extends Controller
{
    /** GET /api/ranking?periodo=semanal|mensal|geral (público) */
    public function ranking(Request $request): JsonResponse
    {
        $request->validate(['periodo' => ['nullable', Rule::in(['semanal', 'mensal', 'geral'])]]);
        $periodo = $request->input('periodo', 'semanal');
        $desde = match ($periodo) {
            'semanal' => now()->subWeek(),
            'mensal' => now()->subMonth(),
            default => null,
        };

        $pontos = Pontuacao::porUsuario($desde)->filter(fn ($p) => $p > 0)->sortDesc();
        $totais = Pontuacao::porUsuario();
        $usuarios = User::whereIn('id', $pontos->keys())->get(['id', 'name', 'bairro', 'foto_perfil_path'])->keyBy('id');

        $posicao = 0;
        $lista = $pontos->take(50)->map(function ($p, $id) use (&$posicao, $usuarios, $totais) {
            $u = $usuarios[$id];
            $total = (int) ($totais[$id] ?? 0);

            return [
                'posicao' => ++$posicao,
                'user_id' => $id,
                'nome' => $u->name,
                'bairro' => $u->bairro,
                'foto_url' => $u->foto_perfil_path ? asset('storage/'.$u->foto_perfil_path) : null,
                'pontos' => $p,
                'pontos_total' => $total,
                'nivel' => Pontuacao::nivel($total)['nome'],
            ];
        })->values();

        $eu = null;
        if ($user = $request->user('sanctum')) {
            $index = $pontos->keys()->search($user->id);
            $eu = [
                'posicao' => $index === false ? null : $index + 1,
                'pontos' => (int) ($pontos[$user->id] ?? 0),
            ];
        }

        return response()->json(['periodo' => $periodo, 'ranking' => $lista, 'eu' => $eu]);
    }

    /** GET /api/perfil/resumo — estatísticas, pontos e nível do usuário autenticado */
    public function resumo(Request $request): JsonResponse
    {
        $user = $request->user();
        $pontos = Pontuacao::doUsuario($user);

        return response()->json([
            'user' => $user,
            'foto_perfil_url' => $user->foto_perfil_path ? asset('storage/'.$user->foto_perfil_path) : null,
            'pontos' => $pontos,
            'nivel' => Pontuacao::nivel($pontos),
            'estatisticas' => [
                'enviadas' => $user->denuncias()->count(),
                'validadas' => $user->denuncias()->whereIn('status', Denuncia::STATUS_VALIDADOS)->count(),
                'resolvidas' => $user->denuncias()->where('status', 'resolvida')->count(),
                'confirmacoes' => $user->validacoes()->count(),
            ],
            'regras' => [
                'denuncia_validada' => Pontuacao::DENUNCIA_VALIDADA,
                'confirmacao_validada' => Pontuacao::CONFIRMACAO_VALIDADA,
            ],
        ]);
    }

    /** GET /api/notificacoes */
    public function notificacoes(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'nao_lidas' => $user->unreadNotifications()->count(),
            'notificacoes' => $user->notifications()->latest()->limit(50)->get()->map(fn ($n) => [
                'id' => $n->id,
                ...$n->data,
                'lida' => $n->read_at !== null,
                'data' => $n->created_at,
            ]),
        ]);
    }

    /** POST /api/notificacoes/{id}/lida */
    public function marcarLida(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->firstOrFail()->markAsRead();

        return response()->json(['ok' => true]);
    }

    /** POST /api/notificacoes/lidas */
    public function marcarTodasLidas(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }

    /** POST /api/push-tokens — registra o token Expo do dispositivo */
    public function registrarPush(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255', 'regex:/^(ExponentPushToken|ExpoPushToken)\[.+\]$/'],
            'plataforma' => ['nullable', Rule::in(['ios', 'android'])],
        ]);

        // Um token pertence a um único usuário (troca de conta no mesmo aparelho).
        PushToken::updateOrCreate(['token' => $data['token']], [
            'user_id' => $request->user()->id,
            'plataforma' => $data['plataforma'] ?? null,
        ]);

        return response()->json(['ok' => true], 201);
    }

    /** DELETE /api/push-tokens — remove o token ao sair da conta */
    public function removerPush(Request $request): JsonResponse
    {
        $request->validate(['token' => ['required', 'string']]);
        $request->user()->pushTokens()->where('token', $request->token)->delete();

        return response()->json(null, 204);
    }
}
