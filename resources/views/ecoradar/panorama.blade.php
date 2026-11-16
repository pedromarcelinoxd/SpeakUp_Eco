<x-eco.layout title="Panorama ambiental" subtitle="Indicadores e tendências das ocorrências">
    <div x-data="panoramaPage" class="space-y-6">
        <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 class="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">Panorama ambiental</h2>
                <p class="mt-1 text-[14.5px] text-ink-muted">Como a cidade está evoluindo no combate aos problemas ambientais.</p>
            </div>
            <div class="flex rounded-xl bg-slate-200/60 p-1" role="tablist" aria-label="Período">
                <template x-for="[k, l] in Object.entries(periods)" :key="k">
                    <button type="button" role="tab" @click="period = k" :aria-selected="period === k"
                            class="rounded-lg px-3 py-1.5 text-[13px] font-semibold transition sm:px-4"
                            :class="period === k ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'" x-text="l"></button>
                </template>
            </div>
        </section>

        <x-eco.demo-notice text="Os indicadores combinam dados reais da API com o histórico demonstrativo." />

        {{-- KPIs --}}
        <section class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <x-eco.stat-card label="Total de denúncias" icon="megaphone" color="#A9472B" value="$u.formatNumber(k.total)" hint="No período selecionado" spark="k.totalSpark" />
            <x-eco.stat-card label="Ocorrências resolvidas" icon="circle-check" color="#16A34A" value="$u.formatNumber(k.resolved)" hint="No período selecionado" spark="k.resolvedSpark" />
            <x-eco.stat-card label="Em análise" icon="hourglass" color="#D97706" value="$u.formatNumber(k.open)" hint="Aguardando solução" spark="k.openSpark" />
            <x-eco.stat-card label="Pontos de descarte" icon="recycle" color="#176B56" value="$u.formatNumber(k.points)" hint="Cadastrados na plataforma" />
        </section>

        <div class="grid gap-6 lg:grid-cols-3">
            {{-- Evolução --}}
            <section class="card p-5 lg:col-span-2" aria-labelledby="g-evolucao">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h3 id="g-evolucao" class="section-title">Evolução ao longo do tempo</h3>
                        <p class="text-[12.5px] text-ink-muted">Denúncias registradas e resolvidas</p>
                    </div>
                </div>
                <div class="relative mt-4 h-[260px]">
                    <div x-show="loadingCharts" class="skeleton absolute inset-0 rounded-xl"></div>
                    <canvas x-ref="timeChart" role="img" aria-label="Gráfico de linhas com denúncias registradas e resolvidas por período"></canvas>
                </div>
            </section>

            {{-- Taxa de resolução --}}
            <section class="card flex flex-col p-5" aria-labelledby="g-taxa">
                <h3 id="g-taxa" class="section-title">Taxa de resolução</h3>
                <p class="text-[12.5px] text-ink-muted">Ocorrências solucionadas no período</p>
                <div class="relative mx-auto mt-4 h-[180px] w-[180px]">
                    <canvas x-ref="rateChart" role="img" aria-label="Gráfico de rosca da taxa de resolução"></canvas>
                    <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
                        <div>
                            <p class="font-display text-[34px] font-extrabold leading-none text-ink tabular" x-text="`${k.resolutionRate}%`"></p>
                            <p class="mt-1 text-[12px] text-ink-muted">resolvidas</p>
                        </div>
                    </div>
                </div>
                <dl class="mt-auto grid grid-cols-2 gap-3 pt-5 text-[12.5px]">
                    <div class="rounded-xl bg-slate-50 p-3">
                        <dt class="text-ink-muted">Tempo médio</dt>
                        <dd class="mt-0.5 font-display text-lg font-extrabold text-ink tabular" x-text="`${avgResolutionDays.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`"></dd>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-3">
                        <dt class="text-ink-muted">Em andamento</dt>
                        <dd class="mt-0.5 font-display text-lg font-extrabold text-ink tabular" x-text="$u.formatNumber(reports.filter(r => ['recebida','em_analise','verificada'].includes(r.status)).length)"></dd>
                    </div>
                </dl>
                <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
                    <li class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-eco-600"></span>Resolvidas</li>
                    <li class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Em andamento</li>
                    <li class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-slate-300"></span>Não confirmadas</li>
                </ul>
            </section>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
            {{-- Por categoria --}}
            <section class="card p-5" aria-labelledby="g-cat">
                <h3 id="g-cat" class="section-title">Denúncias por categoria</h3>
                <p class="text-[12.5px] text-ink-muted">Tipos de problema mais frequentes</p>
                <div class="relative mt-4 h-[260px]">
                    <canvas x-ref="catChart" role="img" aria-label="Gráfico de barras com denúncias por categoria"></canvas>
                </div>
            </section>

            {{-- Por região --}}
            <section class="card p-5" aria-labelledby="g-zona">
                <h3 id="g-zona" class="section-title">Distribuição por região</h3>
                <p class="text-[12.5px] text-ink-muted">Ocorrências resolvidas e pendentes por zona</p>
                <div class="relative mt-4 h-[260px]">
                    <canvas x-ref="zoneChart" role="img" aria-label="Gráfico de barras empilhadas por região"></canvas>
                </div>
            </section>
        </div>

        {{-- Mapa de calor --}}
        <section class="card overflow-hidden" aria-labelledby="g-calor">
            <div class="flex flex-wrap items-end justify-between gap-3 p-5">
                <div>
                    <h3 id="g-calor" class="section-title">Mapa de calor das ocorrências</h3>
                    <p class="text-[12.5px] text-ink-muted">Concentração de denúncias, ponderada pela gravidade</p>
                </div>
                <div class="flex items-center gap-2 text-[12px] text-ink-muted">
                    <span>Menor</span>
                    <span class="h-2 w-28 rounded-full" style="background: linear-gradient(90deg, #BBF7D0, #FDE047, #F97316, #DC2626)"></span>
                    <span>Maior</span>
                </div>
            </div>
            <div x-ref="heatmap" class="h-[420px] w-full"></div>
        </section>

        {{-- Ranking de regiões --}}
        <section class="card" aria-labelledby="t-zonas">
            <div class="px-5 pb-2 pt-4">
                <h3 id="t-zonas" class="section-title">Regiões em destaque</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full min-w-[520px] text-left text-[13px]">
                    <thead class="text-[11.5px] uppercase tracking-wider text-ink-muted">
                        <tr class="border-b border-slate-100">
                            <th scope="col" class="px-5 py-2.5 font-semibold">Região</th>
                            <th scope="col" class="px-5 py-2.5 text-right font-semibold">Denúncias</th>
                            <th scope="col" class="px-5 py-2.5 text-right font-semibold">Resolvidas</th>
                            <th scope="col" class="w-1/3 px-5 py-2.5 font-semibold">Taxa de resolução</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <template x-for="z in zones" :key="z.zone">
                            <tr>
                                <td class="px-5 py-3 font-semibold text-ink" x-text="z.zone"></td>
                                <td class="px-5 py-3 text-right tabular" x-text="z.total"></td>
                                <td class="px-5 py-3 text-right tabular" x-text="z.resolved"></td>
                                <td class="px-5 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div class="h-full rounded-full bg-eco-600" :style="`width:${z.total ? (z.resolved / z.total) * 100 : 0}%`"></div>
                                        </div>
                                        <span class="w-10 text-right text-[12px] font-semibold tabular" x-text="`${z.total ? Math.round((z.resolved / z.total) * 100) : 0}%`"></span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</x-eco.layout>
