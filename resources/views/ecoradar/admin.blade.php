<x-eco.layout title="Administração" subtitle="Área exclusiva da equipe do EcoRadar">
    <div x-data="adminPage" class="space-y-6">

        {{-- Carregando a sessão --}}
        <div x-show="!$store.eco.ready" class="card p-6 text-[14px] text-ink-muted">Verificando seu acesso…</div>

        {{-- Sem permissão: nada da administração é carregado --}}
        <section x-cloak x-show="$store.eco.ready && !allowed" class="card mx-auto max-w-lg p-6 text-center sm:p-8">
            <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-eco-100 text-eco-700"><x-eco.icon name="lock" class="h-6 w-6" /></span>
            <h2 class="mt-4 font-display text-xl font-bold text-ink">Acesso restrito à equipe</h2>
            <p class="mt-2 text-[14px] text-ink-muted">Esta área é só para administradores do EcoRadar. Se você faz parte da equipe, entre com a sua conta de administrador.</p>
            <a x-show="!$store.eco.isAuthenticated" href="{{ route('eco.login') }}" class="btn-primary mt-5"><x-eco.icon name="log-in" class="h-4 w-4" />Entrar</a>
        </section>

        <template x-if="$store.eco.ready && allowed">
            <div class="space-y-6">
                {{-- Abas --}}
                <nav class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Seções da administração">
                    @foreach ([
                        'geral' => ['Visão geral', 'layout-dashboard'],
                        'denuncias' => ['Denúncias', 'megaphone'],
                        'ecopontos' => ['Ecopontos', 'recycle'],
                        'usuarios' => ['Usuários', 'users'],
                        'categorias' => ['Categorias', 'palette'],
                    ] as $key => [$label, $icon])
                        <button type="button" role="tab" class="chip shrink-0" :class="tab === '{{ $key }}' && 'chip-active'"
                                :aria-selected="tab === '{{ $key }}'" @click="tab = '{{ $key }}'">
                            <x-eco.icon name="{{ $icon }}" class="h-4 w-4" />{{ $label }}
                        </button>
                    @endforeach
                </nav>

                <p x-show="error" class="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700" role="alert" x-text="error"></p>

                {{-- ================= Visão geral ================= --}}
                <section x-show="tab === 'geral'" class="space-y-6" aria-label="Visão geral">
                    <div x-show="loading && !resumo" class="card p-6 text-[14px] text-ink-muted">Carregando indicadores…</div>
                    <template x-if="resumo">
                        <div class="space-y-6">
                            <div class="grid grid-cols-2 gap-y-6 border-y border-line py-6 lg:grid-cols-4">
                                @foreach ([
                                    ['resumo.denuncias.aguardando_moderacao', 'Aguardando moderação', "denuncias', filters.status = 'aguardando'"],
                                    ['resumo.denuncias.novas_7_dias', 'Novas em 7 dias', null],
                                    ['resumo.denuncias.resolvidas_30_dias', 'Resolvidas em 30 dias', null],
                                    ['hours(resumo.denuncias.tempo_medio_solucao_horas)', 'Tempo médio até resolver', null],
                                ] as $i => [$expr, $label, $go])
                                    <div @class(['px-1 sm:px-5', 'border-l border-line' => $i % 2 === 1, 'lg:border-l lg:border-line' => $i === 2])>
                                        <p class="font-display text-[30px] font-extrabold leading-none text-ink tabular" x-text="{{ $expr }}"></p>
                                        <p class="mt-2 text-[13px] font-medium text-ink">{{ $label }}</p>
                                    </div>
                                @endforeach
                            </div>

                            <div class="grid gap-6 lg:grid-cols-2">
                                <section class="card p-5" aria-labelledby="adm-status">
                                    <h3 id="adm-status" class="section-title">Denúncias por situação</h3>
                                    <ul class="mt-4 space-y-3">
                                        <template x-for="row in statusRows()" :key="row.key">
                                            <li>
                                                <div class="flex items-center justify-between text-[13px]"><span class="text-ink" x-text="row.info.label"></span><span class="font-semibold tabular" x-text="row.count"></span></div>
                                                <div class="mt-1 h-2 overflow-hidden rounded-full bg-stone"><div class="h-full rounded-full" :style="`width:${row.pct}%;background:${row.info.color}`"></div></div>
                                            </li>
                                        </template>
                                    </ul>
                                </section>
                                <section class="card p-5" aria-labelledby="adm-cat">
                                    <h3 id="adm-cat" class="section-title">Denúncias por categoria</h3>
                                    <ul class="mt-4 space-y-3">
                                        <template x-for="row in categoryRows()" :key="row.key">
                                            <li>
                                                <div class="flex items-center justify-between text-[13px]"><span class="text-ink" x-text="row.info.label"></span><span class="font-semibold tabular" x-text="row.count"></span></div>
                                                <div class="mt-1 h-2 overflow-hidden rounded-full bg-stone"><div class="h-full rounded-full" :style="`width:${row.pct}%;background:${row.info.color}`"></div></div>
                                            </li>
                                        </template>
                                    </ul>
                                </section>
                            </div>

                            <div class="grid gap-6 lg:grid-cols-3">
                                <section class="card p-5">
                                    <h3 class="section-title">Comunidade</h3>
                                    <dl class="mt-3 divide-y divide-line text-[13.5px]">
                                        <div class="flex justify-between py-2"><dt>Contas</dt><dd class="font-semibold tabular" x-text="resumo.usuarios.total"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Novas contas (30 dias)</dt><dd class="font-semibold tabular" x-text="resumo.usuarios.novos_30_dias"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Administradores</dt><dd class="font-semibold tabular" x-text="resumo.usuarios.administradores"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Contas bloqueadas</dt><dd class="font-semibold tabular" x-text="resumo.usuarios.bloqueados"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Validações (7 dias)</dt><dd class="font-semibold tabular" x-text="resumo.validacoes_7_dias"></dd></div>
                                    </dl>
                                </section>
                                <section class="card p-5">
                                    <h3 class="section-title">Conteúdo</h3>
                                    <dl class="mt-3 divide-y divide-line text-[13.5px]">
                                        <div class="flex justify-between py-2"><dt>Denúncias no mapa</dt><dd class="font-semibold tabular" x-text="resumo.denuncias.total"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Enviadas sem conta</dt><dd class="font-semibold tabular" x-text="resumo.denuncias.sem_conta"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Ocultadas pela moderação</dt><dd class="font-semibold tabular" x-text="resumo.denuncias.ocultas"></dd></div>
                                        <div class="flex justify-between py-2"><dt>Pontos de descarte</dt><dd class="font-semibold tabular" x-text="resumo.ecopontos"></dd></div>
                                    </dl>
                                </section>
                                <section class="card p-5">
                                    <h3 class="section-title">Regras em vigor</h3>
                                    <dl class="mt-3 divide-y divide-line text-[13.5px]">
                                        <div class="flex justify-between gap-3 py-2"><dt>Confirmações para “Confirmada”</dt><dd class="font-semibold tabular" x-text="resumo.regras.validacao.confirmar_minimo"></dd></div>
                                        <div class="flex justify-between gap-3 py-2"><dt>Avisos para “Possivelmente resolvida”</dt><dd class="font-semibold tabular" x-text="resumo.regras.validacao.possivel_resolucao_minimo"></dd></div>
                                        <div class="flex justify-between gap-3 py-2"><dt>Avisos para “Resolvida”</dt><dd class="font-semibold tabular" x-text="resumo.regras.validacao.resolver_minimo"></dd></div>
                                        <div class="flex justify-between gap-3 py-2"><dt>Denúncias por hora (pessoa)</dt><dd class="font-semibold tabular" x-text="resumo.regras.limites.denuncias_por_hora"></dd></div>
                                        <div class="flex justify-between gap-3 py-2"><dt>Raio de duplicata</dt><dd class="font-semibold tabular" x-text="`${resumo.regras.limites.duplicata_raio_metros} m`"></dd></div>
                                    </dl>
                                    <p class="mt-3 text-[12px] text-ink-muted">Definidas nas variáveis de ambiente do servidor (ECORADAR_*).</p>
                                </section>
                            </div>
                        </div>
                    </template>
                </section>

                {{-- ================= Denúncias ================= --}}
                <section x-show="tab === 'denuncias'" class="space-y-4" aria-label="Moderação de denúncias">
                    <div class="card flex flex-col gap-2 p-3 lg:flex-row">
                        <label class="relative flex-1">
                            <span class="sr-only">Buscar</span>
                            <x-eco.icon name="search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                            <input type="search" x-model="filters.busca" placeholder="Buscar por título, descrição ou endereço" class="input pl-10">
                        </label>
                        <label class="sr-only" for="adm-f-status">Situação</label>
                        <select id="adm-f-status" x-model="filters.status" class="input lg:w-56">
                            <option value="aguardando">Aguardando moderação</option>
                            <option value="">Todas</option>
                            <template x-for="k in statusOptions" :key="k"><option :value="k" x-text="statusInfo(k).label"></option></template>
                            <option value="ocultas">Ocultadas</option>
                        </select>
                        <label class="sr-only" for="adm-f-cat">Categoria</label>
                        <select id="adm-f-cat" x-model="filters.categoria" class="input lg:w-52">
                            <option value="">Todas as categorias</option>
                            <template x-for="[k, c] in Object.entries(reportCategories)" :key="k"><option :value="k" x-text="c.label"></option></template>
                        </select>
                    </div>

                    <p class="text-[13px] text-ink-muted"><span class="font-semibold text-ink tabular" x-text="reports.length"></span> denúncias <span x-show="loading">· carregando…</span></p>

                    <ul class="card divide-y divide-line">
                        <template x-for="r in reports" :key="r.id">
                            <li>
                                <button type="button" class="flex w-full items-center gap-3 p-3 text-left transition hover:bg-stone/50 sm:p-4" @click="openReport(r)">
                                    <img :src="r.foto_url" alt="" class="h-14 w-16 shrink-0 rounded-xl bg-stone object-cover">
                                    <span class="min-w-0 flex-1">
                                        <span class="flex flex-wrap items-center gap-1.5">
                                            <span class="badge" :style="`background:${categoryInfo(r.categoria).color}1A;color:${categoryInfo(r.categoria).color}`" x-text="categoryInfo(r.categoria).label"></span>
                                            <span class="badge" :class="`${statusInfo(r.status).bg} ${statusInfo(r.status).text}`" x-text="statusInfo(r.status).label"></span>
                                            <span x-show="r.oculta" class="badge bg-red-50 text-red-700">Ocultada</span>
                                            <span x-show="r.criticidade === 'alta'" class="badge bg-red-50 text-red-700">Urgente</span>
                                        </span>
                                        <span class="mt-1 block truncate text-[14px] font-semibold text-ink" x-text="`#${r.id} · ${r.titulo || 'Denúncia'}`"></span>
                                        <span class="block truncate text-[12.5px] text-ink-muted"
                                              x-text="`${r.autor ? r.autor.nome : 'Sem conta'} · ${$u.formatDateTime(r.created_at)} · ${r.votos.existe} confirmações · ${r.votos.resolvida} avisos de resolução`"></span>
                                    </span>
                                    <x-eco.icon name="chevron-right" class="h-4 w-4 shrink-0 text-ink-muted" />
                                </button>
                            </li>
                        </template>
                        <li x-show="!loading && !reports.length" class="p-6 text-center text-[14px] text-ink-muted">Nenhuma denúncia neste filtro.</li>
                    </ul>
                </section>

                {{-- ================= Ecopontos ================= --}}
                <section x-show="tab === 'ecopontos'" class="space-y-4" aria-label="Pontos de descarte">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <p class="text-[13px] text-ink-muted"><span class="font-semibold text-ink tabular" x-text="points.length"></span> pontos de descarte</p>
                        <button type="button" class="btn-primary" @click="editPoint()"><x-eco.icon name="plus" class="h-4 w-4" />Novo ponto de descarte</button>
                    </div>
                    <ul class="card divide-y divide-line">
                        <template x-for="p in points" :key="p.id">
                            <li class="flex items-center gap-3 p-3 sm:p-4">
                                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-eco-600 text-white"><span x-icon="(pointCategories[p.categoria] || pointCategories.outros).icon" class="er-icon h-5 w-5"></span></span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[14px] font-semibold text-ink" x-text="p.nome"></span>
                                    <span class="block truncate text-[12.5px] text-ink-muted" x-text="`${(pointCategories[p.categoria] || pointCategories.outros).label} · ${p.endereco || 'sem endereço'} · ${(p.residuos_aceitos || []).join(', ')}`"></span>
                                </span>
                                <button type="button" class="btn-secondary btn-sm" @click="editPoint(p)"><x-eco.icon name="pencil" class="h-3.5 w-3.5" />Editar</button>
                                <button type="button" class="icon-btn text-red-600 hover:bg-red-50" @click="deletePoint(p)" :aria-label="`Remover ${p.nome}`"><x-eco.icon name="trash" class="h-4 w-4" /></button>
                            </li>
                        </template>
                        <li x-show="!loading && !points.length" class="p-6 text-center text-[14px] text-ink-muted">Nenhum ponto cadastrado.</li>
                    </ul>
                </section>

                {{-- ================= Usuários ================= --}}
                <section x-show="tab === 'usuarios'" class="space-y-4" aria-label="Usuários">
                    <label class="relative block">
                        <span class="sr-only">Buscar usuário</span>
                        <x-eco.icon name="search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                        <input type="search" x-model="userSearch" placeholder="Buscar por nome ou e-mail" class="input pl-10">
                    </label>
                    <ul class="card divide-y divide-line">
                        <template x-for="u in users" :key="u.id">
                            <li class="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-eco-100 text-[13px] font-bold text-eco-700" x-text="$u.initials(u.nome)"></span>
                                <span class="min-w-0 flex-1">
                                    <span class="flex flex-wrap items-center gap-1.5">
                                        <span class="truncate text-[14px] font-semibold text-ink" x-text="u.nome"></span>
                                        <span x-show="u.is_admin" class="badge bg-eco-100 text-eco-800">Administrador</span>
                                        <span x-show="u.bloqueado" class="badge bg-red-50 text-red-700">Bloqueado</span>
                                        <span x-show="isMe(u)" class="badge bg-stone text-ink">Você</span>
                                    </span>
                                    <span class="block truncate text-[12.5px] text-ink-muted" x-text="`${u.email} · ${u.denuncias} denúncias · ${u.validacoes} validações`"></span>
                                    <span x-show="u.bloqueado" class="block truncate text-[12px] text-red-700" x-text="u.bloqueado && `Motivo: ${u.bloqueado.motivo}`"></span>
                                </span>
                                <div x-show="!isMe(u)" class="flex gap-2">
                                    <button type="button" class="btn-secondary btn-sm" x-show="!u.bloqueado" @click="toggleAdmin(u)">
                                        <x-eco.icon name="shield-check" class="h-3.5 w-3.5" /><span x-text="u.is_admin ? 'Remover admin' : 'Tornar admin'"></span>
                                    </button>
                                    <button type="button" class="btn-secondary btn-sm text-red-600" x-show="!u.bloqueado" @click="askBlock(u)"><x-eco.icon name="ban" class="h-3.5 w-3.5" />Bloquear</button>
                                    <button type="button" class="btn-secondary btn-sm" x-show="u.bloqueado" @click="unblock(u)"><x-eco.icon name="user-check" class="h-3.5 w-3.5" />Desbloquear</button>
                                </div>
                            </li>
                        </template>
                        <li x-show="!loading && !users.length" class="p-6 text-center text-[14px] text-ink-muted">Nenhum usuário encontrado.</li>
                    </ul>
                </section>

                {{-- ================= Categorias ================= --}}
                <section x-show="tab === 'categorias'" class="space-y-4" aria-label="Categorias de ocorrência">
                    <p class="text-[13px] text-ink-muted">Nome e cor aparecem no mapa, na legenda e nos formulários. Categorias desativadas deixam de aceitar novas denúncias; as antigas continuam visíveis.</p>
                    <ul class="card divide-y divide-line">
                        <template x-for="c in categories" :key="c.id">
                            <li class="flex items-center gap-3 p-3 sm:p-4">
                                <span class="h-9 w-9 shrink-0 rounded-xl" :style="`background:${c.cor}`"></span>
                                <span class="min-w-0 flex-1">
                                    <span class="flex flex-wrap items-center gap-1.5">
                                        <span class="truncate text-[14px] font-semibold text-ink" x-text="c.nome"></span>
                                        <span class="badge" :class="c.ativo ? 'bg-green-50 text-green-800' : 'bg-stone text-ink-muted'" x-text="c.ativo ? 'Ativa' : 'Desativada'"></span>
                                    </span>
                                    <span class="block truncate text-[12.5px] text-ink-muted" x-text="`${c.cor} · ${c.denuncias} denúncias · ${c.descricao || ''}`"></span>
                                </span>
                                <button type="button" class="btn-secondary btn-sm" @click="editCategory(c)"><x-eco.icon name="pencil" class="h-3.5 w-3.5" />Editar</button>
                            </li>
                        </template>
                    </ul>
                </section>
            </div>
        </template>

        {{-- -------- Detalhe e moderação de uma denúncia -------- --}}
        <x-eco.sheet show="detailOpen" title="Moderar denúncia" max-width="sm:max-w-2xl">
            <template x-if="selected">
                <div class="space-y-5">
                    <div class="flex gap-4">
                        <img :src="selected.foto_url" alt="" class="h-24 w-32 shrink-0 rounded-xl bg-stone object-cover">
                        <div class="min-w-0">
                            <p class="text-[12.5px] text-ink-muted" x-text="`#${selected.id} · ${categoryInfo(selected.categoria).label} · ${$u.formatDateTime(selected.created_at)}`"></p>
                            <p class="mt-1 font-semibold text-ink" x-text="selected.titulo"></p>
                            <p class="mt-1 text-[13px] text-ink-muted" x-text="selected.descricao || 'Sem descrição.'"></p>
                            <p class="mt-1 text-[12.5px] text-ink-muted" x-text="selected.endereco"></p>
                            <p class="mt-1 text-[12.5px] text-ink-muted" x-text="selected.autor ? `Autor: ${selected.autor.nome} (${selected.autor.email})` : 'Enviada sem conta (dispositivo anônimo)'"></p>
                            <a :href="$u.route('report', `api-${selected.id}`)" class="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-eco-700 hover:underline">Abrir página pública <x-eco.icon name="arrow-up-right" class="h-3.5 w-3.5" /></a>
                        </div>
                    </div>

                    <section class="rounded-2xl border border-line p-4">
                        <h3 class="text-[13.5px] font-semibold text-ink">Status oficial da equipe</h3>
                        <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                            <label class="sr-only" for="adm-status-sel">Novo status</label>
                            <select id="adm-status-sel" x-model="newStatus" class="input">
                                <template x-for="k in statusOptions" :key="k"><option :value="k" x-text="statusInfo(k).label" :selected="newStatus === k"></option></template>
                            </select>
                            <button type="button" class="btn-primary" :disabled="busy === 'status' || newStatus === selected.status" @click="saveStatus()">
                                <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="busy === 'status'" />Salvar status
                            </button>
                        </div>
                        <label class="sr-only" for="adm-note">Observação</label>
                        <textarea id="adm-note" x-model="note" rows="2" maxlength="500" class="input mt-2" placeholder="Observação para o histórico (opcional). Quem denunciou vê este texto."></textarea>
                    </section>

                    <section class="rounded-2xl border border-line p-4">
                        <h3 class="text-[13.5px] font-semibold text-ink">Validações da comunidade</h3>
                        <p class="mt-1 text-[12.5px] text-ink-muted" x-text="`${selected.votos.existe} confirmaram que existe · ${selected.votos.resolvida} informaram resolução`"></p>
                        <ul class="mt-2 max-h-40 divide-y divide-line overflow-y-auto text-[12.5px]">
                            <template x-for="(v, i) in votes" :key="i">
                                <li class="flex justify-between gap-3 py-1.5">
                                    <span class="truncate" x-text="v.quem"></span>
                                    <span class="shrink-0 text-ink-muted" x-text="`${v.tipo === 'existe' ? 'Existe' : 'Resolvida'} · ${$u.formatDateTime(v.data)}`"></span>
                                </li>
                            </template>
                            <li x-show="!votes.length" class="py-1.5 text-ink-muted">Nenhuma validação ainda.</li>
                        </ul>
                    </section>

                    <section class="rounded-2xl border border-line p-4">
                        <h3 class="text-[13.5px] font-semibold text-ink">Moderação de conteúdo</h3>
                        <template x-if="!selected.oculta">
                            <div class="mt-2 space-y-2">
                                <p class="text-[12.5px] text-ink-muted">Ocultar tira a denúncia do mapa e das listas públicas sem apagá-la (ex.: foto com rosto ou placa, conteúdo ofensivo, spam).</p>
                                <input type="text" x-model="hideReason" maxlength="255" class="input" placeholder="Motivo da ocultação">
                                <button type="button" class="btn-secondary w-full sm:w-auto" :disabled="busy === 'hide'" @click="toggleHidden()"><x-eco.icon name="eye-off" class="h-4 w-4" />Ocultar do mapa</button>
                            </div>
                        </template>
                        <template x-if="selected.oculta">
                            <div class="mt-2 space-y-2">
                                <p class="text-[12.5px] text-red-700" x-text="`Ocultada por ${selected.oculta.por || 'equipe'} em ${$u.formatDateTime(selected.oculta.em)}. Motivo: ${selected.oculta.motivo}`"></p>
                                <button type="button" class="btn-secondary w-full sm:w-auto" :disabled="busy === 'hide'" @click="toggleHidden()"><x-eco.icon name="eye" class="h-4 w-4" />Exibir novamente</button>
                            </div>
                        </template>
                        <button type="button" class="btn-ghost mt-3 w-full text-red-600 hover:bg-red-50 sm:w-auto" @click="confirmDelete = true"><x-eco.icon name="trash" class="h-4 w-4" />Excluir definitivamente</button>
                    </section>
                </div>
            </template>
        </x-eco.sheet>

        <x-eco.sheet show="confirmDelete" title="Excluir esta denúncia?" max-width="sm:max-w-md">
            <p class="text-[14px] leading-relaxed text-ink-muted">A denúncia, as fotos, os votos e o histórico serão apagados do servidor, do app e do painel. Não é possível desfazer. Para só tirar do mapa, use “Ocultar”.</p>
            <div class="mt-6 flex justify-end gap-2">
                <button type="button" class="btn-ghost" @click="confirmDelete = false">Cancelar</button>
                <button type="button" class="btn-danger" :disabled="busy === 'delete'" @click="deleteReport()">Excluir</button>
            </div>
        </x-eco.sheet>

        {{-- -------- Ponto de descarte -------- --}}
        <x-eco.sheet show="pointOpen" title="Ponto de descarte" max-width="sm:max-w-2xl">
            <form class="space-y-4" @submit.prevent="savePoint()" novalidate>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label for="pt-nome" class="label">Nome</label>
                        <input id="pt-nome" type="text" x-model="pointForm.nome" maxlength="255" class="input" :class="pointErrors.nome && 'input-error'">
                        <p x-show="pointErrors.nome" class="mt-1 text-[12px] text-red-700" x-text="pointErrors.nome"></p>
                    </div>
                    <div>
                        <label for="pt-cat" class="label">Categoria</label>
                        <select id="pt-cat" x-model="pointForm.categoria" class="input">
                            <template x-for="[k, c] in Object.entries(pointCategories)" :key="k"><option :value="k" x-text="c.label" :selected="pointForm.categoria === k"></option></template>
                        </select>
                    </div>
                    <div>
                        <label for="pt-end" class="label">Endereço</label>
                        <input id="pt-end" type="text" x-model="pointForm.endereco" maxlength="255" class="input">
                    </div>
                    <div>
                        <label for="pt-hor" class="label">Horário de funcionamento</label>
                        <input id="pt-hor" type="text" x-model="pointForm.horario" maxlength="120" class="input" placeholder="Ex.: Seg a Sáb · 8h às 17h">
                    </div>
                </div>
                <div>
                    <label for="pt-mat" class="label">Materiais recebidos <span class="font-normal text-ink-muted">(separados por vírgula)</span></label>
                    <input id="pt-mat" type="text" x-model="pointForm.materiais" class="input" :class="pointErrors.materiais && 'input-error'" placeholder="Pilhas, Baterias, Celulares">
                    <p x-show="pointErrors.materiais" class="mt-1 text-[12px] text-red-700" x-text="pointErrors.materiais"></p>
                </div>
                <div>
                    <label for="pt-desc" class="label">Informações adicionais</label>
                    <textarea id="pt-desc" x-model="pointForm.descricao_local" rows="2" maxlength="500" class="input"></textarea>
                </div>
                <div>
                    <p class="label">Posição no mapa</p>
                    <div x-ref="pointMap" class="h-56 overflow-hidden rounded-2xl border border-line"></div>
                    <p class="mt-1 text-[12px]" :class="pointErrors.local ? 'text-red-700' : 'text-ink-muted'"
                       x-text="pointErrors.local || (pointForm.latitude !== '' ? `${pointForm.latitude}, ${pointForm.longitude} · arraste o marcador para ajustar` : 'Clique no mapa para marcar o ponto.')"></p>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="btn-ghost" @click="pointOpen = false">Cancelar</button>
                    <button type="submit" class="btn-primary" :disabled="busy === 'point'"><x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="busy === 'point'" />Salvar</button>
                </div>
            </form>
        </x-eco.sheet>

        {{-- -------- Bloquear conta -------- --}}
        <x-eco.sheet show="blockOpen" title="Bloquear conta" max-width="sm:max-w-md">
            <p class="text-[14px] text-ink-muted" x-text="blockTarget && `${blockTarget.nome} será desconectado e não poderá entrar, denunciar nem validar até ser desbloqueado.`"></p>
            <label for="blk-motivo" class="label mt-4">Motivo</label>
            <input id="blk-motivo" type="text" x-model="blockReason" maxlength="255" class="input" placeholder="Ex.: denúncias falsas repetidas">
            <div class="mt-6 flex justify-end gap-2">
                <button type="button" class="btn-ghost" @click="blockOpen = false">Cancelar</button>
                <button type="button" class="btn-danger" @click="confirmBlock()"><x-eco.icon name="ban" class="h-4 w-4" />Bloquear</button>
            </div>
        </x-eco.sheet>

        {{-- -------- Categoria -------- --}}
        <x-eco.sheet show="categoryOpen" title="Editar categoria" max-width="sm:max-w-md">
            <template x-if="categoryForm">
                <form class="space-y-4" @submit.prevent="saveCategory()" novalidate>
                    <div>
                        <label for="cat-nome" class="label">Nome</label>
                        <input id="cat-nome" type="text" x-model="categoryForm.nome" maxlength="60" class="input">
                    </div>
                    <div>
                        <label for="cat-desc" class="label">Descrição</label>
                        <input id="cat-desc" type="text" x-model="categoryForm.descricao" maxlength="160" class="input">
                    </div>
                    <div>
                        <label for="cat-cor" class="label">Cor no mapa</label>
                        <div class="flex items-center gap-3">
                            <input id="cat-cor" type="color" x-model="categoryForm.cor" class="h-11 w-16 cursor-pointer rounded-lg border border-line bg-white p-1">
                            <input type="text" x-model="categoryForm.cor" maxlength="7" class="input w-32 font-mono" aria-label="Cor em hexadecimal">
                            <span class="grid h-10 w-10 place-items-center rounded-full text-white" :style="`background:${categoryForm.cor}`"><x-eco.icon name="megaphone" class="h-4 w-4" /></span>
                        </div>
                        <p class="mt-1 text-[12px] text-ink-muted">Use tons escuros: o ícone branco do mapa precisa continuar legível.</p>
                    </div>
                    <label class="flex items-center gap-2 text-[14px]">
                        <input type="checkbox" x-model="categoryForm.ativo" class="h-4 w-4 rounded border-line text-eco-600">
                        Ativa (aceita novas denúncias)
                    </label>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ghost" @click="categoryOpen = false">Cancelar</button>
                        <button type="submit" class="btn-primary" :disabled="busy === 'category'">Salvar</button>
                    </div>
                </form>
            </template>
        </x-eco.sheet>
    </div>
</x-eco.layout>
