{{-- Dropdown de notificações do cabeçalho --}}
<div class="relative" x-data="{ open: false }" @keydown.escape.window="open = false" @click.outside="open = false">
    <button type="button" class="icon-btn relative" @click="open = !open" :aria-expanded="open"
            :aria-label="`Notificações (${$store.eco.unreadCount} não lidas)`">
        <x-eco.icon name="bell" class="h-5 w-5" />
        <span x-cloak x-show="$store.eco.unreadCount > 0"
              class="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-alert px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas tabular"
              x-text="$store.eco.unreadCount > 9 ? '9+' : $store.eco.unreadCount"></span>
    </button>

    <div x-cloak x-show="open"
         x-transition:enter="transition ease-out duration-150" x-transition:enter-start="opacity-0 translate-y-1 scale-[.98]" x-transition:enter-end="opacity-100 translate-y-0 scale-100"
         x-transition:leave="transition ease-in duration-100" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"
         class="fixed inset-x-3 top-[4.25rem] z-50 origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-float sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div class="flex items-center gap-2">
                <p class="section-title">Notificações</p>
                <span x-show="$store.eco.unreadCount" class="badge bg-red-50 text-red-600" x-text="`${$store.eco.unreadCount} novas`"></span>
            </div>
            <button type="button" class="text-[12.5px] font-semibold text-eco-700 hover:text-eco-900 disabled:text-slate-300"
                    :disabled="!$store.eco.unreadCount" @click="$store.eco.markAllRead()">
                Marcar todas como lidas
            </button>
        </div>

        <ul class="scroll-thin max-h-[min(420px,60vh)] divide-y divide-slate-100 overflow-y-auto">
            <template x-for="n in $store.eco.notifications.slice(0, 6)" :key="n.id">
                <li>
                    <x-eco.notification-item />
                </li>
            </template>
            <li x-show="!$store.eco.notifications.length">
                <x-eco.empty-state icon="bell-off" title="Nenhuma notificação" text="Você será avisado sobre suas denúncias aqui." class="py-10" />
            </li>
        </ul>

        <a href="{{ route('eco.notifications') }}" class="flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-[13px] font-semibold text-ink transition hover:bg-slate-50">
            Ver todas
            <x-eco.icon name="arrow-right" class="h-3.5 w-3.5" />
        </a>
    </div>
</div>
