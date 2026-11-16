<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Categorias de ocorrência (nome, cor e ícone), fonte única para app e painel. */
class CategoriaOcorrencia extends Model
{
    protected $table = 'categorias_ocorrencia';

    protected $fillable = ['slug', 'nome', 'descricao', 'cor', 'icone', 'ordem', 'ativo'];

    protected function casts(): array
    {
        return ['ativo' => 'boolean', 'ordem' => 'integer'];
    }

    /** Slugs das categorias ativas (com cache curto). */
    public static function slugsAtivos(): array
    {
        return Cache::remember('ecoradar:categorias:slugs', 300, fn () => static::where('ativo', true)->orderBy('ordem')->pluck('slug')->all());
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('ecoradar:categorias:slugs'));
        static::deleted(fn () => Cache::forget('ecoradar:categorias:slugs'));
    }
}
