{{-- Sidebar desktop (≥ lg). Estado recolhido persistido em localStorage. --}}
<aside class="er-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white text-ink transition-[width] duration-300 ease-out lg:flex"
       aria-label="Navegação principal">
    <div class="flex h-16 items-center justify-between gap-2 px-4">
        <a href="{{ route('eco.dashboard') }}" class="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="SpeakUp Eco — início">
            <x-eco.logo class="h-8 w-8 shrink-0" />
            <span class="er-label font-display text-[17px] font-extrabold tracking-tight text-eco-700">SpeakUp Eco</span>
        </a>
        <button type="button" class="er-label icon-btn h-8 w-8" @click="$store.eco.toggleSidebar()" title="Recolher menu" aria-label="Recolher menu">
            <x-eco.icon name="panel-left-close" class="h-[18px] w-[18px]" />
        </button>
    </div>

    <div class="px-3 pb-2 pt-1">
        <a href="{{ route('eco.reports.create') }}" class="btn-report w-full" title="Nova denúncia">
            <x-eco.icon name="plus" class="h-4 w-4" />
            <span class="er-label">Nova denúncia</span>
        </a>
    </div>

    <nav class="scroll-thin flex-1 overflow-y-auto px-3 py-3">
                <ul class="space-y-0.5">
            @foreach (config('ecoradar.nav') as $item)
                @php($active = request()->routeIs($item['match']))
                <li>
                    <a href="{{ route($item['route']) }}" title="{{ $item['label'] }}"
                       @class(['nav-item', 'nav-item-active' => $active])
                       @if ($active) aria-current="page" @endif>
                        @if ($active)
                            <span class="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-eco-600"></span>
                        @endif
                        <x-eco.icon :name="$item['icon']" class="h-[18px] w-[18px]" />
                        <span class="er-label truncate">{{ $item['label'] }}</span>
                        @if ($item['route'] === 'eco.reports.index')
                            <span class="er-label ml-auto rounded-md bg-coral-tint px-1.5 py-0.5 text-[11px] font-semibold text-coral-ink tabular"
                                  x-cloak x-show="$store.eco.ready"
                                  x-text="$store.eco.reports.filter(r => ['recebida','em_analise'].includes(r.status)).length"></span>
                        @endif
                    </a>
                </li>
            @endforeach
        </ul>
    </nav>

    <div class="border-t border-line px-3 py-3">
        <ul class="space-y-0.5">
            {{-- Só a equipe vê este item (a API também bloqueia quem não é administrador) --}}
            <li x-cloak x-show="$store.eco.isAdmin">
                <a href="{{ route('eco.admin') }}" title="Administração"
                   @class(['nav-item', 'nav-item-active' => request()->routeIs('eco.admin')])
                   @if (request()->routeIs('eco.admin')) aria-current="page" @endif>
                    <x-eco.icon name="shield-check" class="h-[18px] w-[18px]" />
                    <span class="er-label">Administração</span>
                </a>
            </li>
            @foreach (config('ecoradar.nav_secondary') as $item)
                @php($active = request()->routeIs($item['match']))
                <li>
                    <a href="{{ route($item['route']) }}" title="{{ $item['label'] }}" @class(['nav-item', 'nav-item-active' => $active])>
                        <x-eco.icon :name="$item['icon']" class="h-[18px] w-[18px]" />
                        <span class="er-label">{{ $item['label'] }}</span>
                    </a>
                </li>
            @endforeach
            <li>
                <button type="button" class="nav-item w-full" title="Sair" @click="$store.eco.logout()">
                    <x-eco.icon name="log-out" class="h-[18px] w-[18px]" />
                    <span class="er-label">Sair</span>
                </button>
            </li>
        </ul>

        <a href="{{ route('eco.profile') }}" class="er-usercard mt-3 flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:bg-stone">
            <x-eco.avatar class="h-9 w-9 text-[13px]" />
            <div class="er-label min-w-0 flex-1">
                <p class="truncate text-[13px] font-semibold text-ink" x-text="$store.eco.user.name">&nbsp;</p>
                <p class="flex items-center gap-1 truncate text-[11.5px] text-ink-muted">
                    <span class="h-1.5 w-1.5 rounded-full" :style="`background:${$store.eco.level.color}`"></span>
                    <span x-text="$store.eco.level.label"></span>
                    <span aria-hidden="true">·</span>
                    <span class="tabular" x-text="`${$u.formatNumber($store.eco.user.points)} pts`"></span>
                </p>
            </div>
        </a>

        <button type="button" class="er-collapsed-only icon-btn mx-auto mt-2 hidden" @click="$store.eco.toggleSidebar()" title="Expandir menu" aria-label="Expandir menu">
            <x-eco.icon name="panel-left-open" class="h-[18px] w-[18px]" />
        </button>
    </div>
</aside>
