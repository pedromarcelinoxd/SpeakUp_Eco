{{-- Notificações temporárias (toasts) --}}
<div class="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6" aria-live="polite">
    <template x-for="t in $store.eco.toasts" :key="t.id">
        <div class="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-[13.5px] text-white shadow-float">
            <span class="er-icon mt-0.5 h-[18px] w-[18px] shrink-0"
                  :class="{ 'text-eco-500': t.type === 'success', 'text-amber-400': t.type === 'warning', 'text-red-400': t.type === 'error', 'text-sky-400': t.type === 'info' }"
                  x-icon="({ success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert', info: 'info' })[t.type]"></span>
            <p class="flex-1 leading-snug" x-text="t.message"></p>
            <button type="button" class="-mr-1 text-white/60 hover:text-white" @click="$store.eco.dismissToast(t.id)" aria-label="Fechar">
                <x-eco.icon name="x" class="h-4 w-4" />
            </button>
        </div>
    </template>
</div>
