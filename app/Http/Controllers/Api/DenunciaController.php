<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDenunciaRequest;
use App\Http\Resources\DenunciaResource;
use App\Models\Denuncia;
use App\Notifications\EcoRadarNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * API de denúncias, consumida pelo app mobile (Expo) e pelo painel web.
 */
class DenunciaController extends Controller
{
    /** Consulta base: autor, contagem de confirmações e se o usuário atual confirmou. */
    private function query(Request $request): Builder
    {
        $userId = $request->user()?->id;

        return Denuncia::query()
            ->with('user:id,name')
            ->withCount('confirmacoes')
            ->withExists(['confirmacoes as confirmada_por_mim' => fn ($q) => $q->where('users.id', $userId)]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(Denuncia::STATUS)],
            'categoria' => ['nullable', Rule::in(Denuncia::CATEGORIAS)],
            'minhas' => ['nullable', 'boolean'],
        ]);

        $denuncias = $this->query($request)
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->categoria, fn ($q, $c) => $q->where('categoria', $c))
            ->when($request->boolean('minhas'), fn ($q) => $q->where('user_id', $request->user()->id))
            ->latest()
            ->get();

        return DenunciaResource::collection($denuncias);
    }

    public function show(Request $request, int $id): DenunciaResource
    {
        $denuncia = $this->query($request)->with('historico')->findOrFail($id);

        return new DenunciaResource($denuncia);
    }

    public function store(StoreDenunciaRequest $request): JsonResponse
    {
        // 1. Armazena as imagens no diretório storage/app/public/denuncias
        $caminhoArquivo = $request->file('foto')->store('denuncias', 'public');
        $extras = collect($request->file('fotos', []))
            ->map(fn ($f) => $f->store('denuncias', 'public'))
            ->all();

        // 2. Cria o registro vinculado ao usuário autenticado
        $denuncia = $request->user()->denuncias()->create([
            ...$request->safe()->except(['foto', 'fotos']),
            'categoria' => $request->input('categoria', 'outros'),
            'origem' => $request->input('origem', 'web'),
            'foto_path' => $caminhoArquivo,
            'fotos_extras' => $extras ?: null,
            'status' => 'pendente',
        ]);

        $denuncia->registrarStatus('pendente', $request->user(), 'Denúncia registrada.');
        $request->user()->notify(EcoRadarNotification::denunciaRecebida($denuncia));

        $denuncia = $this->query($request)->with('historico')->find($denuncia->id);

        return (new DenunciaResource($denuncia))->response()->setStatusCode(201);
    }

    /** Moderação: somente administradores (painel web). */
    public function updateStatus(Request $request, Denuncia $denuncia): DenunciaResource
    {
        Gate::authorize('updateStatus', $denuncia);

        $data = $request->validate([
            'status' => ['required', Rule::in(Denuncia::STATUS)],
            'observacao' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['status'] !== $denuncia->status) {
            $denuncia->update(['status' => $data['status']]);
            $denuncia->registrarStatus($data['status'], $request->user(), $data['observacao'] ?? null);
            $denuncia->user->notify(EcoRadarNotification::statusAtualizado($denuncia));
        }

        return new DenunciaResource($this->query($request)->with('historico')->find($denuncia->id));
    }

    public function confirmar(Request $request, Denuncia $denuncia): DenunciaResource
    {
        Gate::authorize('confirm', $denuncia);

        $result = $denuncia->confirmacoes()->syncWithoutDetaching([$request->user()->id]);
        if ($result['attached']) {
            $denuncia->user->notify(EcoRadarNotification::confirmada($denuncia, $denuncia->confirmacoes()->count()));
        }

        return new DenunciaResource($this->query($request)->find($denuncia->id));
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
}
