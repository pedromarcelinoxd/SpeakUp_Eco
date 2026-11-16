@props([
    'title' => 'EcoRadar',
    'subtitle' => null,
    'fullBleed' => false,
    'back' => null,
    'hideHeaderOnMobile' => false,
])
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#F8FAFC">
    <meta name="description" content="EcoRadar — plataforma colaborativa de monitoramento ambiental. {{ config('ecoradar.tagline') }}">
    <title>{{ $title }} · EcoRadar</title>
    <link rel="icon" type="image/svg+xml" href="{{ asset('ecoradar-icon.svg') }}">
    <script>
        // Aplica o estado da sidebar antes da renderização (evita "piscar")
        try {
            const s = JSON.parse(localStorage.getItem('ecoradar:settings') || '{}');
            if (s.sidebarCollapsed) document.documentElement.dataset.sidebar = 'collapsed';
        } catch (e) {}
        window.EcoRadar = { base: @json(url('/app')) };
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body x-data class="min-h-dvh">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-float">Pular para o conteúdo</a>

    <div class="flex min-h-dvh">
        <x-eco.sidebar />

        <div class="flex min-w-0 flex-1 flex-col">
            <x-eco.topbar :title="$title" :subtitle="$subtitle" :back="$back" :hide-on-mobile="$hideHeaderOnMobile">
                @isset($actions)
                    <x-slot:actions>{{ $actions }}</x-slot:actions>
                @endisset
            </x-eco.topbar>

            <main id="conteudo" @class([
                'flex-1',
                'relative' => $fullBleed,
                'px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-6' => ! $fullBleed,
            ])>
                @if ($fullBleed)
                    {{ $slot }}
                @else
                    <div class="mx-auto w-full max-w-[1320px]">
                        {{ $slot }}
                    </div>
                @endif
            </main>
        </div>
    </div>

    <x-eco.bottom-nav />
    <x-eco.toasts />
</body>
</html>
