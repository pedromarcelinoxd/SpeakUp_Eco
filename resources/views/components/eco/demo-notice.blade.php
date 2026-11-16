{{-- Aviso de dados demonstrativos --}}
@props(['text' => 'Parte das informações desta página é demonstrativa e não representa ocorrências reais.'])
<div x-cloak x-show="$store.eco.hasDemo" {{ $attributes->merge(['class' => 'flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900']) }}>
    <x-eco.icon name="info" class="mt-px h-4 w-4 shrink-0 text-amber-600" />
    <p class="flex-1 leading-relaxed">{{ $text }} <a href="{{ route('eco.settings') }}" class="font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-950">Configurar</a></p>
</div>
