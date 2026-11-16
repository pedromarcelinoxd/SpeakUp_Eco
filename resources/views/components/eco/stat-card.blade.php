{{--
    Card de indicador.
    value/delta: expressões Alpine. spark: expressão com array numérico (opcional).
--}}
@props(['label', 'icon', 'color' => '#16A34A', 'value', 'delta' => null, 'deltaGood' => 'up', 'hint' => null, 'spark' => null, 'href' => null])
@php($tag = $href ? 'a' : 'div')
<{{ $tag }} @if ($href) href="{{ $href }}" @endif {{ $attributes->merge(['class' => 'card group relative flex flex-col gap-3 overflow-hidden p-4 sm:p-5'.($href ? ' card-hover' : '')]) }}>
    <div class="flex items-center justify-between gap-3">
        <p class="text-[13px] font-medium text-ink-muted">{{ $label }}</p>
        <span class="grid h-8 w-8 place-items-center rounded-lg" style="background: {{ $color }}14; color: {{ $color }}">
            <x-eco.icon :name="$icon" class="h-4 w-4" />
        </span>
    </div>
    <div class="flex items-end justify-between gap-3">
        <div class="min-w-0">
            <p class="font-display text-[28px] font-extrabold leading-none tracking-tight text-ink tabular" x-text="{{ $value }}">&nbsp;</p>
            @if ($delta)
                <p class="mt-2 flex flex-wrap items-center gap-1 text-[12px] font-semibold"
                   :class="({{ $delta }}) === 0 ? 'text-slate-400' : ((({{ $delta }}) > 0) === {{ $deltaGood === 'up' ? 'true' : 'false' }} ? 'text-eco-700' : 'text-red-600')">
                    <span class="er-icon h-3.5 w-3.5" x-icon="({{ $delta }}) >= 0 ? 'trending-up' : 'trending-down'"></span>
                    <span class="tabular" x-text="`${({{ $delta }}) > 0 ? '+' : ''}${({{ $delta }})}%`"></span>
                    <span class="font-medium text-slate-400">{{ $hint ?? 'vs. 30 dias anteriores' }}</span>
                </p>
            @elseif ($hint)
                <p class="mt-2 text-[12px] font-medium text-slate-400">{{ $hint }}</p>
            @endif
        </div>
        @if ($spark)
            <svg class="hidden h-10 w-24 shrink-0 overflow-visible sm:block" viewBox="0 0 96 40" preserveAspectRatio="none" aria-hidden="true">
                <path :d="$u.sparkPath({{ $spark }}, 96, 40, true)" fill="{{ $color }}" fill-opacity=".09"/>
                <path :d="$u.sparkPath({{ $spark }}, 96, 40)" fill="none" stroke="{{ $color }}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            </svg>
        @endif
    </div>
</{{ $tag }}>
