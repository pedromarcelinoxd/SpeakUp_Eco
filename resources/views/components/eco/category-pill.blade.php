{{-- Pílula de categoria. `type`: report|point; `expr`: chave da categoria. --}}
@props(['expr' => 'r.category', 'type' => 'report'])
@php($fn = $type === 'point' ? 'pointCategory' : 'reportCategory')
<span {{ $attributes->merge(['class' => 'badge']) }} :style="$u.tint($u.{{ $fn }}({{ $expr }}).color, .11)">
    <span x-icon="$u.{{ $fn }}({{ $expr }}).icon" class="er-icon h-3 w-3"></span>
    <span x-text="$u.{{ $fn }}({{ $expr }}).label"></span>
</span>
