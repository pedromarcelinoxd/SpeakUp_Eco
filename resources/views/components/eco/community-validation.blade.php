{{--
    Validação comunitária de uma ocorrência (espera `r` no escopo Alpine).
    "Esse problema ainda existe" / "Foi resolvido": um voto por pessoa, com ou sem conta.
    Não é confirmação oficial da prefeitura — o aviso fica sempre visível.
--}}
<section {{ $attributes->merge(['class' => 'rounded-2xl border border-line bg-white p-4']) }}
         x-data="{ busy: null, feedback: null, async vote(tipo) { this.busy = tipo; this.feedback = null; this.feedback = await $store.eco.vote(r.id, tipo); this.busy = null; } }"
         aria-label="Validação da comunidade">
    <div class="flex items-center gap-2">
        <x-eco.icon name="users" class="h-4 w-4 text-eco-700" />
        <h3 class="flex-1 text-[13.5px] font-semibold text-ink">Validação da comunidade</h3>
    </div>

    <dl class="mt-3 grid grid-cols-2 divide-x divide-line">
        <div class="pr-3">
            <dd class="font-display text-[19px] font-bold text-ink tabular" x-text="r.votes?.exists ?? 0"></dd>
            <dt class="text-[12px] text-ink-muted" x-text="(r.votes?.exists ?? 0) === 1 ? 'confirmou que existe' : 'confirmaram que existe'"></dt>
        </div>
        <div class="pl-3">
            <dd class="font-display text-[19px] font-bold text-ink tabular" x-text="r.votes?.resolved ?? 0"></dd>
            <dt class="text-[12px] text-ink-muted" x-text="(r.votes?.resolved ?? 0) === 1 ? 'informou resolução' : 'informaram resolução'"></dt>
        </div>
    </dl>

    <template x-if="r.canVote">
        <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary justify-center" :disabled="!!busy" @click="vote('existe')"
                    :class="r.myVote === 'existe' && '!border-eco-600 !bg-eco-100'" :aria-pressed="r.myVote === 'existe'">
                <x-eco.icon name="loader" class="h-4 w-4 animate-spin" ::class="busy === 'existe' ? '' : 'hidden'" />
                <x-eco.icon name="thumbs-up" class="h-4 w-4" ::class="busy !== 'existe' && r.myVote !== 'existe' ? '' : 'hidden'" />
                <x-eco.icon name="check" class="h-4 w-4" ::class="busy !== 'existe' && r.myVote === 'existe' ? '' : 'hidden'" />
                Ainda existe
            </button>
            <button type="button" class="btn-secondary justify-center" :disabled="!!busy" @click="vote('resolvida')"
                    :class="r.myVote === 'resolvida' && '!border-eco-600 !bg-eco-100'" :aria-pressed="r.myVote === 'resolvida'">
                <x-eco.icon name="loader" class="h-4 w-4 animate-spin" ::class="busy === 'resolvida' ? '' : 'hidden'" />
                <x-eco.icon name="circle-check" class="h-4 w-4" ::class="busy !== 'resolvida' ? '' : 'hidden'" />
                Foi resolvido
            </button>
        </div>
    </template>
    {{-- Visibilidade por classe (x-show não reage dentro do painel do mapa, que é recriado por x-if) --}}
    <p class="mt-3 text-[12.5px] text-ink-muted" :class="!r.canVote && r.blockReason && !r.needsLogin ? '' : 'hidden'" x-text="r.blockReason"></p>
    <div class="mt-3" :class="r.needsLogin ? '' : 'hidden'">
        <p class="text-[12.5px] text-ink-muted">Para validar, entre com sua conta. Assim cada pessoa conta uma vez só.</p>
        <a :href="`{{ route('eco.login') }}?voltar=${encodeURIComponent(window.location.pathname)}`" class="btn-secondary btn-sm mt-2"><x-eco.icon name="log-in" class="h-3.5 w-3.5" />Entrar para validar</a>
    </div>
    <p class="mt-3 text-[12.5px] text-ink-muted" :class="r.source !== 'api' ? '' : 'hidden'">Ocorrência demonstrativa: não aceita validação.</p>

    <p class="mt-2 text-[12px] text-ink-muted" :class="r.canVote && r.myVote && !feedback ? '' : 'hidden'"
       x-text="`Você informou: ${r.myVote === 'existe' ? 'o problema ainda existe' : 'o problema foi resolvido'}. Pode mudar se a situação mudar.`"></p>

    <p role="status" aria-live="polite" class="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[12.5px]"
       :class="!feedback ? 'hidden' : (feedback.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700')">
        <span x-text="feedback?.text"></span>
    </p>

    <p class="mt-3 text-[11.5px] leading-relaxed text-ink-muted">{{ \Illuminate\Support\Str::of('Validação feita por moradores. Não é uma confirmação oficial da prefeitura.') }}</p>
</section>
