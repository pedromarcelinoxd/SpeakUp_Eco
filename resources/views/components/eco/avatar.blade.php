{{-- Avatar do usuário atual (foto ou iniciais). Para outro usuário: <x-eco.avatar name-expr="u.name" photo-expr="u.photo" /> --}}
@props(['nameExpr' => null, 'photoExpr' => null])
@php($n = $nameExpr ?? '$store.eco.user.name')
<span {{ $attributes->merge(['class' => 'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white']) }}
      :style="`background:${$u.avatarColor({{ $n }} || '')}`">
    <span x-text="$u.initials({{ $n }} || '')"></span>
    @if (! $nameExpr)
        <template x-if="$store.eco.user.avatar">
            <img :src="$store.eco.user.avatar" alt="" class="absolute inset-0 h-full w-full object-cover">
        </template>
    @elseif ($photoExpr)
        <template x-if="{{ $photoExpr }}">
            <img :src="{{ $photoExpr }}" alt="" class="absolute inset-0 h-full w-full object-cover">
        </template>
    @endif
</span>
