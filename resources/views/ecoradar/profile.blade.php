<x-eco.layout title="Meu perfil" subtitle="Suas informações e contribuições">
    <div x-data="profilePage" class="space-y-6">

        {{-- Cabeçalho do perfil --}}
        <section class="card overflow-hidden">
            <div class="h-28 bg-eco-100 sm:h-32"></div>
            <div class="px-5 pb-6 sm:px-7">
                <div class="-mt-12 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end">
                    <x-eco.avatar class="h-24 w-24 text-2xl ring-4 ring-white" />
                    <div class="min-w-0 flex-1 sm:pb-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="font-display text-2xl font-extrabold tracking-tight text-ink" x-text="$store.eco.user.fullName || $store.eco.user.name"></h2>
                            <span class="badge" :class="$store.eco.isAuthenticated ? 'bg-eco-50 text-eco-800' : 'bg-amber-50 text-amber-700'"
                                  x-text="$store.eco.isAuthenticated ? 'Conta verificada no servidor' : 'Visitante (sem conta)'"></span>
                        </div>
                        <p class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-ink-muted">
                            <span class="flex items-center gap-1.5"><x-eco.icon name="mail" class="h-3.5 w-3.5" /><span x-text="$store.eco.user.email"></span></span>
                            <span x-show="$store.eco.user.bairro" class="flex items-center gap-1.5"><x-eco.icon name="map-pin" class="h-3.5 w-3.5" /><span x-text="$store.eco.user.bairro"></span></span>
                        </p>
                    </div>
                    <div class="flex gap-2 sm:pb-1">
                        <button type="button" class="btn-secondary" @click="openEdit()">
                            <x-eco.icon name="pencil" class="h-4 w-4" />
                            Editar perfil
                        </button>
                    </div>
                </div>

                {{-- Nível --}}
                <div class="mt-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div class="flex items-center gap-3">
                        <span class="grid h-12 w-12 place-items-center rounded-xl text-white" :style="`background:${$store.eco.level.color}`">
                            <span x-icon="$store.eco.level.icon" class="er-icon h-6 w-6"></span>
                        </span>
                        <div>
                            <p class="text-[12px] text-ink-muted">Nível</p>
                            <p class="font-display text-[17px] font-bold text-ink" x-text="$store.eco.level.label"></p>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-baseline justify-between text-[13px]">
                            <span class="font-display text-[22px] font-extrabold text-ink tabular" x-text="`${$u.formatNumber($store.eco.user.points)} pts`"></span>
                            <span class="text-ink-muted" x-text="$store.eco.level.next ? `${$store.eco.level.remaining} pts para ${$store.eco.level.next.label}` : 'Nível máximo'"></span>
                        </div>
                        <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div class="h-full rounded-full bg-eco-600 transition-all duration-700" :style="`width:${$store.eco.level.progress}%`"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {{-- Estatísticas --}}
        <section class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Estatísticas">
            <x-eco.stat-card label="Denúncias enviadas" icon="send" color="#176B56" value="$store.eco.user.stats.sent" />
            <x-eco.stat-card label="Denúncias validadas" icon="badge-check" color="#16A34A" value="$store.eco.user.stats.validated" />
            <x-eco.stat-card label="Ocorrências confirmadas" icon="thumbs-up" color="#176B56" value="$store.eco.user.stats.confirmed + $store.eco.confirmed.length" />
            <x-eco.stat-card label="Pontos ambientais encontrados" icon="map-pinned" color="#176B56" value="$store.eco.user.stats.pointsFound" />
        </section>

        {{-- Minhas denúncias --}}
        <section class="card" aria-labelledby="minhas">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                <h3 id="minhas" class="section-title">Minhas denúncias</h3>
                <div class="flex rounded-xl bg-slate-100 p-0.5 text-[12.5px]" role="tablist">
                    @foreach (['todas' => 'Todas', 'abertas' => 'Em andamento', 'resolvidas' => 'Resolvidas'] as $k => $l)
                        <button type="button" role="tab" @click="tab = '{{ $k }}'" :aria-selected="tab === '{{ $k }}'"
                                class="rounded-lg px-3 py-1 font-semibold transition" :class="tab === '{{ $k }}' ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'">{{ $l }}</button>
                    @endforeach
                </div>
            </div>
            <ul class="divide-y divide-slate-100">
                <template x-for="r in reports" :key="r.id">
                    <li>
                        <a :href="$u.route('report', r.id)" class="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                            <img :src="$u.photo(r)" alt="" class="h-14 w-20 shrink-0 rounded-xl object-cover">
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-[14px] font-semibold text-ink" x-text="r.title"></p>
                                <p class="mt-0.5 truncate text-[12.5px] text-ink-muted" x-text="`${$u.reportCategory(r.category).label} · ${r.neighborhood} · ${$u.formatDate(r.createdAt)}`"></p>
                            </div>
                            <x-eco.status-badge class="hidden sm:inline-flex" />
                            <x-eco.icon name="chevron-right" class="h-4 w-4 text-slate-300" />
                        </a>
                    </li>
                </template>
                <li x-show="!reports.length">
                    <x-eco.empty-state icon="megaphone" title="Nenhuma denúncia aqui" text="Quando você registrar uma ocorrência, poderá acompanhar o andamento nesta lista.">
                        <a href="{{ route('eco.reports.create') }}" class="btn-secondary mt-5"><x-eco.icon name="plus" class="h-4 w-4" />Nova denúncia</a>
                    </x-eco.empty-state>
                </li>
            </ul>
        </section>

        {{-- Editar perfil --}}
        <x-eco.sheet show="editing" title="Editar perfil">
            <template x-if="!$store.eco.isAuthenticated">
                <div class="mb-4 flex gap-2.5 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900">
                    <x-eco.icon name="lock" class="mt-px h-4 w-4 shrink-0 text-amber-600" />
                    <p>Você está sem conta. <a href="{{ route('eco.login') }}" class="font-semibold underline">Entre ou crie uma conta</a> para ter um perfil.</p>
                </div>
            </template>
            <form class="space-y-4" @submit.prevent="save()" novalidate>
                <div class="flex items-center gap-4">
                    <span class="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                        <img x-show="photoPreview" :src="photoPreview" alt="" class="h-full w-full object-cover">
                        <x-eco.avatar x-show="!photoPreview" class="h-16 w-16 text-lg" />
                    </span>
                    <label class="btn-secondary btn-sm cursor-pointer">
                        <x-eco.icon name="camera" class="h-4 w-4" />
                        Alterar foto
                        <input type="file" accept="image/jpeg,image/png" class="sr-only" @change="pickPhoto($event.target.files[0])">
                    </label>
                </div>
                <div>
                    <label for="pf-name" class="label">Nome</label>
                    <input id="pf-name" type="text" x-model="form.name" class="input" autocomplete="name">
                </div>
                <div>
                    <label for="pf-email" class="label">E-mail</label>
                    <input id="pf-email" type="email" x-model="form.email" class="input" autocomplete="email">
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label for="pf-tel" class="label">Telefone <span class="font-normal text-ink-muted">(opcional)</span></label>
                        <input id="pf-tel" type="tel" x-model="form.telefone" maxlength="20" class="input" autocomplete="tel">
                    </div>
                    <div>
                        <label for="pf-bairro" class="label">Bairro <span class="font-normal text-ink-muted">(opcional)</span></label>
                        <input id="pf-bairro" type="text" x-model="form.bairro" class="input">
                    </div>
                </div>
                <p x-show="errors" class="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700" role="alert" x-text="errors"></p>
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="btn-ghost" @click="editing = false">Cancelar</button>
                    <button type="submit" class="btn-primary" :disabled="saving || !$store.eco.isAuthenticated">
                        <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="saving" />
                        Salvar alterações
                    </button>
                </div>
            </form>
        </x-eco.sheet>
    </div>
</x-eco.layout>
