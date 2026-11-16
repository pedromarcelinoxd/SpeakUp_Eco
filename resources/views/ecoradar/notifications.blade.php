<x-eco.layout title="Notificações" subtitle="Atualizações sobre suas denúncias e sua região">
    <div x-data="notificationsPage" class="mx-auto max-w-3xl space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex rounded-xl bg-slate-200/60 p-1" role="tablist">
                <button type="button" role="tab" @click="filter = 'all'" :aria-selected="filter === 'all'" class="rounded-lg px-4 py-1.5 text-[13px] font-semibold transition" :class="filter === 'all' ? 'bg-white text-ink shadow-card' : 'text-ink-muted'">Todas</button>
                <button type="button" role="tab" @click="filter = 'unread'" :aria-selected="filter === 'unread'" class="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition" :class="filter === 'unread' ? 'bg-white text-ink shadow-card' : 'text-ink-muted'">
                    Não lidas
                    <span x-show="$store.eco.unreadCount" class="grid h-5 min-w-5 place-items-center rounded-full bg-alert px-1.5 text-[11px] text-white" x-text="$store.eco.unreadCount"></span>
                </button>
            </div>
            <button type="button" class="btn-secondary btn-sm" :disabled="!$store.eco.unreadCount" @click="$store.eco.markAllRead(); $store.eco.toast('Todas as notificações foram marcadas como lidas.', 'success')">
                <x-eco.icon name="check-check" class="h-4 w-4" />
                Marcar todas como lidas
            </button>
        </div>

        <template x-for="g in groups" :key="g.label">
            <section>
                <h2 class="eyebrow mb-2 px-1" x-text="g.label"></h2>
                <ul class="card divide-y divide-slate-100 overflow-hidden">
                    <template x-for="n in g.items" :key="n.id">
                        <li class="group relative">
                            <x-eco.notification-item />
                            <button type="button" x-show="!n.read" @click="$store.eco.markRead(n.id)"
                                    class="absolute bottom-3 right-4 text-[12px] font-semibold text-eco-700 opacity-100 transition hover:text-eco-900 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                                Marcar como lida
                            </button>
                        </li>
                    </template>
                </ul>
            </section>
        </template>

        <div x-show="!list.length" class="card">
            <x-eco.empty-state icon="bell-off" title="Tudo em dia!" text="Você não tem notificações não lidas." />
        </div>
    </div>
</x-eco.layout>
