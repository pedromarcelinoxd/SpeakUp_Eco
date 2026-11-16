<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Entrar · EcoRadar</title>
    <link rel="icon" type="image/svg+xml" href="{{ asset('ecoradar-icon.svg') }}">
    <script>window.EcoRadar = { base: @json(url('/app')) };</script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body x-data class="min-h-dvh bg-white text-ink">
    <div class="grid min-h-dvh lg:grid-cols-2">
        {{-- Painel de marca --}}
        <aside class="relative hidden overflow-hidden border-r border-line bg-canvas p-12 text-ink lg:flex lg:flex-col">
            <svg class="absolute -bottom-40 -right-40 h-[620px] w-[620px] text-eco-600/[.07]" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                <circle cx="100" cy="100" r="98" stroke="currentColor"/><circle cx="100" cy="100" r="76" stroke="currentColor"/><circle cx="100" cy="100" r="54" stroke="currentColor"/><circle cx="100" cy="100" r="32" stroke="currentColor"/>
                <path d="M100 100 L100 2 A98 98 0 0 1 185 51 Z" fill="currentColor"/>
            </svg>
            <a href="{{ route('eco.dashboard') }}" class="relative flex items-center gap-2.5">
                <x-eco.logo class="h-9 w-9" />
                <span class="font-display text-xl font-extrabold text-eco-700">EcoRadar</span>
            </a>
            <div class="relative mt-auto max-w-md">
                <p class="font-display text-[40px] font-extrabold leading-[1.08] tracking-tight">Identifique.<br>Denuncie.<br><span class="text-eco-600">Transforme.</span></p>
                <p class="mt-5 text-[15px] leading-relaxed text-ink-muted">Uma plataforma colaborativa para mapear problemas ambientais, acompanhar soluções e encontrar o destino certo para cada resíduo.</p>
                <ul class="mt-8 space-y-3 text-[14px] text-ink">
                    <li class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-eco-100 text-eco-700"><x-eco.icon name="map" class="h-4 w-4" /></span>Mapa colaborativo em tempo real</li>
                    <li class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-eco-100 text-eco-700"><x-eco.icon name="recycle" class="h-4 w-4" /></span>Pontos de descarte por material</li>
                    <li class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-eco-100 text-eco-700"><x-eco.icon name="trophy" class="h-4 w-4" /></span>Reconhecimento para quem contribui</li>
                </ul>
            </div>
            <p class="relative mt-12 text-[12px] text-ink-muted">Projeto UPX · Engenharia da Computação · FACENS</p>
        </aside>

        {{-- Formulário --}}
        <main class="flex items-center justify-center px-5 py-10 sm:px-10" x-data="authPage">
            <div class="w-full max-w-sm">
                <a href="{{ route('eco.dashboard') }}" class="mb-8 flex items-center gap-2.5 lg:hidden">
                    <x-eco.logo class="h-9 w-9" />
                    <span class="font-display text-xl font-extrabold text-ink">Eco<span class="text-eco-600">Radar</span></span>
                </a>

                <h1 class="font-display text-[26px] font-extrabold tracking-tight text-ink" x-text="mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'"></h1>
                <p class="mt-1 text-[14px] text-ink-muted" x-text="mode === 'login' ? 'Entre para registrar e acompanhar suas denúncias.' : 'Comece a contribuir com a sua cidade em poucos segundos.'"></p>

                <div class="mt-6 grid grid-cols-2 rounded-xl bg-stone p-1" role="tablist">
                    <button type="button" role="tab" @click="mode = 'login'; error = ''" :aria-selected="mode === 'login'" class="rounded-lg py-2 text-[13.5px] font-semibold transition" :class="mode === 'login' ? 'bg-eco-600 text-white' : 'text-ink-muted'">Entrar</button>
                    <button type="button" role="tab" @click="mode = 'register'; error = ''" :aria-selected="mode === 'register'" class="rounded-lg py-2 text-[13.5px] font-semibold transition" :class="mode === 'register' ? 'bg-eco-600 text-white' : 'text-ink-muted'">Criar conta</button>
                </div>

                <form class="mt-6 space-y-4" @submit.prevent="submit()" novalidate>
                    <div x-show="mode === 'register'">
                        <label for="a-name" class="label">Nome</label>
                        <input id="a-name" type="text" x-model="name" class="input" autocomplete="name" placeholder="Como devemos te chamar?">
                    </div>
                    <div>
                        <label for="a-email" class="label">E-mail</label>
                        <input id="a-email" type="email" x-model="email" class="input" autocomplete="email" placeholder="voce@email.com">
                    </div>
                    <div>
                        <label for="a-pass" class="label">Senha</label>
                        <div class="relative">
                            <input id="a-pass" :type="showPassword ? 'text' : 'password'" x-model="password" class="input pr-11" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" placeholder="••••••••">
                            <button type="button" @click="showPassword = !showPassword" class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-ink" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                                <x-eco.icon name="eye" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div x-show="mode === 'register'">
                        <label for="a-pass2" class="label">Confirmar senha</label>
                        <input id="a-pass2" :type="showPassword ? 'text' : 'password'" x-model="passwordConfirmation" class="input" autocomplete="new-password" placeholder="••••••••">
                    </div>

                    <p x-show="error" class="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700" role="alert">
                        <x-eco.icon name="circle-alert" class="mt-px h-4 w-4 shrink-0" />
                        <span x-text="error"></span>
                    </p>

                    <button type="submit" class="btn-primary w-full py-3" :disabled="loading">
                        <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="loading" />
                        <span x-text="mode === 'login' ? 'Entrar' : 'Criar conta'"></span>
                    </button>
                </form>

                <div class="my-6 flex items-center gap-3 text-[12px] text-slate-400">
                    <span class="h-px flex-1 bg-slate-200"></span>ou<span class="h-px flex-1 bg-slate-200"></span>
                </div>

                <button type="button" class="btn-secondary w-full" @click="continueDemo()">
                    <x-eco.icon name="sparkles" class="h-4 w-4 text-amber-500" />
                    Explorar no modo demonstração
                </button>
                <p class="mt-3 text-center text-[12px] leading-relaxed text-slate-400">No modo demonstração, os dados exibidos são fictícios e suas denúncias ficam salvas apenas neste navegador.</p>
            </div>
        </main>
    </div>
    <x-eco.toasts />
</body>
</html>
