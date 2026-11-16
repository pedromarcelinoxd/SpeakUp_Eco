{{-- Item de notificação. Espera a variável Alpine `n` no escopo. --}}
<a :href="$store.eco.notificationUrl(n)" @click="$store.eco.markRead(n.id)"
   class="group flex gap-3 px-4 py-3.5 transition hover:bg-slate-50"
   :class="!n.read && 'bg-eco-50/40'">
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl" :style="$u.tint(n.color, .12)">
        <span x-icon="n.icon" class="er-icon h-[18px] w-[18px]"></span>
    </span>
    <span class="min-w-0 flex-1">
        <span class="flex items-start justify-between gap-2">
            <span class="text-[13.5px] font-semibold leading-snug text-ink" x-text="n.title"></span>
            <span x-show="!n.read" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-eco-600" aria-label="Não lida"></span>
        </span>
        <span class="mt-0.5 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-muted" x-text="n.body"></span>
        <span class="mt-1 block text-[11.5px] font-medium text-slate-400" x-text="$u.timeAgo(n.date)"></span>
    </span>
</a>
