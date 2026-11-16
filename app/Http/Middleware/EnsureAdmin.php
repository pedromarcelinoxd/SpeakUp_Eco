<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Rotas da administração: só contas da equipe (is_admin) e não bloqueadas. */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || ! $user->is_admin || $user->bloqueado_em) {
            return response()->json(['message' => 'Acesso restrito à equipe de administração.'], 403);
        }

        return $next($request);
    }
}
