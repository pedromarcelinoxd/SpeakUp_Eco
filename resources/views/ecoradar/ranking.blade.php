<x-eco.layout title="Ranking" subtitle="Quem mais contribui com a cidade">
    <div x-data="rankingPage" class="space-y-6">
        <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 class="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">Guardiões da cidade</h2>
                <p class="mt-1 text-[14.5px] text-ink-muted">Cidadãos que mais ajudaram a identificar e resolver problemas ambientais.</p>
            </div>
            <div class="flex rounded-xl bg-slate-200/60 p-1" role="tablist" aria-label="Período">
                @foreach (['weekly' => 'Semanal', 'monthly' => 'Mensal', 'total' => 'Geral'] as $k => $l)
                    <button type="button" role="tab" @click="period = '{{ $k }}'" :aria-selected="period === '{{ $k }}'"
                            class="rounded-lg px-4 py-1.5 text-[13px] font-semibold transition"
                            :class="period === '{{ $k }}' ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'">{{ $l }}</button>
                @endforeach
            </div>
        </section>

        <template x-if="!$store.eco.isAuthenticated">
            <div class="flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[13px] text-ink">
                <x-eco.icon name="info" class="mt-px h-4 w-4 shrink-0 text-eco-700" />
                <p>Ranking real, calculado pelo servidor. <a href="{{ route('eco.login') }}" class="font-semibold text-eco-700 underline underline-offset-2">Entre na sua conta</a> para pontuar e aparecer aqui.</p>
            </div>
        </template>

        <div class="grid gap-6 lg:grid-cols-3">
            <div class="space-y-6 lg:col-span-2">
                {{-- Pódio --}}
                <section class="card overflow-hidden" aria-label="Três primeiros colocados">
                    <div class="relative bg-stone/50 px-4 pb-0 pt-8 sm:px-8">
                        <div class="grid grid-cols-3 items-end gap-2 sm:gap-5">
                            <template x-for="u in podium" :key="u.id">
                                <div class="flex flex-col items-center text-center">
                                    <div class="relative">
                                        <span x-show="u.position === 1" class="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500"><span x-icon="'crown'" class="er-icon h-6 w-6"></span></span>
                                        <x-eco.avatar name-expr="u.name" class="ring-4 ring-white" ::class="u.position === 1 ? 'h-20 w-20 text-xl' : 'h-16 w-16 text-lg'" />
                                        <span class="absolute -bottom-1 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full text-[11px] font-bold text-white ring-2 ring-white"
                                              :class="{ 'bg-amber-500': u.position === 1, 'bg-slate-400': u.position === 2, 'bg-orange-400': u.position === 3 }" x-text="u.position"></span>
                                    </div>
                                    <p class="mt-3 w-full truncate text-[13.5px] font-bold text-ink" x-text="u.me ? `${u.name} (você)` : u.name"></p>
                                    <p class="text-[12px] text-ink-muted" x-text="u.level.label"></p>
                                    <p class="mt-1 font-display text-[15px] font-extrabold text-eco-700 tabular" x-text="`${$u.formatNumber(u.score)} pts`"></p>
                                    <div class="mt-3 w-full rounded-t-2xl"
                                         :class="{ 'h-28 bg-eco-600': u.position === 1, 'h-20 bg-stone-dark': u.position === 2, 'h-14 bg-stone': u.position === 3 }"></div>
                                </div>
                            </template>
                        </div>
                    </div>
                </section>

                {{-- Lista --}}
                <section class="card" aria-label="Classificação">
                    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <h3 class="section-title">Classificação</h3>
                        <span class="text-[12.5px] text-ink-muted" x-text="`Pontos ${periodLabel}`"></span>
                    </div>
                    <ol class="divide-y divide-slate-100">
                        <template x-for="u in rest" :key="u.id">
                            <li class="flex items-center gap-3 px-5 py-3 transition" :class="u.me ? 'bg-eco-50/70' : 'hover:bg-slate-50/70'">
                                <span class="w-6 text-center text-[13px] font-bold text-slate-400 tabular" x-text="u.position"></span>
                                <x-eco.avatar name-expr="u.name" class="h-10 w-10 text-[13px]" />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-[14px] font-semibold text-ink">
                                        <span x-text="u.name"></span>
                                        <span x-show="u.me" class="badge ml-1 bg-eco-600 text-white">Você</span>
                                    </p>
                                    <div class="mt-1 flex items-center gap-2">
                                        <span class="text-[12px] font-medium" :style="`color:${u.level.color}`" x-text="u.level.label"></span>
                                        <div class="hidden h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 sm:block">
                                            <div class="h-full rounded-full" :style="`width:${u.level.progress}%;background:${u.level.color}`"></div>
                                        </div>
                                    </div>
                                </div>
                                <span class="font-display text-[15px] font-extrabold text-ink tabular" x-text="$u.formatNumber(u.score)"></span>
                            </li>
                        </template>
                    </ol>
                </section>
            </div>

            <aside class="space-y-6">
                {{-- Sua posição --}}
                <section class="card overflow-hidden" x-show="me">
                    <div class="border-b border-line bg-eco-50 p-5 text-ink">
                        <p class="text-[12.5px] font-medium text-ink-muted">Sua posição <span x-text="periodLabel"></span></p>
                        <div class="mt-2 flex items-end gap-3">
                            <p class="font-display text-5xl font-extrabold leading-none text-eco-700 tabular" x-text="`${me?.position}º`"></p>
                            <p class="pb-1 text-[13px] text-ink-muted" x-text="`de ${list.length} participantes`"></p>
                        </div>
                        <p class="mt-3 font-display text-lg font-bold tabular" x-text="`${$u.formatNumber(me?.score)} pontos`"></p>
                    </div>
                    <div class="space-y-3 p-5">
                        <div class="flex items-center justify-between text-[13px]">
                            <span class="flex items-center gap-1.5 font-semibold" :style="`color:${$store.eco.level.color}`">
                                <span x-icon="$store.eco.level.icon" class="er-icon h-4 w-4"></span>
                                <span x-text="$store.eco.level.label"></span>
                            </span>
                            <span class="text-ink-muted tabular" x-text="`${$u.formatNumber($store.eco.user.points)} pts`"></span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full bg-eco-600 transition-all duration-700" :style="`width:${$store.eco.level.progress}%`"></div>
                        </div>
                        <p class="text-[12.5px] text-ink-muted" x-text="$store.eco.level.next ? `Faltam ${$store.eco.level.remaining} pontos para ${$store.eco.level.next.label}.` : 'Você alcançou o nível máximo!'"></p>
                    </div>
                </section>

                {{-- Níveis --}}
                <section class="card p-5">
                    <h3 class="section-title">Níveis</h3>
                    <ol class="mt-4 space-y-3">
                        <template x-for="(l, i) in $u.LEVELS" :key="l.key">
                            <li class="flex items-center gap-3">
                                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" :style="$store.eco.level.index >= i ? `background:${l.color};color:#fff` : 'background:#F1F5F9;color:#94A3B8'">
                                    <span x-icon="l.icon" class="er-icon h-5 w-5"></span>
                                </span>
                                <div class="flex-1">
                                    <p class="text-[13.5px] font-semibold" :class="$store.eco.level.index >= i ? 'text-ink' : 'text-slate-400'" x-text="`${i + 1}. ${l.label}`"></p>
                                    <p class="text-[12px] text-ink-muted" x-text="$u.LEVELS[i + 1] ? `${$u.formatNumber(l.min)} – ${$u.formatNumber($u.LEVELS[i + 1].min - 1)} pts` : `${$u.formatNumber(l.min)}+ pts`"></p>
                                </div>
                                <span x-show="$store.eco.level.index === i" class="badge bg-eco-100 text-eco-800">Atual</span>
                            </li>
                        </template>
                    </ol>
                </section>

                {{-- Pontuação --}}
                <section class="card p-5">
                    <h3 class="section-title">Como ganhar pontos</h3>
                    <ul class="mt-4 space-y-3">
                        <template x-for="rule in $u.SCORE_RULES" :key="rule.action">
                            <li class="flex items-start gap-3">
                                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink"><span x-icon="rule.icon" class="er-icon h-4 w-4"></span></span>
                                <div class="flex-1">
                                    <p class="text-[13.5px] font-medium text-ink" x-text="rule.action"></p>
                                    <p class="text-[12px] text-ink-muted" x-text="rule.note"></p>
                                </div>
                                <span class="font-display text-[15px] font-extrabold text-eco-700" x-text="`+${rule.points}`"></span>
                            </li>
                        </template>
                    </ul>
                    <div class="mt-4 flex gap-2.5 rounded-xl bg-slate-50 p-3 text-[12.5px] leading-relaxed text-ink-muted">
                        <x-eco.icon name="shield" class="mt-px h-4 w-4 shrink-0 text-slate-400" />
                        <p>Denúncias falsas ou duplicadas não geram pontos e podem levar à suspensão da conta.</p>
                    </div>
                </section>
            </aside>
        </div>
    </div>
</x-eco.layout>
