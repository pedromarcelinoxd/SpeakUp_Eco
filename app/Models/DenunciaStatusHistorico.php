<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DenunciaStatusHistorico extends Model
{
    protected $table = 'denuncia_status_historico';

    protected $fillable = ['status', 'user_id', 'observacao'];

    public function denuncia()
    {
        return $this->belongsTo(Denuncia::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
