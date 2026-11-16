<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ecoponto extends Model
{
    use HasFactory;

    public const CATEGORIAS = ['ecoponto', 'pilhas', 'eletronicos', 'oleo', 'medicamentos', 'lampadas', 'reciclagem', 'outros'];

    protected $fillable = [
        'nome',
        'categoria',
        'ponto_referencia',
        'descricao_local',
        'latitude',
        'longitude',
        'endereco',
        'horario',
        'residuos_aceitos',
    ];

    /**
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'residuos_aceitos' => 'array',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }
}
