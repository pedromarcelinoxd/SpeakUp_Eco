<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DenunciaResource;
use App\Models\CategoriaOcorrencia;
use App\Models\Denuncia;
use App\Models\DenunciaValidacao;
use App\Models\Ecoponto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Administração do EcoRadar (rotas /api/admin, só para a equipe — middleware "admin").
 * Indicadores, moderação de denúncias, contas e categorias. Ecopontos usam as
 * rotas /api/ecopontos, também restritas à equipe.
 */
class AdminController extends Controller
{
    /** GET /api/admin/resumo — indicadores e regras em vigor */
    public function resumo(): JsonResponse
    {
        $porStatus = Denuncia::whereNull('oculta_em')->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->pluck('total', 'status');

        // Tempo médio entre o registro e a resolução (últimos 90 dias)
        $resolucoes = DB::table('denuncia_status_historico as h')
            ->join('denuncias as d', 'd.id', '=', 'h.denuncia_id')
            ->where('h.status', 'resolvida')
            ->where('h.created_at', '>=', now()->subDays(90))
            ->get(['d.created_at as criada', 'h.created_at as resolvida']);
        $horas = $resolucoes->map(fn ($r) => (strtotime($r->resolvida) - strtotime($r->criada)) / 3600)->filter(fn ($h) => $h >= 0);

        return response()->json([
            'denuncias' => [
                'total' => Denuncia::whereNull('oculta_em')->count(),
                'por_status' => $porStatus,
                'aguardando_moderacao' => Denuncia::whereNull('oculta_em')->whereIn('status', ['pendente', 'confirmada', 'possivelmente_resolvida'])->count(),
                'novas_7_dias' => Denuncia::where('created_at', '>=', now()->subDays(7))->count(),
                'resolvidas_30_dias' => DB::table('denuncia_status_historico')->where('status', 'resolvida')->where('created_at', '>=', now()->subDays(30))->distinct('denuncia_id')->count('denuncia_id'),
                'ocultas' => Denuncia::whereNotNull('oculta_em')->count(),
                'sem_conta' => Denuncia::whereNull('user_id')->count(),
                'tempo_medio_solucao_horas' => $horas->isEmpty() ? null : round($horas->avg(), 1),
                'por_categoria' => Denuncia::whereNull('oculta_em')->select('categoria', DB::raw('count(*) as total'))->groupBy('categoria')->pluck('total', 'categoria'),
            ],
            'validacoes_7_dias' => DenunciaValidacao::where('created_at', '>=', now()->subDays(7))->count(),
            'usuarios' => [
                'total' => User::count(),
                'administradores' => User::where('is_admin', true)->count(),
                'bloqueados' => User::whereNotNull('bloqueado_em')->count(),
                'novos_30_dias' => User::where('created_at', '>=', now()->subDays(30))->count(),
            ],
            'ecopontos' => Ecoponto::count(),
            'regras' => [
                'validacao' => config('ecoradar.validacao'),
                'limites' => config('ecoradar.limites'),
            ],
        ]);
    }

    /** GET /api/admin/denuncias — fila de moderação (inclui ocultas) */
    public function denuncias(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in([...Denuncia::STATUS, 'aguardando', 'ocultas'])],
            'categoria' => ['nullable', 'string', 'max:40'],
            'busca' => ['nullable', 'string', 'max:100'],
        ]);

        $query = Denuncia::query()
            ->with(['user:id,name,email', 'ocultadaPor:id,name'])
            ->withCount([
                'validacoes as votos_existe' => fn ($q) => $q->where('tipo', 'existe'),
                'validacoes as votos_resolvida' => fn ($q) => $q->where('tipo', 'resolvida'),
            ])
            ->when(($data['status'] ?? null) === 'aguardando', fn ($q) => $q->whereNull('oculta_em')->whereIn('status', ['pendente', 'confirmada', 'possivelmente_resolvida']))
            ->when(($data['status'] ?? null) === 'ocultas', fn ($q) => $q->whereNotNull('oculta_em'))
            ->when(in_array($data['status'] ?? null, Denuncia::STATUS, true), fn ($q) => $q->where('status', $data['status']))
            ->when($data['categoria'] ?? null, fn ($q, $c) => $q->where('categoria', $c))
            ->when($data['busca'] ?? null, function ($q, $b) {
                $termo = '%'.mb_strtolower($b).'%';
                $q->where(fn ($w) => $w->whereRaw('lower(titulo) like ?', [$termo])
                    ->orWhereRaw('lower(endereco) like ?', [$termo])
                    ->orWhereRaw('lower(descricao) like ?', [$termo]));
            })
            ->latest()
            ->limit(200)
            ->get();

        return response()->json($query->map(fn (Denuncia $d) => [
            'id' => $d->id,
            'titulo' => $d->titulo,
            'descricao' => $d->descricao,
            'categoria' => $d->categoria,
            'status' => $d->status,
            'criticidade' => $d->criticidade,
            'endereco' => $d->endereco,
            'latitude' => $d->latitude,
            'longitude' => $d->longitude,
            'foto_url' => $d->fotoUrls()[0] ?? null,
            'autor' => $d->user ? ['id' => $d->user->id, 'nome' => $d->user->name, 'email' => $d->user->email] : null,
            'votos' => ['existe' => (int) $d->votos_existe, 'resolvida' => (int) $d->votos_resolvida],
            'oculta' => $d->oculta_em ? ['em' => $d->oculta_em, 'motivo' => $d->oculta_motivo, 'por' => $d->ocultadaPor?->name] : null,
            'created_at' => $d->created_at,
            'updated_at' => $d->updated_at,
        ]));
    }

    /** GET /api/admin/denuncias/{id}/votos — quem validou e quando (dispositivos aparecem anonimizados) */
    public function votos(Denuncia $denuncia): JsonResponse
    {
        return response()->json($denuncia->validacoes()->with('user:id,name')->latest('updated_at')->get()->map(fn ($v) => [
            'tipo' => $v->tipo,
            'quem' => $v->user ? $v->user->name : 'Dispositivo anônimo '.substr(md5($v->votante), 0, 6),
            'conta' => (bool) $v->user_id,
            'data' => $v->updated_at,
        ]));
    }

    /** POST /api/admin/denuncias/{id}/ocultar {motivo} — tira do mapa público sem apagar */
    public function ocultar(Request $request, Denuncia $denuncia): JsonResponse
    {
        $data = $request->validate(['motivo' => ['required', 'string', 'min:3', 'max:255']]);
        $denuncia->forceFill(['oculta_em' => now(), 'oculta_motivo' => $data['motivo'], 'oculta_por' => $request->user()->id])->save();
        $denuncia->registrarStatus($denuncia->status, $request->user(), 'Ocultada pela moderação: '.$data['motivo'], 'equipe');

        return response()->json(['ok' => true]);
    }

    /** DELETE /api/admin/denuncias/{id}/ocultar — volta a exibir */
    public function reexibir(Request $request, Denuncia $denuncia): JsonResponse
    {
        $denuncia->forceFill(['oculta_em' => null, 'oculta_motivo' => null, 'oculta_por' => null])->save();
        $denuncia->registrarStatus($denuncia->status, $request->user(), 'Exibida novamente pela moderação.', 'equipe');

        return response()->json(['ok' => true]);
    }

    /** GET /api/admin/usuarios */
    public function usuarios(Request $request): JsonResponse
    {
        $busca = $request->validate(['busca' => ['nullable', 'string', 'max:100']])['busca'] ?? null;

        $usuarios = User::query()
            ->withCount(['denuncias', 'validacoes'])
            ->when($busca, function ($q, $b) {
                $termo = '%'.mb_strtolower($b).'%';
                $q->where(fn ($w) => $w->whereRaw('lower(name) like ?', [$termo])->orWhereRaw('lower(email) like ?', [$termo]));
            })
            ->orderByDesc('is_admin')->orderBy('name')
            ->limit(300)
            ->get();

        return response()->json($usuarios->map(fn (User $u) => [
            'id' => $u->id,
            'nome' => $u->name,
            'email' => $u->email,
            'foto_url' => $u->foto_perfil_path ? asset('storage/'.$u->foto_perfil_path) : null,
            'bairro' => $u->bairro,
            'is_admin' => (bool) $u->is_admin,
            'bloqueado' => $u->bloqueado_em ? ['em' => $u->bloqueado_em, 'motivo' => $u->bloqueio_motivo] : null,
            'denuncias' => $u->denuncias_count,
            'validacoes' => $u->validacoes_count,
            'criado_em' => $u->created_at,
        ]));
    }

    /** PATCH /api/admin/usuarios/{id} {is_admin?, bloqueado?, motivo?} */
    public function atualizarUsuario(Request $request, User $usuario): JsonResponse
    {
        $data = $request->validate([
            'is_admin' => ['sometimes', 'boolean'],
            'bloqueado' => ['sometimes', 'boolean'],
            'motivo' => ['required_if:bloqueado,true', 'nullable', 'string', 'min:3', 'max:255'],
        ]);

        if ($usuario->is($request->user())) {
            return response()->json(['message' => 'Você não pode alterar o próprio acesso de administrador nem se bloquear.'], 422);
        }
        if (($data['is_admin'] ?? null) === false && $usuario->is_admin && User::where('is_admin', true)->count() <= 1) {
            return response()->json(['message' => 'O sistema precisa de pelo menos um administrador.'], 422);
        }

        if (array_key_exists('is_admin', $data)) {
            $usuario->forceFill(['is_admin' => $data['is_admin']]);
        }
        if (array_key_exists('bloqueado', $data)) {
            $usuario->forceFill($data['bloqueado']
                ? ['bloqueado_em' => now(), 'bloqueio_motivo' => $data['motivo'], 'bloqueado_por' => $request->user()->id, 'is_admin' => false]
                : ['bloqueado_em' => null, 'bloqueio_motivo' => null, 'bloqueado_por' => null]);
            // Bloqueio encerra as sessões abertas no app e no painel
            if ($data['bloqueado']) {
                $usuario->tokens()->delete();
            }
        }
        $usuario->save();

        return response()->json(['ok' => true]);
    }

    /** GET /api/admin/categorias (inclui inativas) */
    public function categorias(): JsonResponse
    {
        return response()->json(CategoriaOcorrencia::orderBy('ordem')->get()->map(fn ($c) => [
            ...$c->only(['id', 'slug', 'nome', 'descricao', 'cor', 'icone', 'ordem', 'ativo']),
            'denuncias' => Denuncia::where('categoria', $c->slug)->count(),
        ]));
    }

    /** PUT /api/admin/categorias/{id} */
    public function atualizarCategoria(Request $request, CategoriaOcorrencia $categoria): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:60'],
            'descricao' => ['nullable', 'string', 'max:160'],
            'cor' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'ativo' => ['required', 'boolean'],
        ]);
        if (! $data['ativo'] && CategoriaOcorrencia::where('ativo', true)->where('id', '!=', $categoria->id)->doesntExist()) {
            return response()->json(['message' => 'Mantenha pelo menos uma categoria ativa.'], 422);
        }
        // A cor precisa de contraste com o ícone branco do mapa
        if (self::contraste($data['cor'], '#FFFFFF') < 3) {
            return response()->json(['message' => 'Essa cor é clara demais: o ícone branco do mapa ficaria ilegível. Escolha um tom mais escuro.', 'errors' => ['cor' => ['Contraste insuficiente com o ícone branco.']]], 422);
        }
        $categoria->update($data);

        return response()->json($categoria->fresh());
    }

    private static function contraste(string $a, string $b): float
    {
        $lum = function (string $hex) {
            $c = array_map(fn ($i) => hexdec(substr($hex, $i, 2)) / 255, [1, 3, 5]);
            $c = array_map(fn ($x) => $x <= 0.03928 ? $x / 12.92 : (($x + 0.055) / 1.055) ** 2.4, $c);

            return 0.2126 * $c[0] + 0.7152 * $c[1] + 0.0722 * $c[2];
        };
        [$l1, $l2] = [$lum($a), $lum($b)];

        return (max($l1, $l2) + 0.05) / (min($l1, $l2) + 0.05);
    }
}
