<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato único de denúncia para o app mobile e o painel web.
 * Mantém os campos legados (ponto_referencia, detalhes_localizacao, foto_url)
 * para compatibilidade com clientes existentes.
 *
 * @mixin \App\Models\Denuncia
 */
class DenunciaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $fotos = $this->fotoUrls();

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => ['id' => $this->user->id, 'name' => $this->user->name]),
            'categoria' => $this->categoria,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'endereco' => $this->endereco,
            'ponto_referencia' => $this->ponto_referencia,
            'detalhes_localizacao' => $this->detalhes_localizacao,
            'criticidade' => $this->criticidade,
            'status' => $this->status,
            'origem' => $this->origem,
            'foto_path' => $this->foto_path,
            'foto_url' => $fotos[0] ?? null,
            'fotos' => $fotos,
            'confirmacoes_count' => (int) ($this->confirmacoes_count ?? $this->confirmacoes()->count()),
            'confirmada_por_mim' => (bool) ($this->confirmada_por_mim ?? false),
            'permissoes' => $user ? [
                'confirmar' => $user->can('confirm', $this->resource) && ! $this->confirmada_por_mim,
                'excluir' => $user->can('delete', $this->resource),
                'alterar_status' => $user->can('updateStatus', $this->resource),
            ] : null,
            'historico' => $this->whenLoaded('historico', fn () => $this->historico->map(fn ($h) => [
                'status' => $h->status,
                'observacao' => $h->observacao,
                'data' => $h->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
