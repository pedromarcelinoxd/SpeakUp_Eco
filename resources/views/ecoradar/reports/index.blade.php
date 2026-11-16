<x-eco.layout title="Denúncias" subtitle="Ocorrências ambientais registradas pela comunidade">

    <div x-data="reportsPage" class="space-y-5">
        {{-- Resumo por status --}}
        <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <button type="button" class="chip shrink-0" :class="!status && 'chip-active'" @click="status = ''">
                Todas <span class="tabular opacity-70" x-text="$store.eco.reports.length"></span>
            </button>
            <template x-for="[key, s] in Object.entries(statusList)" :key="key">
                <button type="button" class="chip shrink-0" :class="status === key && 'chip-active'" @click="status = status === key ? '' : key">
                    <span class="h-2 w-2 rounded-full" :style="`background:${s.color}`"></span>
                    <span x-text="s.label"></span>
                    <span class="tabular opacity-70" x-text="statusCount(key)"></span>
                </button>
            </template>
        </div>

        {{-- Barra de filtros --}}
        <div class="card p-3">
            <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
                <label class="relative flex-1">
                    <span class="sr-only">Pesquisar por título</span>
                    <x-eco.icon name="search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="search" x-model.debounce.200ms="q" placeholder="Pesquisar por título ou bairro..." class="input pl-10 shadow-none">
                </label>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
                    <label class="sr-only" for="f-cat">Categoria</label>
                    <select id="f-cat" x-model="category" class="input py-2.5 pr-9 shadow-none lg:w-44">
                        <option value="">Todas as categorias</option>
                        <template x-for="[key, c] in Object.entries(categories)" :key="key">
                            <option :value="key" x-text="c.label" :selected="category === key"></option>
                        </template>
                    </select>
                    <label class="sr-only" for="f-status">Status</label>
                    <select id="f-status" x-model="status" class="input py-2.5 pr-9 shadow-none lg:w-40">
                        <option value="">Todos os status</option>
                        <template x-for="[key, s] in Object.entries(statusList)" :key="key">
                            <option :value="key" x-text="s.label" :selected="status === key"></option>
                        </template>
                    </select>
                    <label class="sr-only" for="f-period">Período</label>
                    <select id="f-period" x-model="period" class="input py-2.5 pr-9 shadow-none lg:w-40">
                        <template x-for="[key, label] in Object.entries(periods)" :key="key">
                            <option :value="key" x-text="label"></option>
                        </template>
                    </select>
                    <label class="sr-only" for="f-sort">Ordenação</label>
                    <select id="f-sort" x-model="sort" class="input py-2.5 pr-9 shadow-none lg:w-40">
                        <option value="recent">Mais recentes</option>
                        <option value="oldest">Mais antigas</option>
                    </select>
                </div>
            </div>
        </div>

        {{-- Cabeçalho dos resultados --}}
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <p class="text-[13.5px] text-ink-muted">
                    <span class="font-semibold text-ink tabular" x-text="filtered.length"></span>
                    <span x-text="filtered.length === 1 ? 'ocorrência encontrada' : 'ocorrências encontradas'"></span>
                </p>
                <button type="button" x-show="hasFilters" x-cloak @click="clear()" class="text-[13px] font-semibold text-eco-700 hover:text-eco-900">Limpar filtros</button>
            </div>
            <div class="flex items-center gap-2">
                <label class="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-muted">
                    <input type="checkbox" x-model="onlyMine" class="h-4 w-4 rounded border-slate-300 text-eco-600 focus:ring-eco-600/30">
                    Só as minhas
                </label>
                <div class="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-card" role="group" aria-label="Modo de visualização">
                    <button type="button" @click="view = 'cards'" class="grid h-8 w-9 place-items-center rounded-lg transition" :class="view === 'cards' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'" aria-label="Cards" :aria-pressed="view === 'cards'">
                        <x-eco.icon name="layout-grid" class="h-4 w-4" />
                    </button>
                    <button type="button" @click="view = 'table'" class="grid h-8 w-9 place-items-center rounded-lg transition" :class="view === 'table' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'" aria-label="Tabela" :aria-pressed="view === 'table'">
                        <x-eco.icon name="list" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        {{-- Carregando --}}
        <div x-show="!$store.eco.ready" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for ($i = 0; $i < 6; $i++)
                <x-eco.skeleton-card />
            @endfor
        </div>

        {{-- Cards --}}
        <div x-cloak x-show="$store.eco.ready && view === 'cards' && filtered.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <template x-for="r in visible" :key="r.id">
                <x-eco.report-card class="animate-fade-up" />
            </template>
        </div>

        {{-- Tabela --}}
        <div x-cloak x-show="$store.eco.ready && view === 'table' && filtered.length" class="card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-left text-[13px]">
                    <thead class="border-b border-slate-200/80 bg-slate-50/80 text-[11.5px] uppercase tracking-wider text-ink-muted">
                        <tr>
                            <th scope="col" class="px-4 py-3 font-semibold">Ocorrência</th>
                            <th scope="col" class="px-4 py-3 font-semibold">Categoria</th>
                            <th scope="col" class="px-4 py-3 font-semibold">Localização</th>
                            <th scope="col" class="px-4 py-3 font-semibold">Data</th>
                            <th scope="col" class="px-4 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <template x-for="r in visible" :key="r.id">
                            <tr class="cursor-pointer transition hover:bg-slate-50" @click="open(r)" @keydown.enter="open(r)" tabindex="0">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <img :src="$u.photo(r)" alt="" class="h-10 w-14 shrink-0 rounded-lg object-cover">
                                        <span class="line-clamp-2 font-semibold text-ink" x-text="r.title"></span>
                                    </div>
                                </td>
                                <td class="px-4 py-3"><x-eco.category-pill /></td>
                                <td class="px-4 py-3 text-ink-muted" x-text="r.neighborhood"></td>
                                <td class="whitespace-nowrap px-4 py-3 text-ink-muted" x-text="$u.formatDate(r.createdAt)"></td>
                                <td class="px-4 py-3"><x-eco.status-badge /></td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        {{-- Mais resultados --}}
        <div x-cloak x-show="filtered.length > limit" class="flex justify-center">
            <button type="button" class="btn-secondary" @click="limit += 12">
                Carregar mais
                <span class="text-ink-muted tabular" x-text="`(${filtered.length - limit})`"></span>
            </button>
        </div>

        {{-- Vazio --}}
        <div x-cloak x-show="$store.eco.ready && !filtered.length" class="card">
            <x-eco.empty-state icon="search" title="Nenhuma ocorrência encontrada" text="Ajuste os filtros ou pesquise por outro termo. Viu um problema ambiental? Registre uma denúncia.">
                <div class="mt-5 flex gap-2">
                    <button type="button" class="btn-secondary" @click="clear()">Limpar filtros</button>
                    <a href="{{ route('eco.reports.create') }}" class="btn-secondary"><x-eco.icon name="plus" class="h-4 w-4" />Nova denúncia</a>
                </div>
            </x-eco.empty-state>
        </div>
    </div>
</x-eco.layout>
