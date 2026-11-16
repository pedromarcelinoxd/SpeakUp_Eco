<x-eco.layout title="Mapa ambiental" subtitle="Denúncias e pontos de descarte em tempo real" :full-bleed="true" :hide-header-on-mobile="true">
    <div x-data="mapPage" class="relative h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] overflow-hidden lg:h-[calc(100dvh-4rem)]"
         @keydown.escape.window="searchOpen ? (searchOpen = false) : closePanel()">

        {{-- Mapa --}}
        <div x-ref="map" class="absolute inset-0 z-0" role="application" aria-label="Mapa ambiental interativo"></div>

        {{-- ============ Topo: pesquisa + chips ============ --}}
        <div class="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
            <div class="flex items-start gap-2 lg:mr-14">
                {{-- Pesquisa --}}
                <div class="pointer-events-auto relative w-full max-w-[420px]" @click.outside="searchOpen = false">
                    <form class="flex h-12 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white pl-3.5 pr-1.5 shadow-float"
                          @submit.prevent="searchAddress(); searchOpen = true" role="search">
                        <a href="{{ route('eco.dashboard') }}" class="-ml-1 mr-1 shrink-0 lg:hidden" aria-label="Início">
                            <x-eco.logo class="h-7 w-7" />
                        </a>
                        <x-eco.icon name="search" class="hidden h-[18px] w-[18px] text-slate-400 lg:inline-block" />
                        <label for="map-search" class="sr-only">Pesquisar local ou categoria</label>
                        <input id="map-search" type="search" x-model="query" autocomplete="off"
                               @focus="searchOpen = true" @input="searchOpen = true"
                               placeholder="Pesquisar local ou categoria..."
                               class="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[14px] text-ink placeholder:text-slate-400 focus:ring-0">
                        <button type="button" x-show="query" @click="clearSearch()" class="icon-btn h-8 w-8" aria-label="Limpar pesquisa">
                            <x-eco.icon name="x" class="h-4 w-4" />
                        </button>
                        <button type="button" @click="panel = panel === 'filters' ? null : 'filters'"
                                class="icon-btn relative h-9 w-9" :class="panel === 'filters' && 'bg-slate-100 text-ink'" aria-label="Filtros">
                            <x-eco.icon name="sliders" class="h-[18px] w-[18px]" />
                            <span x-show="activeFilterCount" class="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-eco-600 px-1 text-[10px] font-bold text-white" x-text="activeFilterCount"></span>
                        </button>
                    </form>

                    {{-- Sugestões --}}
                    <div x-cloak x-show="searchOpen && query.trim().length >= 2" x-transition.opacity.duration.150ms
                         class="absolute inset-x-0 top-14 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-float scroll-thin">
                        <template x-if="suggestions.categories.length">
                            <div class="mb-1 border-b border-slate-100 pb-1.5">
                                <p class="eyebrow px-2.5 py-1.5">Categorias</p>
                                <template x-for="c in suggestions.categories" :key="c.kind + c.key">
                                    <button type="button" @click="pickCategory(c)" class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50">
                                        <span class="grid h-8 w-8 place-items-center rounded-lg" :style="$u.tint(c.color, .12)"><span x-icon="c.icon" class="er-icon h-4 w-4"></span></span>
                                        <span class="flex-1 text-[13.5px] font-medium text-ink">Mostrar <span class="font-semibold" x-text="c.label"></span></span>
                                        <span class="text-[11.5px] text-slate-400" x-text="c.kind === 'report' ? 'Denúncias' : 'Descarte'"></span>
                                    </button>
                                </template>
                            </div>
                        </template>
                        <template x-for="s in suggestions.items" :key="s.item.id">
                            <button type="button" @click="pickSuggestion(s)" class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50">
                                <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                                      :style="$u.tint(s.kind === 'report' ? $u.reportCategory(s.item.category).color : $u.pointCategory(s.item.category).color, .12)">
                                    <span x-icon="s.kind === 'report' ? $u.reportCategory(s.item.category).icon : $u.pointCategory(s.item.category).icon" class="er-icon h-4 w-4"></span>
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[13.5px] font-medium text-ink" x-text="s.title"></span>
                                    <span class="block truncate text-[12px] text-ink-muted" x-text="s.sub"></span>
                                </span>
                            </button>
                        </template>

                        <div class="mt-1 border-t border-slate-100 pt-1.5">
                            <template x-for="a in addressResults" :key="a.label">
                                <button type="button" @click="goToAddress(a)" class="flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50">
                                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><x-eco.icon name="map-pin" class="h-4 w-4" /></span>
                                    <span class="line-clamp-2 flex-1 text-[13px] text-ink" x-text="a.label"></span>
                                </button>
                            </template>
                            <p x-show="addressError" class="px-2.5 py-2 text-[12.5px] text-ink-muted" x-text="addressError"></p>
                            <button type="button" x-show="!addressResults.length" @click="searchAddress()"
                                    class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50">
                                <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-info/10 text-info">
                                    <x-eco.icon name="globe" class="h-4 w-4" x-show="!searchingAddress" />
                                    <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="searchingAddress" />
                                </span>
                                <span class="flex-1 text-[13.5px] text-ink">Buscar endereço “<span class="font-semibold" x-text="query"></span>”</span>
                                <kbd class="hidden rounded border border-slate-200 px-1.5 text-[10px] text-slate-400 sm:block">Enter</kbd>
                            </button>
                        </div>
                    </div>
                </div>

                {{-- Contador (desktop) --}}
                <div class="pointer-events-auto ml-auto hidden h-12 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 text-[13px] shadow-float xl:flex" aria-live="polite">
                    <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-eco-500 opacity-60"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-eco-600"></span></span>
                    <span class="font-semibold text-ink tabular" x-text="visibleCount"></span>
                    <span class="text-ink-muted">itens no mapa</span>
                </div>
            </div>

            {{-- Chips de categorias --}}
            <div class="no-scrollbar pointer-events-auto -mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 lg:mr-14">
                <div class="flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5 shadow-card">
                    @foreach (['all' => 'Tudo', 'reports' => 'Denúncias', 'points' => 'Descarte'] as $key => $label)
                        <button type="button" @click="mode = '{{ $key }}'; setAll('reportCats', true); setAll('pointCats', true)"
                                class="rounded-full px-3 py-1 text-[13px] font-semibold transition"
                                :class="mode === '{{ $key }}' && (reportCats.length === Object.keys(reportCategories).length && pointCats.length === Object.keys(pointCategories).length) ? 'bg-eco-600 text-white' : 'text-ink-muted hover:text-ink'">
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
                <span class="my-1.5 w-px shrink-0 bg-slate-300/70" aria-hidden="true"></span>
                <template x-for="[key, c] in Object.entries(reportCategories)" :key="'r' + key">
                    <button type="button" class="chip shrink-0" :class="isQuickActive('report', key) && 'chip-active'" @click="quickCategory('report', key)" :aria-pressed="isQuickActive('report', key)">
                        <span x-icon="c.icon" class="er-icon h-3.5 w-3.5" :style="!isQuickActive('report', key) && `color:${c.color}`"></span>
                        <span x-text="c.short"></span>
                    </button>
                </template>
                <span class="my-1.5 w-px shrink-0 bg-slate-300/70" aria-hidden="true"></span>
                <template x-for="[key, c] in Object.entries(pointCategories).filter(([k]) => k !== 'outros')" :key="'p' + key">
                    <button type="button" class="chip shrink-0" :class="isQuickActive('point', key) && 'chip-active'" @click="quickCategory('point', key)" :aria-pressed="isQuickActive('point', key)">
                        <span x-icon="c.icon" class="er-icon h-3.5 w-3.5" :style="!isQuickActive('point', key) && `color:${c.color}`"></span>
                        <span x-text="c.short"></span>
                    </button>
                </template>
            </div>
        </div>

        {{-- ============ Controles à direita ============ --}}
        <div class="absolute right-3 top-[8.5rem] z-[500] flex flex-col gap-2 sm:right-4 lg:top-4">
            <div class="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-float">
                <button type="button" @click="zoomIn()" class="grid h-11 w-11 place-items-center text-ink hover:bg-slate-50" aria-label="Aproximar"><x-eco.icon name="plus" class="h-[18px] w-[18px]" /></button>
                <span class="mx-2 h-px bg-slate-200"></span>
                <button type="button" @click="zoomOut()" class="grid h-11 w-11 place-items-center text-ink hover:bg-slate-50" aria-label="Afastar"><x-eco.icon name="minus" class="h-[18px] w-[18px]" /></button>
            </div>
            <button type="button" @click="locate()" class="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-info shadow-float hover:bg-slate-50" aria-label="Minha localização" title="Minha localização">
                <x-eco.icon name="locate-fixed" class="h-[18px] w-[18px]" x-show="!locating" />
                <x-eco.icon name="loader" class="h-[18px] w-[18px] animate-spin" x-show="locating" />
            </button>
            <div class="relative" @click.outside="layerMenu = false">
                <button type="button" @click="layerMenu = !layerMenu" class="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-ink shadow-float hover:bg-slate-50" aria-label="Camadas do mapa" title="Camadas" :aria-expanded="layerMenu">
                    <x-eco.icon name="layers" class="h-[18px] w-[18px]" />
                </button>
                <div x-cloak x-show="layerMenu" x-transition.origin.top.right class="absolute right-12 top-0 w-48 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-float">
                    <p class="eyebrow px-2.5 py-1.5">Estilo do mapa</p>
                    <template x-for="[key, l] in Object.entries(layers)" :key="key">
                        <button type="button" @click="setLayer(key)" class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium hover:bg-slate-50"
                                :class="$store.eco.settings.mapLayer === key ? 'text-eco-800' : 'text-ink'">
                            <span x-icon="l.icon" class="er-icon h-4 w-4"></span>
                            <span class="flex-1" x-text="l.label"></span>
                            <span x-show="$store.eco.settings.mapLayer === key" x-icon="'check'" class="er-icon h-4 w-4"></span>
                        </button>
                    </template>
                </div>
            </div>
            <button type="button" @click="fitAll()" class="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-ink shadow-float hover:bg-slate-50" aria-label="Ver todos os itens" title="Ver todos">
                <x-eco.icon name="maximize" class="h-[18px] w-[18px]" />
            </button>
        </div>

        {{-- ============ Legenda (desktop) ============ --}}
        <div class="absolute bottom-6 left-4 z-[400] hidden w-64 lg:block" x-show="panel === null" x-transition.opacity>
            <div class="rounded-2xl border border-slate-200/80 bg-white/95 shadow-float backdrop-blur">
                <button type="button" @click="legendOpen = !legendOpen" class="flex w-full items-center justify-between px-4 py-3" :aria-expanded="legendOpen">
                    <span class="section-title text-[13.5px]">Legenda</span>
                    <x-eco.icon name="chevron-down" class="h-4 w-4 text-slate-400 transition" ::class="legendOpen && 'rotate-180'" />
                </button>
                <div x-show="legendOpen" x-transition.opacity.duration.150ms class="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 text-[12.5px]">
                    <div>
                        <p class="eyebrow mb-2 flex items-center gap-1.5">
                            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M5 12S0 7.5 0 4.6a5 5 0 0 1 10 0C10 7.5 5 12 5 12Z" fill="#64748B"/></svg>
                            Denúncias
                        </p>
                        <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <template x-for="[k, c] in Object.entries(reportCategories)" :key="k">
                                <li class="flex items-center gap-1.5 text-ink"><span class="h-2.5 w-2.5 rounded-full" :style="`background:${c.color}`"></span><span class="truncate" x-text="c.short"></span></li>
                            </template>
                        </ul>
                    </div>
                    <div>
                        <p class="eyebrow mb-2 flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-[3px] border-2 border-slate-500"></span>Pontos de descarte</p>
                        <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <template x-for="[k, c] in Object.entries(pointCategories)" :key="k">
                                <li class="flex items-center gap-1.5 text-ink"><span class="h-2.5 w-2.5 rounded-[3px]" :style="`background:${c.color}`"></span><span class="truncate" x-text="c.short"></span></li>
                            </template>
                        </ul>
                    </div>
                    <div>
                        <p class="eyebrow mb-2">Status (ponto no marcador)</p>
                        <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <template x-for="[k, s] in Object.entries(statusList)" :key="k">
                                <li class="flex items-center gap-1.5 text-ink"><span class="h-2 w-2 rounded-full ring-2 ring-white" :style="`background:${s.color}`"></span><span class="truncate" x-text="s.label"></span></li>
                            </template>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        {{-- ============ Painel lateral (desktop) / bottom sheet (mobile) ============ --}}
        <aside x-cloak x-show="panel"
               x-transition:enter="transition ease-out duration-300" x-transition:enter-start="translate-y-full lg:translate-y-0 lg:-translate-x-6 opacity-0" x-transition:enter-end="translate-y-0 lg:translate-x-0 opacity-100"
               x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="translate-y-full lg:translate-y-0 lg:-translate-x-6 opacity-0"
               class="absolute inset-x-0 bottom-0 z-[600] flex max-h-[68%] flex-col rounded-t-3xl border border-slate-200/80 bg-white shadow-float lg:inset-x-auto lg:bottom-4 lg:left-4 lg:top-[7.75rem] lg:max-h-none lg:w-[380px] lg:rounded-3xl"
               :aria-label="panel === 'filters' ? 'Filtros do mapa' : 'Detalhes'">
            <div class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 lg:hidden"></div>

            {{-- -------- Filtros -------- --}}
            <template x-if="panel === 'filters'">
                <div class="flex min-h-0 flex-1 flex-col">
                    <div class="flex items-center justify-between px-5 pb-2 pt-3 lg:pt-5">
                        <h2 class="font-display text-[17px] font-bold">Filtros</h2>
                        <div class="flex items-center gap-1">
                            <button type="button" @click="resetFilters()" class="btn-ghost btn-sm">Limpar</button>
                            <button type="button" @click="closePanel()" class="icon-btn h-9 w-9" aria-label="Fechar filtros"><x-eco.icon name="x" class="h-5 w-5" /></button>
                        </div>
                    </div>
                    <div class="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5">
                        {{-- Período --}}
                        <fieldset>
                            <legend class="eyebrow mb-2">Período das denúncias</legend>
                            <div class="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                                @foreach (['30' => '30 dias', '90' => '90 dias', '365' => '1 ano', 'all' => 'Tudo'] as $v => $l)
                                    <button type="button" @click="period = '{{ $v }}'" class="rounded-lg py-1.5 text-[12.5px] font-semibold transition"
                                            :class="period === '{{ $v }}' ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'">{{ $l }}</button>
                                @endforeach
                            </div>
                        </fieldset>

                        {{-- Ocorrências --}}
                        <fieldset :disabled="mode === 'points'" :class="mode === 'points' && 'opacity-50'">
                            <div class="mb-2 flex items-center justify-between">
                                <legend class="eyebrow">Ocorrências</legend>
                                <button type="button" class="text-[12px] font-semibold text-eco-700" @click="setAll('reportCats', reportCats.length !== Object.keys(reportCategories).length)"
                                        x-text="reportCats.length === Object.keys(reportCategories).length ? 'Desmarcar todas' : 'Marcar todas'"></button>
                            </div>
                            <div class="space-y-1">
                                <template x-for="[key, c] in Object.entries(reportCategories)" :key="key">
                                    <label class="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                                        <span class="grid h-8 w-8 place-items-center rounded-lg text-white" :style="`background:${c.color}`"><span x-icon="c.icon" class="er-icon h-4 w-4"></span></span>
                                        <span class="flex-1 text-[13.5px] font-medium text-ink" x-text="c.label"></span>
                                        <span class="text-[12px] text-slate-400 tabular" x-text="countFor('report', key)"></span>
                                        <input type="checkbox" class="peer sr-only" :checked="reportCats.includes(key)" @change="toggle('reportCats', key)">
                                        <span class="relative h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-eco-600 peer-focus-visible:ring-2 peer-focus-visible:ring-eco-600/40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"></span>
                                    </label>
                                </template>
                            </div>
                        </fieldset>

                        {{-- Status --}}
                        <fieldset :disabled="mode === 'points'" :class="mode === 'points' && 'opacity-50'">
                            <legend class="eyebrow mb-2">Status</legend>
                            <div class="flex flex-wrap gap-2">
                                <template x-for="[key, s] in Object.entries(statusList)" :key="key">
                                    <button type="button" class="chip" :class="statuses.includes(key) && 'border-transparent bg-slate-800 text-white hover:text-white'" @click="toggle('statuses', key)" :aria-pressed="statuses.includes(key)">
                                        <span class="h-2 w-2 rounded-full" :style="`background:${s.color}`"></span>
                                        <span x-text="s.label"></span>
                                    </button>
                                </template>
                            </div>
                        </fieldset>

                        {{-- Pontos ambientais --}}
                        <fieldset :disabled="mode === 'reports'" :class="mode === 'reports' && 'opacity-50'">
                            <div class="mb-2 flex items-center justify-between">
                                <legend class="eyebrow">Pontos ambientais</legend>
                                <button type="button" class="text-[12px] font-semibold text-eco-700" @click="setAll('pointCats', pointCats.length !== Object.keys(pointCategories).length)"
                                        x-text="pointCats.length === Object.keys(pointCategories).length ? 'Desmarcar todos' : 'Marcar todos'"></button>
                            </div>
                            <div class="space-y-1">
                                <template x-for="[key, c] in Object.entries(pointCategories)" :key="key">
                                    <label class="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                                        <span class="grid h-8 w-8 place-items-center rounded-lg border-2 bg-white" :style="`border-color:${c.color};color:${c.color}`"><span x-icon="c.icon" class="er-icon h-4 w-4"></span></span>
                                        <span class="flex-1 text-[13.5px] font-medium text-ink" x-text="c.label"></span>
                                        <span class="text-[12px] text-slate-400 tabular" x-text="countFor('point', key)"></span>
                                        <input type="checkbox" class="peer sr-only" :checked="pointCats.includes(key)" @change="toggle('pointCats', key)">
                                        <span class="relative h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-eco-600 peer-focus-visible:ring-2 peer-focus-visible:ring-eco-600/40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"></span>
                                    </label>
                                </template>
                            </div>
                        </fieldset>
                    </div>
                    <div class="border-t border-slate-100 p-4">
                        <button type="button" @click="closePanel()" class="btn-dark w-full">
                            Mostrar <span class="tabular" x-text="visibleCount"></span> itens
                        </button>
                    </div>
                </div>
            </template>

            {{-- -------- Detalhes: denúncia -------- --}}
            <template x-if="panel === 'detail' && selected?.kind === 'report'">
                <div class="flex min-h-0 flex-1 flex-col" x-data="{ r: selected.item }" x-effect="r = selected.item">
                    <div class="scroll-thin min-h-0 flex-1 overflow-y-auto">
                        <div class="relative m-3 mb-0 overflow-hidden rounded-2xl">
                            <img :src="$u.photo(r)" :alt="$u.hasRealPhoto(r) ? `Foto: ${r.title}` : 'Imagem ilustrativa da categoria'" class="aspect-[16/9] w-full object-cover">
                            <button type="button" @click="closePanel()" class="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-card backdrop-blur hover:bg-white" aria-label="Fechar detalhes">
                                <x-eco.icon name="x" class="h-[18px] w-[18px]" />
                            </button>
                            <span x-show="!$u.hasRealPhoto(r)" class="absolute bottom-2 left-2 badge bg-black/40 text-white backdrop-blur">Sem foto real</span>
                        </div>
                        <div class="space-y-4 p-5">
                            <div class="flex flex-wrap items-center gap-1.5">
                                <x-eco.category-pill />
                                <x-eco.status-badge />
                                <x-eco.source-badge />
                            </div>
                            <h2 class="font-display text-[19px] font-bold leading-snug text-ink" x-text="r.title"></h2>
                            <p class="text-[13.5px] leading-relaxed text-ink-muted" x-text="r.description"></p>
                            <dl class="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 text-[12.5px]">
                                <div>
                                    <dt class="text-ink-muted">Data</dt>
                                    <dd class="mt-0.5 font-semibold text-ink" x-text="$u.formatDate(r.createdAt)"></dd>
                                </div>
                                <div>
                                    <dt class="text-ink-muted">Distância</dt>
                                    <dd class="mt-0.5 font-semibold text-ink" x-text="distance(r)"></dd>
                                </div>
                                <div class="col-span-2">
                                    <dt class="text-ink-muted">Localização</dt>
                                    <dd class="mt-0.5 font-semibold text-ink" x-text="r.address"></dd>
                                </div>
                                <div x-show="r.confirmations">
                                    <dt class="text-ink-muted">Confirmações</dt>
                                    <dd class="mt-0.5 font-semibold text-ink" x-text="`${r.confirmations + ($store.eco.isConfirmed(r.id) ? 1 : 0)} moradores`"></dd>
                                </div>
                                <div>
                                    <dt class="text-ink-muted">Gravidade</dt>
                                    <dd class="mt-0.5 font-semibold" :style="`color:${$u.severity(r.severity).color}`" x-text="$u.severity(r.severity).label"></dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                    <div class="flex gap-2 border-t border-slate-100 p-4">
                        <a :href="$u.route('report', r.id)" class="btn-primary flex-1">
                            Ver detalhes
                            <x-eco.icon name="arrow-right" class="h-4 w-4" />
                        </a>
                        <button type="button" class="btn-secondary" @click="$store.eco.confirmReport(r.id)" :disabled="$store.eco.isConfirmed(r.id) || ['resolvida','nao_confirmada'].includes(r.status)"
                                :title="$store.eco.isConfirmed(r.id) ? 'Você já confirmou' : 'Confirmar ocorrência'">
                            <x-eco.icon name="thumbs-up" class="h-4 w-4" />
                            <span x-text="$store.eco.isConfirmed(r.id) ? 'Confirmada' : 'Confirmar'"></span>
                        </button>
                    </div>
                </div>
            </template>

            {{-- -------- Detalhes: ponto de descarte -------- --}}
            <template x-if="panel === 'detail' && selected?.kind === 'point'">
                <div class="flex min-h-0 flex-1 flex-col" x-data="{ p: selected.item }" x-effect="p = selected.item">
                    <div class="scroll-thin min-h-0 flex-1 overflow-y-auto p-5">
                        <div class="flex items-start gap-3">
                            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" :style="`background:${$u.pointCategory(p.category).color}`">
                                <span x-icon="$u.pointCategory(p.category).icon" class="er-icon h-6 w-6"></span>
                            </span>
                            <div class="min-w-0 flex-1">
                                <p class="text-[12.5px] font-semibold" :style="`color:${$u.pointCategory(p.category).color}`" x-text="$u.pointCategory(p.category).label"></p>
                                <h2 class="font-display text-[19px] font-bold leading-snug text-ink" x-text="p.name"></h2>
                            </div>
                            <button type="button" @click="closePanel()" class="icon-btn -mr-2 -mt-1 h-9 w-9" aria-label="Fechar detalhes"><x-eco.icon name="x" class="h-5 w-5" /></button>
                        </div>
                        <div class="mt-2"><x-eco.source-badge expr="p" /></div>

                        <dl class="mt-5 space-y-3.5 text-[13px]">
                            <div class="flex gap-3">
                                <x-eco.icon name="map-pin" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="sr-only">Endereço</dt><dd class="text-ink" x-text="p.address"></dd>
                                    <dd x-show="p.approximate" class="text-[11.5px] text-ink-muted">Posição aproximada no campus</dd></div>
                            </div>
                            <div class="flex gap-3">
                                <x-eco.icon name="route" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="sr-only">Distância</dt><dd class="text-ink"><span class="font-semibold" x-text="distance(p)"></span> <span class="text-ink-muted" x-text="$store.eco.location ? 'de você' : 'do centro de Sorocaba'"></span></dd></div>
                            </div>
                            <div class="flex gap-3">
                                <x-eco.icon name="clock" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="sr-only">Horário</dt><dd class="text-ink" x-text="p.hours"></dd></div>
                            </div>
                        </dl>

                        <div class="mt-5">
                            <p class="eyebrow mb-2">Materiais aceitos</p>
                            <div class="flex flex-wrap gap-1.5">
                                <template x-for="m in p.materials" :key="m">
                                    <span class="inline-flex items-center gap-1 rounded-lg bg-eco-50 px-2.5 py-1 text-[12px] font-medium text-eco-900">
                                        <x-eco.icon name="check" class="h-3 w-3" />
                                        <span x-text="m"></span>
                                    </span>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 border-t border-slate-100 p-4">
                        <a :href="$u.directionsUrl(p.coords)" target="_blank" rel="noopener" class="btn-primary flex-1">
                            <x-eco.icon name="navigation" class="h-4 w-4" />
                            Como chegar
                        </a>
                        <a :href="$u.route('point', p.id)" class="btn-secondary">Detalhes</a>
                    </div>
                </div>
            </template>
        </aside>

        {{-- A ação "Nova denúncia" fica na barra lateral (desktop) e no menu inferior (mobile): sem botão duplicado aqui. --}}

        {{-- Contador (mobile/tablet) --}}
        <div x-show="panel === null" class="absolute bottom-4 left-1/2 z-[400] -translate-x-1/2 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-1.5 text-[12.5px] shadow-lift backdrop-blur xl:hidden">
            <span class="font-semibold text-ink tabular" x-text="visibleCount"></span> <span class="text-ink-muted">itens no mapa</span>
        </div>
    </div>
</x-eco.layout>
