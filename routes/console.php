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
| Conta de administrador definida pelas variáveis de ambiente da hospedagem
| (ECORADAR_ADMIN_EMAIL e ECORADAR_ADMIN_PASSWORD). Roda a cada inicialização:
| cria a conta se não existir; se existir, aplica a senha e garante o papel de
| administrador. Serve para trocar a senha sem acesso ao terminal do servidor.
|   php artisan ecoradar:admin-env
*/
Artisan::command('ecoradar:admin-env', function () {
    $email = trim((string) env('ECORADAR_ADMIN_EMAIL', ''));
    $senha = (string) env('ECORADAR_ADMIN_PASSWORD', '');
    if ($email === '' || $senha === '') {
        $this->line('ECORADAR_ADMIN_EMAIL/ECORADAR_ADMIN_PASSWORD não definidas; nada a fazer.');

        return 0;
    }
    $user = \App\Models\User::firstOrNew(['email' => $email]);
    if (! $user->exists) {
        $user->name = env('ECORADAR_ADMIN_NAME', 'Equipe SpeakUp Eco');
    }
    $user->password = $senha; // cast "hashed" no modelo
    $user->forceFill(['is_admin' => true, 'bloqueado_em' => null, 'email_verified_at' => $user->email_verified_at ?? now()])->save();
    $this->info("Administrador {$user->email} pronto.");
})->purpose('Cria ou atualiza o administrador definido nas variáveis de ambiente');

/*
| Publica as fotos de exemplo (denúncias e avatares) no disco público e aplica os avatares.
| Roda a cada inicialização do servidor na hospedagem (o disco é apagado ao reiniciar).
|   php artisan ecoradar:fotos-demo
*/
Artisan::command('ecoradar:fotos-demo', function () {
    \Database\Seeders\EcoRadarApresentacaoSeeder::publicarFotos();
    $this->info('Fotos de exemplo das denúncias e avatares dos moradores publicados.');
})->purpose('Publica as fotos de exemplo das denúncias e os avatares dos moradores');
