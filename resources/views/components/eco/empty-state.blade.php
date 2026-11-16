@props(['icon' => 'inbox', 'title', 'text' => null])
<div {{ $attributes->merge(['class' => 'flex flex-col items-center px-6 py-14 text-center']) }}>
    <span class="relative grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <x-eco.icon :name="$icon" class="h-6 w-6" />
    </span>
    <p class="mt-4 font-display text-[15px] font-bold text-ink">{{ $title }}</p>
    @if ($text)
        <p class="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-muted">{{ $text }}</p>
    @endif
    {{ $slot }}
</div>
