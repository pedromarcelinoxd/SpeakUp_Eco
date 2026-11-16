<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EcopontoController;
use App\Http\Controllers\Api\DenunciaController;
use App\Http\Controllers\Api\EngajamentoController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

//Rotas que não precisam do token
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/ecopontos', [EcopontoController::class, 'index']);
Route::get('/ecopontos/{ecoponto}', [EcopontoController::class, 'show']);
Route::get('/ranking', [EngajamentoController::class, 'ranking']);

// Mapa e denúncias são públicos para CONSULTA. Denunciar e validar exigem conta.
Route::get('/categorias', [DenunciaController::class, 'categorias']);
Route::get('/denuncias', [DenunciaController::class, 'index']);
Route::get('/denuncias/{id}', [DenunciaController::class, 'show'])->whereNumber('id');

// Rotas protegidas ou seja precisam do token para serem acessadas
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/perfil', [ProfileController::class, 'destroy']);
    Route::post('/perfil', [ProfileController::class, 'update']);
    Route::get('/perfil/resumo', [EngajamentoController::class, 'resumo']);

    // Participação (só com conta), com limites contra abuso
    Route::post('/denuncias', [DenunciaController::class, 'store'])->middleware('throttle:denuncias');
    Route::post('/denuncias/{denuncia}/validar', [DenunciaController::class, 'validar'])->middleware('throttle:validacoes');
    Route::post('/denuncias/{denuncia}/confirmar', [DenunciaController::class, 'confirmar'])->middleware('throttle:validacoes');

    Route::patch('/denuncias/{denuncia}/status', [DenunciaController::class, 'updateStatus']);
    Route::delete('/denuncias/{denuncia}', [DenunciaController::class, 'destroy']);

    Route::get('/notificacoes', [EngajamentoController::class, 'notificacoes']);
    Route::post('/notificacoes/lidas', [EngajamentoController::class, 'marcarTodasLidas']);
    Route::post('/notificacoes/{id}/lida', [EngajamentoController::class, 'marcarLida']);

    Route::post('/push-tokens', [EngajamentoController::class, 'registrarPush']);
    Route::delete('/push-tokens', [EngajamentoController::class, 'removerPush']);

    // Administração: só a equipe (is_admin), verificada no servidor
    Route::middleware('admin')->group(function () {
        Route::post('/ecopontos', [EcopontoController::class, 'store']);
        Route::put('/ecopontos/{ecoponto}', [EcopontoController::class, 'update']);
        Route::delete('/ecopontos/{ecoponto}', [EcopontoController::class, 'destroy']);

        Route::prefix('admin')->group(function () {
            Route::get('/resumo', [AdminController::class, 'resumo']);
            Route::get('/denuncias', [AdminController::class, 'denuncias']);
            Route::get('/denuncias/{denuncia}/votos', [AdminController::class, 'votos']);
            Route::post('/denuncias/{denuncia}/ocultar', [AdminController::class, 'ocultar']);
            Route::delete('/denuncias/{denuncia}/ocultar', [AdminController::class, 'reexibir']);
            Route::get('/usuarios', [AdminController::class, 'usuarios']);
            Route::patch('/usuarios/{usuario}', [AdminController::class, 'atualizarUsuario']);
            Route::get('/categorias', [AdminController::class, 'categorias']);
            Route::put('/categorias/{categoria}', [AdminController::class, 'atualizarCategoria']);
        });
    });
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

