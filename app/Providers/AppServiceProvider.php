<?php

namespace App\Providers;

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
    }
}
