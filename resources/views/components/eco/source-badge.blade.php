{{-- Identifica a origem do dado: real (API), local ou demonstração --}}
@props(['expr' => 'r'])
<span {{ $attributes->merge(['class' => 'badge']) }}
      :class="{ 'bg-eco-50 text-eco-800': {{ $expr }}.source === 'api', 'bg-sky-50 text-sky-700': {{ $expr }}.source === 'local', 'bg-amber-50 text-amber-700': {{ $expr }}.source === 'demo' }"
      x-text="$u.sourceLabel({{ $expr }})"></span>
