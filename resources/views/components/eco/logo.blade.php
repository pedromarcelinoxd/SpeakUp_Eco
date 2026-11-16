{{-- Marca SpeakUp Eco: radar com folha. ID único por instância (o gradiente de um SVG oculto não pode ser referenciado). --}}
@php($gid = 'er-logo-'.\Illuminate\Support\Str::random(6))
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {{ $attributes }} role="img" aria-label="SpeakUp Eco">
    <rect width="32" height="32" rx="9" fill="#176B56"/>
    <circle cx="15" cy="17" r="9.5" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="1.6"/>
    <circle cx="15" cy="17" r="5" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1.6"/>
    <path d="M15 17V7.5a9.5 9.5 0 0 1 8.6 5.4L15 17Z" fill="#FFFFFF" fill-opacity=".22"/>
    <circle cx="15" cy="17" r="1.9" fill="#FFFFFF"/>
    <path d="M19.2 12.6c-.2-3.3 2.2-5.6 6.3-5.6.2 3.9-2.1 6.2-6.3 5.6Z" fill="#9CCBB3"/>
</svg>
