<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Token de notificação push (Expo) de um dispositivo do usuário. */
class PushToken extends Model
{
    protected $fillable = ['user_id', 'token', 'plataforma'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
