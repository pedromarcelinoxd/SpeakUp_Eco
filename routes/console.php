<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| Promove (ou rebaixa) um usuário a administrador do EcoRadar.
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
})->purpose('Concede ou remove o papel de administrador do EcoRadar');

/*
| Publica as imagens ilustrativas dos dados de apresentação no disco público.
| Roda a cada inicialização do servidor na hospedagem (o disco é apagado ao reiniciar).
|   php artisan ecoradar:fotos-demo
*/
Artisan::command('ecoradar:fotos-demo', function () {
    \Database\Seeders\EcoRadarApresentacaoSeeder::publicarFotos();
    $this->info('Imagens ilustrativas publicadas em storage/app/public/demo.');
})->purpose('Publica as imagens ilustrativas dos dados de apresentação');
