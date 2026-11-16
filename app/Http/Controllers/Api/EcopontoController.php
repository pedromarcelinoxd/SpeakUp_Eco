<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ecoponto;
use App\Http\Requests\EcopontoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EcopontoController extends Controller
{
    public function index(): JsonResponse
    {
        $ecopontos = Ecoponto::orderBy('nome')->get();
        return response()->json($ecopontos);
    }

    public function store(EcopontoRequest $request): JsonResponse
    {
        $ecoponto = Ecoponto::create($request->validated());
        return response()->json($ecoponto, 201);
    }

    public function show(Ecoponto $ecoponto): JsonResponse
    {
        return response()->json($ecoponto);
    }

    public function update(EcopontoRequest $request, Ecoponto $ecoponto): JsonResponse
    {
        // Alterar ou remover pontos cadastrados é tarefa da equipe (painel administrativo).
        abort_unless($request->user()->is_admin, 403, 'Apenas administradores podem alterar ecopontos.');

        $ecoponto->update($request->validated());
        return response()->json($ecoponto);
    }

    public function destroy(Request $request, Ecoponto $ecoponto): JsonResponse
    {
        abort_unless($request->user()->is_admin, 403, 'Apenas administradores podem remover ecopontos.');

        $ecoponto->delete();
        return response()->json(null, 204);
    }
}