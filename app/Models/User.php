<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; 

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
   protected $fillable = [
        'name',
        'email',
        'password',
        'telefone',
        'bairro',
        'foto_perfil_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'bloqueado_por',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'bloqueado_em' => 'datetime',
        ];
    }
    // Em app/Models/User.php
    public function denuncias()
    {
        return $this->hasMany(Denuncia::class);
    }

    /** Dispositivos com notificações push (Expo) registrados. */
    public function pushTokens()
    {
        return $this->hasMany(PushToken::class);
    }

    /** Denúncias que este usuário confirmou. */
    public function confirmacoes()
    {
        return $this->belongsToMany(Denuncia::class, 'denuncia_confirmacoes')->withTimestamps();
    }

    /** Votos de validação comunitária feitos com esta conta. */
    public function validacoes()
    {
        return $this->hasMany(DenunciaValidacao::class);
    }

    /** Usado pelo canal de push: tokens Expo do usuário. */
    public function routeNotificationForExpo(): array
    {
        return $this->pushTokens()->pluck('token')->all();
    }
}