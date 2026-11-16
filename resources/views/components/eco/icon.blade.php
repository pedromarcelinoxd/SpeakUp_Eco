{{-- Ícone Lucide. Uso: <x-eco.icon name="map" class="h-4 w-4" />  ou dinâmico: <x-eco.icon expr="cat.icon" /> --}}
@props(['name' => null, 'expr' => null])
<span x-icon="{{ $expr ?? "'".$name."'" }}" {{ $attributes->merge(['class' => 'er-icon']) }} aria-hidden="true"></span>
