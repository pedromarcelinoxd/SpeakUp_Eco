@props(['title', 'subtitle' => null, 'back' => null, 'hideOnMobile' => false])

<header @class([
    'sticky top-0 z-30 border-b border-slate-200/70 bg-canvas/85 backdrop-blur-xl',
    'hidden lg:block' => $hideOnMobile,
])>
    <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {{-- Mobile: logo --}}
        @unless ($back)
            <a href="{{ route('eco.dashboard') }}" class="shrink-0 lg:hidden" aria-label="EcoRadar — início">
                <x-eco.logo class="h-8 w-8" />
            </a>
        @endunless

        @if ($back)
            <a href="{{ $back }}" class="icon-btn -ml-2 shrink-0" aria-label="Voltar"
               @click.prevent="history.length > 1 && document.referrer.startsWith(location.origin) ? history.back() : (location.href = '{{ $back }}')">
                <x-eco.icon name="arrow-left" class="h-5 w-5" />
            </a>
        @endif

        <div class="min-w-0 flex-1">
            <h1 class="truncate font-display text-[17px] font-bold leading-tight text-ink sm:text-lg">{{ $title }}</h1>
            @if ($subtitle)
                <p class="hidden truncate text-[13px] text-ink-muted sm:block">{{ $subtitle }}</p>
            @endif
        </div>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {{ $actions ?? '' }}

            {{-- Selo de dados demonstrativos --}}
            <a href="{{ route('eco.settings') }}" x-cloak x-show="$store.eco.hasDemo"
               class="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700 transition hover:bg-amber-100 md:inline-flex"
               title="Parte dos dados exibidos é demonstrativa. Clique para configurar.">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Dados demonstrativos
            </a>

            <x-eco.notifications-menu />

            <a href="{{ route('eco.profile') }}" class="hidden rounded-full ring-offset-2 transition hover:ring-2 hover:ring-slate-200 sm:block" aria-label="Meu perfil">
                <x-eco.avatar class="h-9 w-9 text-[13px]" />
            </a>
        </div>
    </div>
</header>
