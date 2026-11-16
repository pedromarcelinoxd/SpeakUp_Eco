<?php

namespace App\Http\Resources;

use App\Support\ValidacaoComunitaria;
use App\Support\Votante;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Formato único de denúncia para o app mobile e o painel web.
 * Mantém os campos legados (ponto_referencia, detalhes_localizacao, foto_url,
 * confirmacoes_count, confirmada_por_mim) para compatibilidade com clientes existentes.
 *
 * Privacidade: denúncias são públicas, então o autor aparece só pelo primeiro nome
 * (ou como "Cidadão anônimo"); e-mail e identificador do dispositivo nunca saem.
 *
 * @mixin \App\Models\Denuncia
 */
class DenunciaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $votante = Votante::daRequisicao($request);
        $user = $votante?->user;
        $fotos = $this->fotoUrls();
        $existe = (int) ($this->votos_existe ?? $this->validacoes()->where('tipo', 'existe')->count());
        $resolvida = (int) ($this->votos_resolvida ?? $this->validacoes()->where('tipo', 'resolvida')->count());
        $bloqueio = ValidacaoComunitaria::bloqueio($this->resource, $votante);
        $nomeAutor = $this->user ? Str::of($this->user->name)->trim()->explode(' ')->first() : null;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->user ? ['id' => $this->user->id, 'name' => $nomeAutor] : null,
            'autor' => [
                'nome' => $nomeAutor ?? 'Cidadão anônimo',
                'foto_url' => $this->user?->foto_perfil_path ? asset('storage/'.$this->user->foto_perfil_path) : null,
                'anonimo' => ! $this->user_id,
                'sou_eu' => (bool) $votante?->ehAutor($this->resource),
            ],
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
            // Validação comunitária
            'validacoes' => ['existe' => $existe, 'resolvida' => $resolvida],
            'meu_voto' => $this->meu_voto,
            'pode_validar' => $bloqueio === null,
            'motivo_bloqueio' => $bloqueio,
            'precisa_login' => $bloqueio === ValidacaoComunitaria::PRECISA_LOGIN,
            // Legado
            'confirmacoes_count' => $existe,
            'confirmada_por_mim' => $this->meu_voto === 'existe',
            'permissoes' => $user ? [
                'confirmar' => $bloqueio === null && $this->meu_voto !== 'existe',
                'excluir' => $user->can('delete', $this->resource),
                'alterar_status' => $user->can('updateStatus', $this->resource),
            ] : null,
            'historico' => $this->whenLoaded('historico', fn () => $this->historico->map(fn ($h) => [
                'status' => $h->status,
                'origem' => $h->origem,
                'observacao' => $h->observacao,
                'data' => $h->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
