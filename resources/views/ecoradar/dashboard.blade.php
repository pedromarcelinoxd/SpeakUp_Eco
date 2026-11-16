<x-eco.layout title="Visão geral" subtitle="Resumo da sua região">
    {{--
        Mesma gramática do app: hierarquia por escala tipográfica e divisórias finas,
        sem cartões de ícone + número; a ação "Nova denúncia" fica só na barra lateral.
    --}}
    <div x-data="dashboardPage" class="space-y-8">

        <section class="animate-fade-up">
            <h2 class="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
                <span x-text="greeting"></span>, <span x-text="$store.eco.user.name"></span>!
            </h2>
            <p class="mt-1 text-[14.5px] text-ink-muted">Confira o que está acontecendo na sua região.</p>
        </section>

        <x-eco.demo-notice text="Parte dos números abaixo vem de dados demonstrativos; a quantidade demonstrativa aparece sob cada número." />

        {{-- Indicadores: uma linha de números, divididos por linhas finas --}}
        <section aria-label="Indicadores" class="grid grid-cols-2 gap-y-6 border-y border-stone-dark/70 py-6 xl:grid-cols-4">
            @foreach ([
                ['k.total', 'kDemo.total', 'Denúncias registradas', route('eco.reports.index'), 'k.totalDelta'],
                ['k.resolved', 'kDemo.resolved', 'Resolvidas', route('eco.reports.index', ['status' => 'resolvida']), 'k.resolvedDelta'],
                ['k.open', 'kDemo.open', 'Abertas ou em análise', route('eco.reports.index', ['status' => 'em_analise']), null],
                ['k.points', 'kDemo.points', 'Pontos de descarte', route('eco.points.index'), null],
            ] as $i => [$value, $demo, $label, $href, $delta])
                <a href="{{ $href }}" @class([
                    'group block px-1 sm:px-5',
                    'border-l border-stone-dark/70' => $i % 2 === 1,
                    'xl:border-l xl:border-stone-dark/70' => $i === 2,
                ])>
                    <p class="font-display text-[34px] font-extrabold leading-none tracking-tight text-ink tabular group-hover:text-eco-800"
                       :class="'{{ $value }}' === 'k.open' && k.open > 0 && 'text-coral-ink'"
                       x-text="$u.formatNumber({{ $value }})">&nbsp;</p>
                    <p class="mt-2 text-[13px] font-medium text-ink">{{ $label }}</p>
                    @if ($delta)
                        <p class="mt-0.5 text-[12px] text-ink-muted tabular"
                           x-text="deltaText({{ $delta }})"></p>
                    @endif
                    <p x-cloak x-show="$store.eco.hasDemo && {{ $demo }} > 0" class="mt-0.5 text-[12px] text-pending tabular"
                       x-text="`${$u.formatNumber({{ $demo }})} demonstrativas`"></p>
                </a>
            @endforeach
        </section>

        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Mapa: o elemento dominante --}}
            <section class="lg:col-span-2" aria-labelledby="mapa-resumo">
                <div class="mb-3 flex items-end justify-between gap-3">
                    <div>
                        <h3 id="mapa-resumo" class="section-title text-[17px]">Perto de você</h3>
                        <p class="text-[13px] text-ink-muted">Denúncias abertas e pontos de descarte</p>
                    </div>
                    <a href="{{ route('eco.map') }}" class="btn-secondary btn-sm">
                        Explorar mapa
                        <x-eco.icon name="arrow-up-right" class="h-3.5 w-3.5" />
                    </a>
                </div>
                <div class="overflow-hidden rounded-2xl border border-stone-dark/70">
                    <div x-data="miniMap()" class="h-[340px] sm:h-[380px]">
                        <div x-ref="map" class="h-full w-full"></div>
                    </div>
                </div>
                <ul class="mt-2 divide-y divide-stone-dark/70">
                    <template x-for="r in nearby" :key="r.id">
                        <li>
                            <a :href="$u.route('report', r.id)" class="flex items-center gap-3 py-3 transition hover:bg-stone/40">
                                <span x-icon="$u.reportCategory(r.category).icon" class="er-icon h-[18px] w-[18px] text-coral-ink"></span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[14px] font-semibold text-ink" x-text="r.title"></span>
                                    <span class="block text-[12.5px] text-ink-muted" x-text="`${$u.status(r.status).label} · ${r.neighborhood}`"></span>
                                </span>
                                <span class="font-display text-[15px] font-bold text-ink tabular" x-text="$u.formatDistance(r.distance)"></span>
                            </a>
                        </li>
                    </template>
                </ul>
            </section>

            {{-- Sua contribuição: sem cartões aninhados --}}
            <section aria-labelledby="contrib">
                <div class="mb-3 flex items-end justify-between">
                    <h3 id="contrib" class="section-title text-[17px]">Sua contribuição</h3>
                    <a href="{{ route('eco.ranking') }}" class="text-[13px] font-semibold text-eco-700 hover:text-eco-900">Ver ranking</a>
                </div>
                <div class="flex items-baseline justify-between">
                    <p class="font-display text-[19px] font-bold text-ink" x-text="$store.eco.level.label"></p>
                    <p class="font-display text-[19px] font-bold text-ink tabular" x-text="`${$u.formatNumber($store.eco.user.points)} pts`"></p>
                </div>
                {{-- Progresso como faixa de calçadão (mesma assinatura do app) --}}
                <div class="mt-3 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-[3px]" role="progressbar" aria-label="Progresso de nível"
                     :aria-valuenow="Math.round($store.eco.level.progress)" aria-valuemin="0" aria-valuemax="100">
                    <template x-for="i in 36" :key="i">
                        <span class="aspect-square rounded-[3px]"
                              :class="stoneClass(i - 1)"></span>
                    </template>
                </div>
                <p class="mt-2 text-[12.5px] text-ink-muted"
                   x-text="$store.eco.level.next ? `Faltam ${$store.eco.level.remaining} pontos para ${$store.eco.level.next.label}` : 'Nível máximo alcançado'"></p>

                <dl class="mt-5 divide-y divide-stone-dark/70 border-y border-stone-dark/70">
                    @foreach ([
                        ['Denúncias realizadas', 'sent'],
                        ['Denúncias validadas', 'validated'],
                        ['Pontos ambientais encontrados', 'pointsFound'],
                    ] as [$label, $key])
                        <div class="flex items-baseline justify-between py-3">
                            <dt class="text-[13.5px] text-ink">{{ $label }}</dt>
                            <dd class="font-display text-[17px] font-bold text-ink tabular" x-text="$store.eco.user.stats.{{ $key }}"></dd>
                        </div>
                    @endforeach
                </dl>
                <p class="mt-3 text-[12px] leading-relaxed text-ink-muted">Pontos só contam depois que a equipe valida a denúncia.</p>
            </section>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
            {{-- Atividades recentes --}}
            <section class="lg:col-span-2" aria-labelledby="atividades">
                <div class="mb-1 flex items-end justify-between">
                    <h3 id="atividades" class="section-title text-[17px]">Atividade recente</h3>
                    <a href="{{ route('eco.reports.index') }}" class="text-[13px] font-semibold text-eco-700 hover:text-eco-900">Ver denúncias</a>
                </div>
                <ul class="divide-y divide-stone-dark/70">
                    <template x-for="a in activities" :key="a.id">
                        <li>
                            <a :href="activityUrl(a)" class="flex items-center gap-3 py-3 transition hover:bg-stone/40">
                                <span x-icon="meta(a).icon" class="er-icon h-[18px] w-[18px]" :style="`color:${meta(a).color}`"></span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[14px] font-semibold text-ink" x-text="activityText(a)"></span>
                                    <span class="block truncate text-[12.5px] text-ink-muted" x-text="`${meta(a).label} · ${activityDetail(a)}`"></span>
                                </span>
                                <span class="shrink-0 text-[12px] text-ink-muted" x-text="$u.timeAgo(a.date)"></span>
                            </a>
                        </li>
                    </template>
                    <li x-show="$store.eco.ready && !activities.length">
                        <x-eco.empty-state icon="activity" title="Sem atividades por aqui" text="Quando houver novas denúncias ou atualizações, elas aparecerão nesta lista." />
                    </li>
                </ul>
            </section>

            {{-- Descarte certo --}}
            <section aria-labelledby="descarte-rapido">
                <h3 id="descarte-rapido" class="section-title text-[17px]">Descarte certo</h3>
                <p class="text-[13px] text-ink-muted">Encontre o destino de cada resíduo.</p>
                <ul class="mt-2 divide-y divide-stone-dark/70">
                    <template x-for="[key, c] in Object.entries($u.POINT_CATEGORIES).filter(([k]) => k !== 'outros')" :key="key">
                        <li>
                            <a :href="`${$u.route('points')}?categoria=${key}`" class="flex items-center gap-3 py-2.5 text-[14px] font-medium text-ink transition hover:bg-stone/40">
                                <span x-icon="c.icon" class="er-icon h-[18px] w-[18px] text-eco-700"></span>
                                <span class="flex-1" x-text="c.label"></span>
                                <x-eco.icon name="chevron-right" class="h-4 w-4 text-ink-muted" />
                            </a>
                        </li>
                    </template>
                </ul>
            </section>
        </div>
    </div>
</x-eco.layout>
