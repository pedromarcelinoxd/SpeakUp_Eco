{{-- Card de ponto de descarte. Espera a variável Alpine `p` no escopo. --}}
<article {{ $attributes->merge(['class' => 'card card-hover group relative flex flex-col p-4']) }}>
    <div class="flex items-start gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :style="$u.tint($u.pointCategory(p.category).color, .12)">
            <span x-icon="$u.pointCategory(p.category).icon" class="er-icon h-5 w-5"></span>
        </span>
        <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
                <h3 class="font-display text-[15px] font-bold leading-snug text-ink">
                    <a :href="$u.route('point', p.id)" class="after:absolute after:inset-0 after:rounded-2xl group-hover:text-eco-800" x-text="p.name"></a>
                </h3>
                <span class="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-ink tabular" x-text="$u.formatDistance($store.eco.distanceTo(p.coords))"></span>
            </div>
            <p class="mt-0.5 text-[12.5px] font-medium" :style="`color:${$u.pointCategory(p.category).color}`" x-text="$u.pointCategory(p.category).label"></p>
        </div>
    </div>

    <dl class="mt-3 space-y-1.5 text-[12.5px] text-ink-muted">
        <div class="flex items-start gap-2">
            <dt class="sr-only">Endereço</dt>
            <x-eco.icon name="map-pin" class="mt-px h-3.5 w-3.5 text-slate-400" />
            <dd class="line-clamp-1" x-text="p.address"></dd>
        </div>
        <div class="flex items-start gap-2">
            <dt class="sr-only">Horário</dt>
            <x-eco.icon name="clock" class="mt-px h-3.5 w-3.5 text-slate-400" />
            <dd x-text="p.hours"></dd>
        </div>
    </dl>

    <div class="mt-3 flex flex-wrap gap-1.5">
        <template x-for="m in p.materials.slice(0, 3)" :key="m">
            <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-600" x-text="m"></span>
        </template>
        <span x-show="p.materials.length > 3" class="rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-500" x-text="`+${p.materials.length - 3}`"></span>
    </div>

    <div class="relative z-10 mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <a :href="$u.directionsUrl(p.coords)" target="_blank" rel="noopener" class="btn-secondary btn-sm flex-1">
            <x-eco.icon name="navigation" class="h-3.5 w-3.5" />
            Como chegar
        </a>
        <a :href="$u.route('point', p.id)" class="btn-ghost btn-sm">
            Detalhes
            <x-eco.icon name="arrow-right" class="h-3.5 w-3.5" />
        </a>
    </div>
</article>
