<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| Promove (ou rebaixa) um usuário a administrador do SpeakUp Eco.
| Administradores moderam denúncias (alteram status) e gerenciam ecopontos.
|   php artisan ecoradar:admin pessoa@exemplo.com
|   php artisan ecoradar:admin pessoa@exemplo.com --remover
*/
Artisan::command('ecoradar:admin {email} {--remover}', function (string $email) {
    $user = \App\Models\User::where('email', $email)->first();
    if (! $user) {
        $this->error("Usuário {$email} não encontrado. Cadastre-se pelo app ou painel primeiro.");

        return 1;
    }
    $user->forceFill(['is_admin' => ! $this->option('remover')])->save();
    $this->info($user->is_admin ? "{$user->name} agora é administrador." : "{$user->name} não é mais administrador.");
})->purpose('Concede ou remove o papel de administrador do SpeakUp Eco');

/*
| Publica as fotos de exemplo (denúncias e avatares) no disco público e aplica os avatares.
| Roda a cada inicialização do servidor na hospedagem (o disco é apagado ao reiniciar).
|   php artisan ecoradar:fotos-demo
*/
Artisan::command('ecoradar:fotos-demo', function () {
    \Database\Seeders\EcoRadarApresentacaoSeeder::publicarFotos();
    $this->info('Fotos de exemplo das denúncias e avatares dos moradores publicados.');
})->purpose('Publica as fotos de exemplo das denúncias e os avatares dos moradores');
