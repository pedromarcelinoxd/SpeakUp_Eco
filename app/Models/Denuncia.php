<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Denuncia extends Model
{
    use HasFactory;

    /**
     * Fluxo de status compartilhado por app e painel web.
     *  - Comunidade: pendente (aguardando validação) → confirmada → possivelmente_resolvida → resolvida
     *  - Equipe (oficial): em_analise, verificada, nao_confirmada (e também pode resolver)
     */
    public const STATUS = ['pendente', 'confirmada', 'em_analise', 'verificada', 'possivelmente_resolvida', 'resolvida', 'nao_confirmada'];

    /** Status que só a equipe (administradores) pode definir. */
    public const STATUS_EQUIPE = ['em_analise', 'verificada', 'nao_confirmada'];

    /** Status em que a denúncia está encerrada (não recebe mais votos). */
    public const STATUS_FINAIS = ['resolvida', 'nao_confirmada'];

    /** Status que contam como denúncia validada (geram pontos). */
    public const STATUS_VALIDADOS = ['confirmada', 'verificada', 'possivelmente_resolvida', 'resolvida'];

    /** Categorias padrão; a lista ativa vem da tabela categorias_ocorrencia. */
    public const CATEGORIAS = ['descarte_irregular', 'entulho', 'eletronicos', 'poluicao_agua', 'queimada', 'dano_ambiental', 'outros'];

    public const CRITICIDADES = ['baixa', 'media', 'alta'];

    public const PONTOS_REFERENCIA = [
        'predio_a', 'predio_b', 'predio_c', 'predio_d', 'predio_e', 'predio_f', 'predio_h', 'predio_i', 'predio_l',
        'quadra', 'lago', 'cantina', 'estacionamento', 'portaria',
    ];

    protected $fillable = [
        'categoria',
        'titulo',
        'descricao',
        'latitude',
        'longitude',
        'endereco',
        'ponto_referencia',
        'detalhes_localizacao',
        'foto_path',
        'fotos_extras',
        'criticidade',
        'status',
        'origem',
        'autor_hash',
    ];

    protected $hidden = ['autor_hash'];

    protected function casts(): array
    {
        return [
            'fotos_extras' => 'array',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Usuários que confirmaram a ocorrência (tabela antiga, mantida para compatibilidade). */
    public function confirmacoes()
    {
        return $this->belongsToMany(User::class, 'denuncia_confirmacoes')->withTimestamps();
    }

    /** Votos da comunidade ("existe" ou "resolvida"). */
    public function validacoes()
    {
        return $this->hasMany(DenunciaValidacao::class);
    }

    public function historico()
    {
        return $this->hasMany(DenunciaStatusHistorico::class)->orderBy('created_at')->orderBy('id');
    }

    /** URLs públicas de todas as fotos (capa primeiro). */
    public function fotoUrls(): array
    {
        $paths = array_filter([$this->foto_path, ...($this->fotos_extras ?? [])]);

        return array_values(array_map(fn ($p) => asset('storage/'.$p), $paths));
    }

    public function apagarArquivos(): void
    {
        $paths = array_filter([$this->foto_path, ...($this->fotos_extras ?? [])]);
        Storage::disk('public')->delete($paths);
    }

    /** @param  'autor'|'comunidade'|'equipe'|null  $origem */
    public function registrarStatus(string $status, ?User $autor = null, ?string $observacao = null, ?string $origem = null): void
    {
        $this->historico()->create([
            'status' => $status,
            'origem' => $origem ?? ($autor?->is_admin ? 'equipe' : 'autor'),
            'user_id' => $autor?->id,
            'observacao' => $observacao,
        ]);
    }
}
