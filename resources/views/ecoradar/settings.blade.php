<x-eco.layout title="Configurações" subtitle="Preferências, dados e conexão">
    <div x-data="settingsPage" class="mx-auto max-w-3xl space-y-6">

        {{-- Conta --}}
        <section class="card p-5 sm:p-6" aria-labelledby="c-conta">
            <h2 id="c-conta" class="section-title">Conta</h2>
            <div class="mt-4 flex flex-wrap items-center gap-4">
                <x-eco.avatar class="h-12 w-12 text-base" />
                <div class="min-w-0 flex-1">
                    <p class="font-semibold text-ink" x-text="$store.eco.user.fullName || $store.eco.user.name"></p>
                    <p class="text-[13px] text-ink-muted" x-text="$store.eco.isAuthenticated ? `Conectado como ${$store.eco.user.email}` : 'Você está usando a conta demonstrativa.'"></p>
                </div>
                <template x-if="$store.eco.isAuthenticated">
                    <button type="button" class="btn-secondary text-red-600" @click="$store.eco.logout()"><x-eco.icon name="log-out" class="h-4 w-4" />Sair</button>
                </template>
                <template x-if="!$store.eco.isAuthenticated">
                    <a href="{{ route('eco.login') }}" class="btn-primary"><x-eco.icon name="log-in" class="h-4 w-4" />Entrar ou criar conta</a>
                </template>
            </div>
        </section>

        {{-- Dados --}}
        <section class="card divide-y divide-slate-100" aria-labelledby="c-dados">
            <div class="p-5 sm:p-6">
                <h2 id="c-dados" class="section-title">Dados exibidos</h2>
                <p class="mt-0.5 text-[13px] text-ink-muted">Controle o que aparece no mapa, nas listas e nos indicadores.</p>
            </div>
            <label class="flex cursor-pointer items-start gap-4 p-5 sm:px-6">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><x-eco.icon name="sparkles" class="h-5 w-5" /></span>
                <span class="flex-1">
                    <span class="block text-[14px] font-semibold text-ink">Exibir dados demonstrativos</span>
                    <span class="mt-0.5 block text-[12.5px] leading-relaxed text-ink-muted">Ocorrências, pontos, ranking e notificações fictícios para apresentar a plataforma. São sempre identificados com o selo “Demonstração”.</span>
                </span>
                <input type="checkbox" class="peer sr-only" :checked="$store.eco.settings.showDemo" @change="toggleDemo()">
                <span class="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-slate-200 transition peer-checked:bg-eco-600 peer-focus-visible:ring-2 peer-focus-visible:ring-eco-600/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"></span>
            </label>
            <div class="flex flex-wrap items-center gap-4 p-5 sm:px-6">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-ink"><x-eco.icon name="layers" class="h-5 w-5" /></span>
                <div class="min-w-0 flex-1">
                    <p class="text-[14px] font-semibold text-ink">Estilo padrão do mapa</p>
                    <p class="text-[12.5px] text-ink-muted">Usado em todos os mapas da plataforma.</p>
                </div>
                <label for="map-layer" class="sr-only">Estilo do mapa</label>
                <select id="map-layer" class="input w-auto" :value="$store.eco.settings.mapLayer" @change="$store.eco.setSetting('mapLayer', $event.target.value)">
                    <option value="osm">Padrão (OpenStreetMap)</option>
                    <option value="light">Claro</option>
                    <option value="streets">Ruas</option>
                    <option value="satellite">Satélite</option>
                </select>
            </div>
            <div class="flex flex-wrap items-center gap-4 p-5 sm:px-6">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-ink"><x-eco.icon name="panel-left-close" class="h-5 w-5" /></span>
                <div class="min-w-0 flex-1">
                    <p class="text-[14px] font-semibold text-ink">Menu lateral recolhido</p>
                    <p class="text-[12.5px] text-ink-muted">Mostra apenas os ícones na barra lateral (desktop).</p>
                </div>
                <button type="button" class="btn-secondary btn-sm" @click="$store.eco.toggleSidebar()" x-text="$store.eco.settings.sidebarCollapsed ? 'Expandir' : 'Recolher'"></button>
            </div>
            <div class="flex flex-wrap items-center gap-4 p-5 sm:px-6">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><x-eco.icon name="trash" class="h-5 w-5" /></span>
                <div class="min-w-0 flex-1">
                    <p class="text-[14px] font-semibold text-ink">Apagar dados deste dispositivo</p>
                    <p class="text-[12.5px] text-ink-muted">Remove denúncias salvas localmente, confirmações, rascunhos e notificações lidas. Não afeta o servidor.</p>
                </div>
                <button type="button" class="btn-secondary btn-sm text-red-600" @click="confirmClear = true">Apagar</button>
            </div>
        </section>

        {{-- Conexão --}}
        <section class="card p-5 sm:p-6" aria-labelledby="c-api">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="c-api" class="section-title">Conexão com o servidor</h2>
                    <p class="mt-0.5 text-[13px] text-ink-muted">API Laravel do EcoRadar (<code class="rounded bg-slate-100 px-1 text-[12px]">/api</code>)</p>
                </div>
                <button type="button" class="btn-secondary btn-sm" @click="check()" :disabled="checking">
                    <x-eco.icon name="refresh" class="h-3.5 w-3.5" ::class="checking && 'animate-spin'" />
                    Testar
                </button>
            </div>
            <div class="mt-4 flex items-center gap-3 rounded-xl p-3.5"
                 :class="$store.eco.apiOnline === false ? 'bg-red-50 text-red-800' : ($store.eco.apiOnline ? 'bg-eco-50 text-eco-900' : 'bg-slate-50 text-ink-muted')">
                <span class="relative flex h-2.5 w-2.5">
                    <span x-show="$store.eco.apiOnline" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-eco-500 opacity-60"></span>
                    <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="$store.eco.apiOnline === false ? 'bg-red-500' : ($store.eco.apiOnline ? 'bg-eco-600' : 'bg-slate-400')"></span>
                </span>
                <p class="text-[13px] font-medium" x-text="checking ? 'Verificando…' : ($store.eco.apiOnline ? `Servidor online · ${latency ?? '—'} ms` : ($store.eco.apiOnline === false ? 'Servidor indisponível — exibindo apenas dados locais e demonstrativos.' : 'Status desconhecido'))"></p>
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
                <div class="rounded-xl border border-slate-100 p-3">
                    <dt class="text-ink-muted">Ecopontos (API)</dt>
                    <dd class="mt-0.5 font-display text-lg font-extrabold text-ink tabular" x-text="$store.eco.apiPoints.length"></dd>
                </div>
                <div class="rounded-xl border border-slate-100 p-3">
                    <dt class="text-ink-muted">Denúncias (API)</dt>
                    <dd class="mt-0.5 font-display text-lg font-extrabold text-ink tabular" x-text="$store.eco.apiReports.length"></dd>
                </div>
                <div class="rounded-xl border border-slate-100 p-3">
                    <dt class="text-ink-muted">Salvas no dispositivo</dt>
                    <dd class="mt-0.5 font-display text-lg font-extrabold text-ink tabular" x-text="$store.eco.localReports.length"></dd>
                </div>
            </dl>
            <p class="mt-3 text-[12.5px] text-ink-muted">O mapa e as denúncias são públicos; a conta é opcional.</p>
        </section>

        <section class="text-center text-[12px] text-slate-400">
            <p>EcoRadar · {{ config('ecoradar.tagline') }}</p>
            <p class="mt-0.5">Projeto UPX · Engenharia da Computação · FACENS</p>
        </section>

        <x-eco.sheet show="confirmClear" title="Apagar dados deste dispositivo?" max-width="sm:max-w-md">
            <p class="text-[14px] leading-relaxed text-ink-muted">Denúncias salvas localmente, confirmações e rascunhos serão removidos deste navegador. Essa ação não pode ser desfeita.</p>
            <div class="mt-6 flex justify-end gap-2">
                <button type="button" class="btn-ghost" @click="confirmClear = false">Cancelar</button>
                <button type="button" class="btn-danger" @click="clearLocal()">Apagar dados</button>
            </div>
        </x-eco.sheet>
    </div>
</x-eco.layout>
