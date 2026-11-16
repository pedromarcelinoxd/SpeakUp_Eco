<x-eco.layout title="Detalhes da ocorrência" :back="route('eco.reports.index')">
    <div x-data="reportDetail(@js($id))">

        {{-- Carregando --}}
        <div x-show="!$store.eco.ready && !r" class="grid gap-6 lg:grid-cols-3">
            <div class="space-y-4 lg:col-span-2">
                <div class="skeleton aspect-[16/8] w-full rounded-2xl"></div>
                <div class="skeleton h-6 w-2/3"></div>
                <div class="skeleton h-4 w-full"></div>
            </div>
            <div class="skeleton h-80 rounded-2xl"></div>
        </div>

        {{-- Não encontrada --}}
        <div x-cloak x-show="notFound" class="card">
            <x-eco.empty-state icon="circle-help" title="Ocorrência não encontrada" text="Ela pode ter sido removida, ou os dados demonstrativos estão desativados nas configurações.">
                <a href="{{ route('eco.reports.index') }}" class="btn-secondary mt-5">Voltar para denúncias</a>
            </x-eco.empty-state>
        </div>

        <template x-if="r">
            <div class="grid gap-6 lg:grid-cols-3">
                {{-- Coluna principal --}}
                <article class="space-y-6 lg:col-span-2">
                    <div class="card overflow-hidden">
                        <div class="relative">
                            <img :src="r.photos.length ? r.photos[photoIndex] : $u.photo(r)" :alt="$u.hasRealPhoto(r) ? `Foto: ${r.title}` : 'Imagem ilustrativa da categoria'"
                                 class="aspect-[16/9] w-full object-cover sm:aspect-[16/8]">
                            <span x-show="!$u.hasRealPhoto(r)" class="badge absolute bottom-3 left-3 bg-black/45 text-white backdrop-blur">Sem fotografia real · imagem ilustrativa</span>
                        </div>
                        <div x-show="r.photos.length > 1" class="flex gap-2 overflow-x-auto p-3">
                            <template x-for="(ph, i) in r.photos" :key="i">
                                <button type="button" @click="photoIndex = i" class="h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition" :class="photoIndex === i ? 'ring-eco-600' : 'ring-transparent opacity-70 hover:opacity-100'" :aria-label="`Foto ${i + 1}`">
                                    <img :src="ph" alt="" class="h-full w-full object-cover">
                                </button>
                            </template>
                        </div>

                        <div class="space-y-4 p-5 sm:p-6">
                            <div class="flex flex-wrap items-center gap-1.5">
                                <x-eco.category-pill />
                                <x-eco.status-badge />
                                <x-eco.source-badge />
                                <span x-show="r.origin === 'app'" class="badge bg-ink text-white"><x-eco.icon name="monitor-smartphone" class="h-3 w-3" />Enviada pelo app</span>
                                <span class="badge bg-slate-100 text-slate-600" x-text="`Gravidade ${$u.severity(r.severity).label.toLowerCase()}`"></span>
                            </div>
                            <h2 class="font-display text-2xl font-extrabold leading-tight tracking-tight text-ink" x-text="r.title"></h2>
                            <p class="text-[15px] leading-relaxed text-slate-600" x-text="r.description"></p>

                            <dl class="grid gap-4 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-3">
                                <div class="flex gap-2.5">
                                    <x-eco.icon name="calendar" class="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt class="text-ink-muted">Registrada em</dt>
                                        <dd class="font-semibold text-ink" x-text="$u.formatDateTime(r.createdAt)"></dd>
                                    </div>
                                </div>
                                <div class="flex gap-2.5">
                                    <x-eco.icon name="user" class="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt class="text-ink-muted">Registrada por</dt>
                                        <dd class="font-semibold text-ink" x-text="r.author"></dd>
                                    </div>
                                </div>
                                <div class="flex gap-2.5">
                                    <x-eco.icon name="users" class="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <dt class="text-ink-muted">Confirmações</dt>
                                        <dd class="font-semibold text-ink" x-text="`${confirmations} ${confirmations === 1 ? 'morador' : 'moradores'}`"></dd>
                                    </div>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {{-- Linha do tempo --}}
                    <section class="card p-5 sm:p-6" aria-labelledby="timeline">
                        <h3 id="timeline" class="section-title">Acompanhamento</h3>
                        <ol class="mt-5">
                            <template x-for="(step, i) in timeline" :key="step.status">
                                <li class="relative flex gap-4 pb-6 last:pb-0">
                                    <span x-show="i < timeline.length - 1" class="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5"
                                          :class="timeline[i + 1]?.done ? 'bg-eco-200' : 'bg-slate-200'"></span>
                                    <span class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                                          :style="step.done ? $u.tint($u.status(step.status).color, .14) : ''"
                                          :class="!step.done && 'border-2 border-dashed border-slate-200 text-slate-300'">
                                        <span x-icon="$u.status(step.status).icon" class="er-icon h-4 w-4"></span>
                                    </span>
                                    <div class="min-w-0 pt-1">
                                        <p class="text-[14px] font-semibold" :class="step.done ? 'text-ink' : 'text-slate-400'" x-text="$u.status(step.status).label"></p>
                                        <p x-show="step.done" class="text-[13px] text-ink-muted" x-text="step.note"></p>
                                        <p x-show="step.done && step.date" class="mt-0.5 text-[12px] text-slate-400" x-text="step.date && $u.formatDateTime(step.date)"></p>
                                        <p x-show="!step.done" class="text-[12.5px] text-slate-400">Etapa pendente</p>
                                    </div>
                                </li>
                            </template>
                        </ol>
                    </section>
                </article>

                {{-- Lateral --}}
                <aside class="space-y-6">
                    <section class="card overflow-hidden" aria-labelledby="local">
                        <div x-data="miniMap({ mode: 'single', coords: r.coords, kind: 'report', item: r })" class="h-56">
                            <div x-ref="map" class="h-full w-full"></div>
                        </div>
                        <div class="space-y-3 p-5">
                            <h3 id="local" class="section-title">Localização</h3>
                            <p class="text-[13.5px] text-ink" x-text="r.address"></p>
                            <p x-show="r.approximate" class="text-[12px] text-ink-muted">Posição aproximada a partir do ponto de referência informado.</p>
                            <p class="font-mono text-[12px] text-slate-400" x-text="`${r.coords[0].toFixed(5)}, ${r.coords[1].toFixed(5)}`"></p>
                            <div class="flex gap-2 pt-1">
                                <a :href="$u.route('map', { foco: r.id })" class="btn-secondary btn-sm flex-1"><x-eco.icon name="map" class="h-3.5 w-3.5" />Ver no mapa</a>
                                <a :href="$u.directionsUrl(r.coords)" target="_blank" rel="noopener" class="btn-secondary btn-sm flex-1"><x-eco.icon name="navigation" class="h-3.5 w-3.5" />Como chegar</a>
                            </div>
                        </div>
                    </section>

                    {{-- Moderação: somente administradores (regra aplicada também na API) --}}
                    <section x-show="canModerate" class="card space-y-3 border-indigo-200 p-5" aria-labelledby="moderacao">
                        <div class="flex items-center gap-2">
                            <span class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><x-eco.icon name="shield-check" class="h-4 w-4" /></span>
                            <h3 id="moderacao" class="section-title">Moderação</h3>
                        </div>
                        <p class="text-[12.5px] text-ink-muted">O autor recebe a atualização no app (push) e no painel.</p>
                        <label for="mod-status" class="sr-only">Novo status</label>
                        <select id="mod-status" x-model="newStatus" class="input" x-init="$watch('r.status', v => newStatus = v); newStatus = r.status">
                            <template x-for="[key, s] in Object.entries(statusList)" :key="key">
                                <option :value="key" x-text="s.label" :selected="newStatus === key"></option>
                            </template>
                        </select>
                        <label for="mod-note" class="sr-only">Observação</label>
                        <textarea id="mod-note" x-model="note" rows="2" maxlength="500" class="input" placeholder="Observação para o histórico (opcional)"></textarea>
                        <button type="button" class="btn-dark w-full" :disabled="saving || newStatus === r.status" @click="saveStatus()">
                            <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="saving" />
                            Salvar status
                        </button>
                    </section>

                    <section class="card space-y-3 p-5" aria-labelledby="acoes">
                        <h3 id="acoes" class="section-title">Você também viu este problema?</h3>
                        <p class="text-[13px] leading-relaxed text-ink-muted">Confirmar ajuda a equipe a priorizar ocorrências reais. Os pontos só contam após a verificação.</p>
                        <button type="button" class="btn-primary w-full" :disabled="!canConfirm" @click="$store.eco.confirmReport(r.id)">
                            <x-eco.icon name="thumbs-up" class="h-4 w-4" />
                            <span x-text="$store.eco.isConfirmed(r.id) ? 'Você confirmou esta ocorrência' : (canConfirm ? 'Confirmar ocorrência' : 'Confirmação encerrada')"></span>
                        </button>
                        <button type="button" class="btn-secondary w-full" @click="share()">
                            <x-eco.icon name="share" class="h-4 w-4" />
                            Compartilhar
                        </button>
                        <button type="button" x-show="canDelete" class="btn-ghost w-full text-red-600 hover:bg-red-50 hover:text-red-700" @click="confirmDelete = true">
                            <x-eco.icon name="trash" class="h-4 w-4" />
                            Excluir denúncia
                        </button>
                    </section>

                    <section x-show="related.length" class="card p-5" aria-labelledby="rel">
                        <h3 id="rel" class="section-title">Ocorrências relacionadas</h3>
                        <ul class="mt-3 space-y-1">
                            <template x-for="x in related" :key="x.id">
                                <li>
                                    <a :href="$u.route('report', x.id)" class="-mx-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                                        <img :src="$u.photo(x)" alt="" class="h-11 w-14 shrink-0 rounded-lg object-cover">
                                        <span class="min-w-0">
                                            <span class="block truncate text-[13px] font-semibold text-ink" x-text="x.title"></span>
                                            <span class="block text-[12px] text-ink-muted" x-text="`${x.neighborhood} · ${$u.timeAgo(x.createdAt)}`"></span>
                                        </span>
                                    </a>
                                </li>
                            </template>
                        </ul>
                    </section>
                </aside>
            </div>
        </template>

        <x-eco.sheet show="confirmDelete" title="Excluir esta denúncia?" max-width="sm:max-w-md">
            <p class="text-[14px] leading-relaxed text-ink-muted">A denúncia e suas fotos serão removidas do servidor, do app e do painel. Essa ação não pode ser desfeita.</p>
            <div class="mt-6 flex justify-end gap-2">
                <button type="button" class="btn-ghost" @click="confirmDelete = false">Cancelar</button>
                <button type="button" class="btn-danger" @click="remove()">Excluir</button>
            </div>
        </x-eco.sheet>
    </div>
</x-eco.layout>
