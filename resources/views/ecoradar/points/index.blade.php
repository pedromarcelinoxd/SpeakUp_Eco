<x-eco.layout title="Pontos de descarte" subtitle="Locais adequados para cada tipo de resíduo">
    <div x-data="pointsPage" class="space-y-6">

        {{-- Hero de busca --}}
        <section class="relative overflow-hidden rounded-3xl border border-line bg-white p-5 text-ink sm:p-8">
            <svg class="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-eco-600/[.07]" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                <circle cx="100" cy="100" r="98" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="100" r="70" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="100" r="42" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div class="relative max-w-2xl">
                <h2 class="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-[30px]">Encontre o destino correto para seus resíduos.</h2>
                <p class="mt-2 text-[14px] text-ink-muted">Pesquise pelo material ou pela sua localização para encontrar o ponto mais próximo.</p>
            </div>
            <div class="relative mt-5 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <label class="relative">
                    <span class="sr-only">Pesquisar por material</span>
                    <x-eco.icon name="search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="search" x-model.debounce.200ms="material" placeholder="Material: pilha, óleo, celular, vidro…" class="input pl-10">
                </label>
                <form class="relative" @submit.prevent="searchPlace()">
                    <label for="place" class="sr-only">Pesquisar por localização</label>
                    <x-eco.icon name="map-pin" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="place" type="search" x-model="place" placeholder="Endereço ou bairro (Enter)" class="input pl-10 pr-11">
                    <button type="submit" class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink" aria-label="Buscar endereço">
                        <x-eco.icon name="arrow-right" class="h-4 w-4" x-show="!searchingPlace" />
                        <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="searchingPlace" />
                    </button>
                </form>
                <button type="button" @click="useMyLocation()" class="btn-secondary">
                    <x-eco.icon name="locate-fixed" class="h-4 w-4" />
                    Perto de mim
                </button>
            </div>
            <p class="relative mt-2.5 min-h-[1.25rem] text-[12.5px]">
                <span x-show="placeError" class="text-pending" x-text="placeError"></span>
                <span x-show="!placeError && placeLabel" class="text-ink-muted">Distâncias a partir de: <strong class="text-ink" x-text="placeLabel"></strong></span>
                <span x-show="!placeError && !placeLabel" class="text-ink-muted" x-text="$store.eco.location ? 'Distâncias a partir da sua última localização.' : 'Distâncias a partir do centro de Sorocaba.'"></span>
            </p>
        </section>

        {{-- Categorias --}}
        <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" class="chip shrink-0" :class="!category && 'chip-active'" @click="category = ''">Todos</button>
            <template x-for="[key, c] in Object.entries(categories)" :key="key">
                <button type="button" class="chip shrink-0" :class="category === key && 'chip-active'" @click="category = category === key ? '' : key" :aria-pressed="category === key">
                    <span x-icon="c.icon" class="er-icon h-3.5 w-3.5" :style="category !== key && `color:${c.color}`"></span>
                    <span x-text="c.short"></span>
                    <span class="tabular opacity-60" x-text="countFor(key)"></span>
                </button>
            </template>
        </div>

        <x-eco.demo-notice text="Os pontos marcados como “Demonstração” são fictícios. Confirme sempre horários e materiais aceitos com o local." />

        {{-- Barra de resultados --}}
        <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-[13.5px] text-ink-muted">
                <span class="font-semibold text-ink tabular" x-text="filtered.length"></span>
                <span x-text="filtered.length === 1 ? 'local encontrado' : 'locais encontrados'"></span>
            </p>
            <div class="flex items-center gap-2">
                <label for="p-sort" class="sr-only">Ordenar</label>
                <select id="p-sort" x-model="sort" class="input w-auto py-2 pr-9 text-[13px]">
                    <option value="distance">Mais próximos</option>
                    <option value="name">Nome (A–Z)</option>
                </select>
                <div class="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-card" role="group" aria-label="Visualização">
                    <button type="button" @click="view = 'list'" class="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition" :class="view === 'list' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'" :aria-pressed="view === 'list'">
                        <x-eco.icon name="list" class="h-4 w-4" /> Lista
                    </button>
                    <button type="button" @click="view = 'map'" class="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition" :class="view === 'map' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'" :aria-pressed="view === 'map'">
                        <x-eco.icon name="map" class="h-4 w-4" /> Mapa
                    </button>
                </div>
            </div>
        </div>

        {{-- Lista --}}
        <div x-show="view === 'list'">
            <div x-show="!$store.eco.ready" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                @for ($i = 0; $i < 6; $i++)
                    <div class="card space-y-3 p-4" aria-hidden="true"><div class="flex gap-3"><div class="skeleton h-11 w-11 rounded-xl"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-3/4"></div><div class="skeleton h-3 w-1/3"></div></div></div><div class="skeleton h-3 w-full"></div><div class="skeleton h-8 w-full rounded-xl"></div></div>
                @endfor
            </div>
            <div x-cloak x-show="$store.eco.ready" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <template x-for="p in filtered" :key="p.id">
                    <x-eco.point-card class="animate-fade-up" />
                </template>
            </div>
        </div>

        {{-- Mapa --}}
        <div x-cloak x-show="view === 'map'" class="card overflow-hidden">
            <div x-ref="map" class="h-[60vh] min-h-[380px] w-full"></div>
        </div>

        <div x-cloak x-show="$store.eco.ready && !filtered.length" class="card">
            <x-eco.empty-state icon="recycle" title="Nenhum local encontrado" text="Tente outro material ou remova o filtro de categoria.">
                <button type="button" class="btn-secondary mt-5" @click="clear()">Limpar filtros</button>
            </x-eco.empty-state>
        </div>
    </div>
</x-eco.layout>
