{{-- Badge de status. `expr`: expressão Alpine com a chave do status (ex.: "r.status"). --}}
@props(['expr' => 'r.status'])
<span {{ $attributes->merge(['class' => 'badge']) }}
      :class="[$u.status({{ $expr }}).bg, $u.status({{ $expr }}).text]">
    <span class="h-1.5 w-1.5 rounded-full" :style="`background:${$u.status({{ $expr }}).color}`"></span>
    <span x-text="$u.status({{ $expr }}).label"></span>
</span>
