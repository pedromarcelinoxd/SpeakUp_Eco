<x-eco.layout title="Ponto de descarte" :back="route('eco.points.index')">
    <div x-data="pointDetail(@js($id))">
        <div x-show="!$store.eco.ready && !p" class="grid gap-6 lg:grid-cols-3">
            <div class="skeleton h-72 rounded-2xl lg:col-span-2"></div>
            <div class="skeleton h-72 rounded-2xl"></div>
        </div>

        <div x-cloak x-show="notFound" class="card">
            <x-eco.empty-state icon="circle-help" title="Local não encontrado" text="Ele pode ter sido removido, ou os dados demonstrativos estão desativados nas configurações.">
                <a href="{{ route('eco.points.index') }}" class="btn-secondary mt-5">Voltar para pontos de descarte</a>
            </x-eco.empty-state>
        </div>

        <template x-if="p">
            <div class="grid gap-6 lg:grid-cols-3">
                <div class="space-y-6 lg:col-span-2">
                    <section class="card overflow-hidden">
                        <div class="relative h-32 bg-eco-100 sm:h-36">
                            <svg class="absolute inset-0 h-full w-full text-eco-600/10" aria-hidden="true"><defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>
                        </div>
                        <div class="relative px-5 pb-6 sm:px-7">
                            <span class="-mt-9 grid h-[72px] w-[72px] place-items-center rounded-2xl border-4 border-white bg-white shadow-lift" :style="`color:${$u.pointCategory(p.category).color}`">
                                <span x-icon="$u.pointCategory(p.category).icon" class="er-icon h-8 w-8"></span>
                            </span>
                            <div class="mt-3 flex flex-wrap items-center gap-1.5">
                                <x-eco.category-pill type="point" expr="p.category" />
                                <x-eco.source-badge expr="p" />
                            </div>
                            <h2 class="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink" x-text="p.name"></h2>
                            <p class="mt-1.5 text-[14px] leading-relaxed text-ink-muted" x-text="p.description"></p>

                            <div class="mt-5 flex flex-wrap gap-2">
                                <a :href="$u.directionsUrl(p.coords)" target="_blank" rel="noopener" class="btn-primary">
                                    <x-eco.icon name="navigation" class="h-4 w-4" />
                                    Como chegar
                                </a>
                                <a :href="$u.route('map', { foco: p.id })" class="btn-secondary">
                                    <x-eco.icon name="map" class="h-4 w-4" />
                                    Ver no mapa
                                </a>
                            </div>
                        </div>
                    </section>

                    <section class="card p-5 sm:p-7" aria-labelledby="materiais">
                        <h3 id="materiais" class="section-title">Materiais aceitos</h3>
                        <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                            <template x-for="m in p.materials" :key="m">
                                <li class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] font-medium text-ink">
                                    <span class="grid h-6 w-6 place-items-center rounded-full bg-eco-100 text-eco-700"><x-eco.icon name="check" class="h-3.5 w-3.5" /></span>
                                    <span x-text="m"></span>
                                </li>
                            </template>
                        </ul>
                        <div class="mt-5 flex gap-3 rounded-2xl bg-info/[.07] p-4 text-[13px] text-slate-700">
                            <x-eco.icon name="lightbulb" class="mt-px h-4 w-4 shrink-0 text-info" />
                            <div>
                                <p class="font-semibold text-ink">Como preparar o descarte</p>
                                <p class="mt-0.5 leading-relaxed" x-text="$u.pointCategory(p.category).tip"></p>
                            </div>
                        </div>
                    </section>
                </div>

                <aside class="space-y-6">
                    <section class="card overflow-hidden">
                        <div x-data="miniMap({ mode: 'single', coords: p.coords, kind: 'point', item: p })" class="h-52">
                            <div x-ref="map" class="h-full w-full"></div>
                        </div>
                        <dl class="space-y-4 p-5 text-[13.5px]">
                            <div class="flex gap-3">
                                <x-eco.icon name="map-pin" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="text-[12px] text-ink-muted">Endereço</dt><dd class="font-medium text-ink" x-text="p.address"></dd>
                                    <dd x-show="p.approximate" class="text-[12px] text-ink-muted">Posição aproximada no campus</dd></div>
                            </div>
                            <div class="flex gap-3">
                                <x-eco.icon name="route" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="text-[12px] text-ink-muted">Distância</dt><dd class="font-medium text-ink" x-text="`${$u.formatDistance($store.eco.distanceTo(p.coords))} ${$store.eco.location ? 'de você' : 'do centro'}`"></dd></div>
                            </div>
                            <div class="flex gap-3">
                                <x-eco.icon name="clock" class="mt-0.5 h-4 w-4 text-slate-400" />
                                <div><dt class="text-[12px] text-ink-muted">Horário de funcionamento</dt><dd class="font-medium text-ink" x-text="p.hours"></dd></div>
                            </div>
                        </dl>
                    </section>

                    <section class="card p-5" x-show="nearby.length">
                        <h3 class="section-title">Outros pontos próximos</h3>
                        <ul class="mt-3 space-y-1">
                            <template x-for="x in nearby" :key="x.id">
                                <li>
                                    <a :href="$u.route('point', x.id)" class="-mx-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                                        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" :style="$u.tint($u.pointCategory(x.category).color, .12)"><span x-icon="$u.pointCategory(x.category).icon" class="er-icon h-4 w-4"></span></span>
                                        <span class="min-w-0 flex-1">
                                            <span class="block truncate text-[13px] font-semibold text-ink" x-text="x.name"></span>
                                            <span class="block text-[12px] text-ink-muted" x-text="$u.pointCategory(x.category).label"></span>
                                        </span>
                                        <span class="text-[12px] font-semibold text-ink-muted tabular" x-text="$u.formatDistance(x.d)"></span>
                                    </a>
                                </li>
                            </template>
                        </ul>
                    </section>
                </aside>
            </div>
        </template>
    </div>
</x-eco.layout>
