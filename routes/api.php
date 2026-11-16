<?php

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

// Mapa e denúncias são públicos: qualquer pessoa consulta, denuncia e valida.
// Sem conta, o dispositivo se identifica pelo cabeçalho X-EcoRadar-Dispositivo.
Route::get('/categorias', [DenunciaController::class, 'categorias']);
Route::get('/denuncias', [DenunciaController::class, 'index']);
Route::get('/denuncias/{id}', [DenunciaController::class, 'show'])->whereNumber('id');
Route::post('/denuncias', [DenunciaController::class, 'store'])->middleware('throttle:denuncias');
Route::post('/denuncias/{denuncia}/validar', [DenunciaController::class, 'validar'])->middleware('throttle:validacoes');
Route::post('/denuncias/{denuncia}/confirmar', [DenunciaController::class, 'confirmar'])->middleware('throttle:validacoes');

// Rotas protegidas ou seja precisam do token para serem acessadas
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/perfil', [ProfileController::class, 'destroy']);
    Route::post('/perfil', [ProfileController::class, 'update']);
    Route::get('/perfil/resumo', [EngajamentoController::class, 'resumo']);

    Route::patch('/denuncias/{denuncia}/status', [DenunciaController::class, 'updateStatus']);
    Route::delete('/denuncias/{denuncia}', [DenunciaController::class, 'destroy']);

    Route::get('/notificacoes', [EngajamentoController::class, 'notificacoes']);
    Route::post('/notificacoes/lidas', [EngajamentoController::class, 'marcarTodasLidas']);
    Route::post('/notificacoes/{id}/lida', [EngajamentoController::class, 'marcarLida']);

    Route::post('/push-tokens', [EngajamentoController::class, 'registrarPush']);
    Route::delete('/push-tokens', [EngajamentoController::class, 'removerPush']);

    Route::post('/ecopontos', [EcopontoController::class, 'store']);
    Route::put('/ecopontos/{ecoponto}', [EcopontoController::class, 'update']);
    Route::delete('/ecopontos/{ecoponto}', [EcopontoController::class, 'destroy']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

