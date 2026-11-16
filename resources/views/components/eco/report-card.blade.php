{{-- Card de denúncia. Espera a variável Alpine `r` no escopo. --}}
<a :href="$u.route('report', r.id)" {{ $attributes->merge(['class' => 'card card-hover group flex flex-col overflow-hidden']) }}>
    <div class="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <img :src="$u.photo(r)" :alt="$u.hasRealPhoto(r) ? `Foto: ${r.title}` : 'Imagem ilustrativa da categoria'" loading="lazy"
             class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]">
        <div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <x-eco.status-badge class="bg-white/95 shadow-card backdrop-blur" />
            <span x-show="r.source !== 'demo'" class="badge bg-white/95 text-ink shadow-card" x-text="$u.sourceLabel(r)"></span>
        </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
        <x-eco.category-pill class="self-start" />
        <h3 class="line-clamp-2 font-display text-[15px] font-bold leading-snug text-ink group-hover:text-eco-800" x-text="r.title"></h3>
        <div class="mt-auto flex items-center justify-between gap-3 pt-1 text-[12.5px] text-ink-muted">
            <span class="flex min-w-0 items-center gap-1">
                <x-eco.icon name="map-pin" class="h-3.5 w-3.5" />
                <span class="truncate" x-text="r.neighborhood"></span>
            </span>
            <span class="shrink-0" x-text="$u.timeAgo(r.createdAt)"></span>
        </div>
    </div>
</a>
