{{--
    Bottom sheet no mobile / diálogo centralizado no desktop.
    Uso: <x-eco.sheet show="aberto" title="Título"> ... </x-eco.sheet>
    `show` é o nome da variável Alpine booleana no escopo pai.
--}}
@props(['show', 'title' => null, 'maxWidth' => 'sm:max-w-lg'])
<template x-teleport="body">
    <div x-cloak x-show="{{ $show }}" class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
         role="dialog" aria-modal="true" @if ($title) aria-label="{{ $title }}" @endif
         @keydown.escape.window="{{ $show }} = false">
        <div x-show="{{ $show }}" x-transition.opacity.duration.200ms class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" @click="{{ $show }} = false"></div>

        <div x-show="{{ $show }}"
             x-transition:enter="transition ease-out duration-300" x-transition:enter-start="translate-y-full opacity-60 sm:translate-y-4 sm:opacity-0 sm:scale-[.98]" x-transition:enter-end="translate-y-0 opacity-100 sm:scale-100"
             x-transition:leave="transition ease-in duration-200" x-transition:leave-start="translate-y-0 opacity-100" x-transition:leave-end="translate-y-full opacity-0 sm:translate-y-4"
             {{ $attributes->merge(['class' => "relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-float sm:rounded-3xl sm:p-6 $maxWidth"]) }}>
            <div class="mx-auto -mt-1 mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden"></div>
            @if ($title)
                <div class="mb-4 flex items-center justify-between gap-4">
                    <h2 class="font-display text-lg font-bold text-ink">{{ $title }}</h2>
                    <button type="button" class="icon-btn -mr-2 h-9 w-9" @click="{{ $show }} = false" aria-label="Fechar">
                        <x-eco.icon name="x" class="h-5 w-5" />
                    </button>
                </div>
            @endif
            {{ $slot }}
        </div>
    </div>
</template>
