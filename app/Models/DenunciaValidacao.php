<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Um voto da comunidade sobre uma ocorrência: "existe" (o problema continua)
 * ou "resolvida" (o problema não existe mais). Um voto por pessoa e ocorrência.
 */
class DenunciaValidacao extends Model
{
    public const TIPOS = ['existe', 'resolvida'];

    protected $table = 'denuncia_validacoes';

    protected $fillable = ['denuncia_id', 'user_id', 'votante', 'tipo'];

    public function denuncia()
    {
        return $this->belongsTo(Denuncia::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
