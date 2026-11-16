<?php

use Illuminate\Support\Facades\Route;

// Retorna apenas um status em JSON na raiz do servidor
Route::get('/', function () {
    return response()->json([
        'api' => 'Laravel API',
        'status' => 'online'
    ]);
});

/*
|--------------------------------------------------------------------------
| EcoRadar — interface web
|--------------------------------------------------------------------------
| Páginas Blade que consomem a API existente (routes/api.php).
| Não alteram o backend nem exigem sessão web: a autenticação usa o token
| Sanctum retornado por /api/login.
*/
Route::prefix('app')->name('eco.')->group(function () {
    Route::view('/', 'ecoradar.dashboard')->name('dashboard');
    Route::view('/mapa', 'ecoradar.map')->name('map');

    Route::view('/denuncias', 'ecoradar.reports.index')->name('reports.index');
    Route::view('/denuncias/nova', 'ecoradar.reports.create')->name('reports.create');
    Route::get('/denuncias/{id}', fn (string $id) => view('ecoradar.reports.show', ['id' => $id]))
        ->where('id', '[A-Za-z0-9\-]+')->name('reports.show');

    Route::view('/descarte', 'ecoradar.points.index')->name('points.index');
    Route::get('/descarte/{id}', fn (string $id) => view('ecoradar.points.show', ['id' => $id]))
        ->where('id', '[A-Za-z0-9\-]+')->name('points.show');

    Route::view('/ranking', 'ecoradar.ranking')->name('ranking');
    Route::view('/panorama', 'ecoradar.panorama')->name('panorama');
    Route::view('/perfil', 'ecoradar.profile')->name('profile');
    Route::view('/notificacoes', 'ecoradar.notifications')->name('notifications');
    Route::view('/configuracoes', 'ecoradar.settings')->name('settings');
    Route::view('/entrar', 'ecoradar.auth')->name('login');
});
