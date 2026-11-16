{{-- Navegação inferior estilo aplicativo (mobile / tablet) --}}
@php
    $tabs = [
        ['route' => 'eco.dashboard', 'label' => 'Início', 'icon' => 'house', 'match' => 'eco.dashboard'],
        ['route' => 'eco.map', 'label' => 'Mapa', 'icon' => 'map', 'match' => 'eco.map'],
        null, // botão central
        ['route' => 'eco.reports.index', 'label' => 'Denúncias', 'icon' => 'megaphone', 'match' => 'eco.reports.index'],
    ];
    $more = [
        ['route' => 'eco.points.index', 'label' => 'Pontos de descarte', 'icon' => 'recycle'],
        ['route' => 'eco.ranking', 'label' => 'Ranking', 'icon' => 'trophy'],
        ['route' => 'eco.panorama', 'label' => 'Panorama ambiental', 'icon' => 'chart-column'],
        ['route' => 'eco.notifications', 'label' => 'Notificações', 'icon' => 'bell'],
        ['route' => 'eco.profile', 'label' => 'Meu perfil', 'icon' => 'user'],
        ['route' => 'eco.settings', 'label' => 'Configurações', 'icon' => 'settings'],
    ];
    $moreActive = request()->routeIs('eco.points.*', 'eco.ranking', 'eco.panorama', 'eco.profile', 'eco.settings', 'eco.notifications');
@endphp

<div x-data="{ more: false }" class="lg:hidden">
    <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
         aria-label="Navegação">
        <ul class="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
            @foreach ($tabs as $tab)
                @if ($tab === null)
                    <li class="flex justify-center">
                        <a href="{{ route('eco.reports.create') }}" aria-label="Nova denúncia"
                           class="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-coral-on shadow-float ring-4 ring-canvas transition active:scale-95">
                            <x-eco.icon name="plus" class="h-6 w-6" />
                        </a>
                    </li>
                @else
                    @php($active = request()->routeIs($tab['match']))
                    <li>
                        <a href="{{ route($tab['route']) }}" @if ($active) aria-current="page" @endif
                           @class(['flex flex-col items-center gap-1 py-1 text-[10.5px] font-semibold transition',
                                   'text-eco-700' => $active, 'text-slate-500' => ! $active])>
                            <span @class(['grid h-7 w-12 place-items-center rounded-full transition', 'bg-eco-100' => $active])>
                                <x-eco.icon :name="$tab['icon']" class="h-[19px] w-[19px]" />
                            </span>
                            {{ $tab['label'] }}
                        </a>
                    </li>
                @endif
            @endforeach
            <li>
                <button type="button" @click="more = true"
                        @class(['flex w-full flex-col items-center gap-1 py-1 text-[10.5px] font-semibold transition',
                                'text-eco-700' => $moreActive, 'text-slate-500' => ! $moreActive])>
                    <span @class(['relative grid h-7 w-12 place-items-center rounded-full', 'bg-eco-100' => $moreActive])>
                        <x-eco.icon name="menu" class="h-[19px] w-[19px]" />
                        <span x-cloak x-show="$store.eco.unreadCount" class="absolute right-2.5 top-0.5 h-2 w-2 rounded-full bg-alert ring-2 ring-white"></span>
                    </span>
                    Mais
                </button>
            </li>
        </ul>
    </nav>

    {{-- Folha "Mais" --}}
    <x-eco.sheet show="more" title="Menu">
        <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <x-eco.avatar class="h-11 w-11 text-sm" />
            <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-ink" x-text="$store.eco.user.fullName || $store.eco.user.name"></p>
                <p class="truncate text-[12.5px] text-ink-muted" x-text="`${$store.eco.level.label} · ${$u.formatNumber($store.eco.user.points)} pts`"></p>
            </div>
        </div>
        <ul class="mt-3 grid grid-cols-3 gap-2">
            @foreach ($more as $item)
                <li>
                    <a href="{{ route($item['route']) }}"
                       @class(['flex h-full flex-col items-center gap-2 rounded-2xl border p-3 text-center text-[12px] font-semibold transition active:scale-[.97]',
                               'border-eco-200 bg-eco-50 text-eco-800' => request()->routeIs($item['route']),
                               'border-slate-200 bg-white text-ink' => ! request()->routeIs($item['route'])])>
                        <x-eco.icon :name="$item['icon']" class="h-5 w-5" />
                        {{ $item['label'] }}
                    </a>
                </li>
            @endforeach
        </ul>
        <button type="button" class="btn-secondary mt-3 w-full text-red-600" @click="$store.eco.logout()">
            <x-eco.icon name="log-out" class="h-4 w-4" />
            Sair
        </button>
    </x-eco.sheet>
</div>
