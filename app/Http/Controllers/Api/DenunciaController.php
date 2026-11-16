<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDenunciaRequest;
use App\Http\Resources\DenunciaResource;
use App\Models\CategoriaOcorrencia;
use App\Models\Denuncia;
use App\Models\DenunciaValidacao;
use App\Notifications\EcoRadarNotification;
use App\Support\ValidacaoComunitaria;
use App\Support\Votante;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * API de denúncias, consumida pelo app mobile (Expo) e pelo painel web.
 *
 * Consulta é pública (sem conta). Denunciar e validar também: quem não tem conta
 * é identificado pelo dispositivo (ver App\Support\Votante), com limites de envio.
 */
class DenunciaController extends Controller
{
    /** Consulta base: autor, contagens de votos e o voto de quem está consultando. */
    private function query(Request $request): Builder
    {
        $chaves = Votante::daRequisicao($request)?->chaves() ?? [];

        return Denuncia::query()
            ->with('user:id,name')
            ->withCount([
                'validacoes as votos_existe' => fn ($q) => $q->where('tipo', 'existe'),
                'validacoes as votos_resolvida' => fn ($q) => $q->where('tipo', 'resolvida'),
            ])
            ->addSelect(['meu_voto' => DenunciaValidacao::select('tipo')
                ->whereColumn('denuncia_id', 'denuncias.id')
                ->whereIn('votante', $chaves ?: ['-'])
                ->limit(1)]);
    }

    /** GET /api/categorias (público) */
    public function categorias(): JsonResponse
    {
        return response()->json(CategoriaOcorrencia::where('ativo', true)->orderBy('ordem')
            ->get(['slug', 'nome', 'descricao', 'cor', 'icone']));
    }

    /** GET /api/denuncias (público) */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(Denuncia::STATUS)],
            'categoria' => ['nullable', 'string', 'max:40'],
            'minhas' => ['nullable', 'boolean'],
        ]);

        $votante = Votante::daRequisicao($request);
        $denuncias = $this->query($request)
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->categoria, fn ($q, $c) => $q->where('categoria', $c))
            ->when($request->boolean('minhas'), function ($q) use ($votante) {
                // Minhas: pela conta ou, sem conta, pelo dispositivo
                if ($votante?->user) {
                    $q->where('user_id', $votante->user->id);
                } elseif ($votante?->dispositivo) {
                    $q->whereNull('user_id')->where('autor_hash', $votante->dispositivo);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->latest()
            ->get();

        return DenunciaResource::collection($denuncias);
    }

    /** GET /api/denuncias/{id} (público), com histórico */
    public function show(Request $request, int $id): DenunciaResource
    {
        $denuncia = $this->query($request)->with('historico')->findOrFail($id);

        return new DenunciaResource($denuncia);
    }

    /** POST /api/denuncias — qualquer pessoa (conta ou dispositivo), com limites e checagem de duplicata */
    public function store(StoreDenunciaRequest $request): JsonResponse
    {
        $votante = Votante::daRequisicao($request);
        if (! $votante) {
            return response()->json(['message' => 'Não foi possível identificar este dispositivo. Atualize o app e tente novamente.'], 422);
        }

        if (! $request->boolean('ignorar_duplicata') && $request->filled('latitude')) {
            if ($parecida = $this->duplicata($request->input('categoria', 'outros'), (float) $request->latitude, (float) $request->longitude)) {
                $parecida = $this->query($request)->find($parecida->id);

                return response()->json([
                    'message' => 'Já existe uma denúncia parecida bem perto daqui. Confirme a existente em vez de criar outra.',
                    'duplicata' => new DenunciaResource($parecida),
                ], 409);
            }
        }

        // 1. Armazena as imagens no diretório storage/app/public/denuncias
        $caminhoArquivo = $request->file('foto')->store('denuncias', 'public');
        $extras = collect($request->file('fotos', []))
            ->map(fn ($f) => $f->store('denuncias', 'public'))
            ->all();

        // 2. Cria o registro vinculado à conta (se houver) e ao dispositivo
        $denuncia = new Denuncia([
            ...$request->safe()->except(['foto', 'fotos', 'ignorar_duplicata']),
            'categoria' => $request->input('categoria', 'outros'),
            'criticidade' => $request->input('criticidade', 'media'),
            'origem' => $request->input('origem', 'web'),
            'foto_path' => $caminhoArquivo,
            'fotos_extras' => $extras ?: null,
            'status' => 'pendente',
        ]);
        $denuncia->user_id = $votante->user?->id;
        $denuncia->autor_hash = $votante->dispositivo;
        $denuncia->save();

        $denuncia->registrarStatus('pendente', $votante->user, 'Denúncia registrada. Aguardando validação da comunidade.', 'autor');
        $votante->user?->notify(EcoRadarNotification::denunciaRecebida($denuncia));

        $denuncia = $this->query($request)->with('historico')->find($denuncia->id);

        return (new DenunciaResource($denuncia))->response()->setStatusCode(201);
    }

    /** POST /api/denuncias/{id}/validar {tipo: existe|resolvida} — um voto por pessoa */
    public function validar(Request $request, Denuncia $denuncia): JsonResponse
    {
        $data = $request->validate(['tipo' => ['required', Rule::in(DenunciaValidacao::TIPOS)]]);
        $votante = Votante::daRequisicao($request);

        if ($motivo = ValidacaoComunitaria::bloqueio($denuncia, $votante)) {
            return response()->json(['message' => $motivo], 403);
        }

        $resultado = ValidacaoComunitaria::votar($denuncia, $votante, $data['tipo']);
        $atual = $this->query($request)->with('historico')->find($denuncia->id);

        return response()->json([
            'denuncia' => new DenunciaResource($atual),
            'voto_registrado' => $resultado['novo'],
            'status_mudou' => $resultado['status_mudou'],
        ]);
    }

    /** Compatibilidade: POST /api/denuncias/{id}/confirmar = validar com "existe" */
    public function confirmar(Request $request, Denuncia $denuncia): JsonResponse|DenunciaResource
    {
        $request->merge(['tipo' => 'existe']);
        $resposta = $this->validar($request, $denuncia);
        if ($resposta->getStatusCode() !== 200) {
            return $resposta;
        }

        return new DenunciaResource($this->query($request)->find($denuncia->id));
    }

    /** Moderação oficial: somente administradores (painel web). */
    public function updateStatus(Request $request, Denuncia $denuncia): DenunciaResource
    {
        Gate::authorize('updateStatus', $denuncia);

        $data = $request->validate([
            'status' => ['required', Rule::in(Denuncia::STATUS)],
            'observacao' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['status'] !== $denuncia->status) {
            $denuncia->update(['status' => $data['status']]);
            $denuncia->registrarStatus($data['status'], $request->user(), $data['observacao'] ?? null, 'equipe');
            $denuncia->user?->notify(EcoRadarNotification::statusAtualizado($denuncia));
        }

        return new DenunciaResource($this->query($request)->with('historico')->find($denuncia->id));
    }

    public function destroy(Denuncia $denuncia): JsonResponse
    {
        Gate::authorize('delete', $denuncia);

        $denuncia->apagarArquivos();
        // Remove as notificações que apontam para a denúncia excluída (app e painel)
        DatabaseNotification::where('data->denuncia_id', $denuncia->id)->delete();
        $denuncia->delete();

        return response()->json(null, 204);
    }

    /** Denúncia aberta da mesma categoria a menos de X metros, criada nos últimos N dias. */
    private function duplicata(string $categoria, float $lat, float $lng): ?Denuncia
    {
        $raio = config('ecoradar.limites.duplicata_raio_metros');
        $grau = $raio / 111_000;

        return Denuncia::where('categoria', $categoria)
            ->whereNotIn('status', Denuncia::STATUS_FINAIS)
            ->where('created_at', '>=', now()->subDays(config('ecoradar.limites.duplicata_dias')))
            ->whereBetween('latitude', [$lat - $grau, $lat + $grau])
            ->whereBetween('longitude', [$lng - $grau * 1.2, $lng + $grau * 1.2])
            ->get(['id', 'latitude', 'longitude'])
            ->first(fn ($d) => self::distancia($lat, $lng, $d->latitude, $d->longitude) <= $raio);
    }

    private static function distancia(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6_371_000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
