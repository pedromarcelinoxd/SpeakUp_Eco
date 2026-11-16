<?php

namespace App\Providers;

use App\Support\Votante;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // A API sempre retornou arrays "puros" (sem envelope `data`);
        // mantemos o formato para não quebrar clientes existentes.
        \Illuminate\Http\Resources\Json\JsonResource::withoutWrapping();

        // Prevenção de abusos: denúncias e validações públicas têm limite por pessoa
        // (conta ou dispositivo) e por IP.
        RateLimiter::for('denuncias', fn (Request $request) => [
            Limit::perHour(config('ecoradar.limites.denuncias_por_hora'))->by('den:'.Votante::chaveLimite($request))
                ->response(fn () => response()->json(['message' => 'Você enviou muitas denúncias em pouco tempo. Tente novamente mais tarde.'], 429)),
            Limit::perDay(config('ecoradar.limites.denuncias_por_dia_por_ip'))->by('den-ip:'.$request->ip())
                ->response(fn () => response()->json(['message' => 'Limite diário de denúncias desta rede atingido. Tente amanhã.'], 429)),
        ]);
        RateLimiter::for('validacoes', fn (Request $request) => [
            Limit::perHour(config('ecoradar.limites.validacoes_por_hora'))->by('val:'.Votante::chaveLimite($request))
                ->response(fn () => response()->json(['message' => 'Muitas validações em pouco tempo. Tente novamente mais tarde.'], 429)),
            Limit::perHour(config('ecoradar.limites.validacoes_por_hora') * 3)->by('val-ip:'.$request->ip()),
        ]);
    }
}
