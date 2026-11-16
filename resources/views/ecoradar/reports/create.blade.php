<x-eco.layout title="Nova denúncia" :back="route('eco.reports.index')">
    <div x-data="reportForm" class="mx-auto max-w-3xl">

        {{-- Cabeçalho --}}
        <div x-show="step <= 5" class="mb-6 text-center sm:mb-8">
            <span class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-eco-100 text-eco-700">
                <x-eco.icon name="hand-heart" class="h-6 w-6" />
            </span>
            <h2 class="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">Ajude a cuidar do meio ambiente.</h2>
            <p class="mt-1.5 text-[14.5px] text-ink-muted">Registre uma ocorrência e ajude sua comunidade.</p>
        </div>

        {{-- Stepper --}}
        <nav x-show="step <= 5" aria-label="Etapas" class="mb-6">
            <div class="relative mx-auto mb-3 h-1 max-w-xl overflow-hidden rounded-full bg-slate-200 sm:hidden">
                <div class="h-full rounded-full bg-eco-600 transition-all duration-500" :style="`width:${progress}%`"></div>
            </div>
            <p class="text-center text-[12.5px] font-semibold text-ink-muted sm:hidden" x-text="`Etapa ${step} de 5 · ${steps[step - 1]?.label}`"></p>
            <ol class="hidden items-center justify-between gap-2 sm:flex">
                <template x-for="(s, i) in steps" :key="s.key">
                    <li class="flex flex-1 items-center gap-2 last:flex-none">
                        <button type="button" @click="goTo(i + 1)" class="group flex items-center gap-2.5" :aria-current="step === i + 1 ? 'step' : null">
                            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-[13px] font-bold transition"
                                  :class="step > i + 1 ? 'border-eco-600 bg-eco-600 text-white' : (step === i + 1 ? 'border-eco-600 bg-white text-eco-700 shadow-[0_0_0_4px_rgba(22,163,74,.12)]' : 'border-slate-200 bg-white text-slate-400')">
                                <span x-show="step > i + 1" x-icon="'check'" class="er-icon h-4 w-4"></span>
                                <span x-show="step <= i + 1" x-text="i + 1"></span>
                            </span>
                            <span class="text-[13px] font-semibold transition" :class="step >= i + 1 ? 'text-ink' : 'text-slate-400'" x-text="s.label"></span>
                        </button>
                        <span x-show="i < steps.length - 1" class="mx-1 h-0.5 flex-1 rounded-full transition" :class="step > i + 1 ? 'bg-eco-600' : 'bg-slate-200'"></span>
                    </li>
                </template>
            </ol>
        </nav>

        {{-- Modo de envio --}}
        <div x-show="step <= 5" class="mb-4">
            <template x-if="usesApi">
                <div class="flex items-center gap-2.5 rounded-xl border border-eco-200 bg-eco-50 px-4 py-2.5 text-[12.5px] text-eco-900">
                    <x-eco.icon name="shield-check" class="h-4 w-4 shrink-0 text-eco-700" />
                    <span>Conectado como <strong x-text="$store.eco.user.fullName"></strong>. A denúncia será enviada ao servidor do EcoRadar.</span>
                </div>
            </template>
            <template x-if="!usesApi">
                <div class="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[12.5px] text-sky-900">
                    <x-eco.icon name="info" class="mt-px h-4 w-4 shrink-0 text-sky-600" />
                    <span>Modo demonstração: a denúncia ficará salva apenas neste navegador.
                        <a href="{{ route('eco.login') }}" class="font-semibold underline underline-offset-2">Entre na sua conta</a> para enviá-la ao servidor.</span>
                </div>
            </template>
        </div>

        <form @submit.prevent="step < 5 ? next() : submit()" novalidate>
            <div class="card p-5 sm:p-7">

                {{-- ========== Etapa 1: Categoria ========== --}}
                <section x-show="step === 1" x-transition.opacity.duration.200ms aria-labelledby="s1">
                    <h3 id="s1" class="font-display text-lg font-bold text-ink">Qual é o problema?</h3>
                    <p class="mt-0.5 text-[13.5px] text-ink-muted">Escolha a categoria que melhor descreve a ocorrência.</p>
                    <div class="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Categoria">
                        <template x-for="[key, c] in Object.entries(categories)" :key="key">
                            <label class="group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-4 transition"
                                   :class="category === key ? 'bg-white shadow-lift' : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'"
                                   :style="category === key && `border-color:${c.color}`">
                                <input type="radio" name="category" :value="key" x-model="category" class="sr-only">
                                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition" :style="category === key ? `background:${c.color};color:#fff` : $u.tint(c.color, .12)">
                                    <span x-icon="c.icon" class="er-icon h-5 w-5"></span>
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="block text-[14.5px] font-semibold text-ink" x-text="c.label"></span>
                                    <span class="mt-0.5 block text-[12.5px] leading-snug text-ink-muted" x-text="c.description"></span>
                                </span>
                                <span x-show="category === key" class="grid h-5 w-5 place-items-center rounded-full text-white" :style="`background:${c.color}`">
                                    <span x-icon="'check'" class="er-icon h-3 w-3"></span>
                                </span>
                            </label>
                        </template>
                    </div>
                    <p x-show="errors.category" class="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-red-600" role="alert"><x-eco.icon name="circle-alert" class="h-4 w-4" /><span x-text="errors.category"></span></p>
                </section>

                {{-- ========== Etapa 2: Informações ========== --}}
                <section x-show="step === 2" x-transition.opacity.duration.200ms aria-labelledby="s2" class="space-y-5">
                    <div>
                        <h3 id="s2" class="font-display text-lg font-bold text-ink">Conte o que aconteceu</h3>
                        <p class="mt-0.5 text-[13.5px] text-ink-muted">Seja objetivo e descreva apenas o que você observou.</p>
                    </div>
                    <div>
                        <div class="flex items-baseline justify-between">
                            <label for="title" class="label">Título</label>
                            <span class="text-[11.5px] text-slate-400 tabular" x-text="`${title.length}/120`"></span>
                        </div>
                        <input id="title" type="text" x-model="title" maxlength="120" placeholder="Ex.: Entulho acumulado na calçada" class="input" :class="errors.title && 'input-error'" :aria-invalid="!!errors.title">
                        <p x-show="errors.title" class="mt-1.5 text-[12.5px] font-medium text-red-600" role="alert" x-text="errors.title"></p>
                    </div>
                    <div>
                        <div class="flex items-baseline justify-between">
                            <label for="description" class="label">Descrição</label>
                            <span class="text-[11.5px] text-slate-400 tabular" x-text="`${description.length}/800`"></span>
                        </div>
                        <textarea id="description" x-model="description" rows="5" maxlength="800" placeholder="Descreva o problema, há quanto tempo está assim e qualquer detalhe que ajude a localizar o local." class="input resize-y" :class="errors.description && 'input-error'" :aria-invalid="!!errors.description"></textarea>
                        <p x-show="errors.description" class="mt-1.5 text-[12.5px] font-medium text-red-600" role="alert" x-text="errors.description"></p>
                    </div>
                    <fieldset>
                        <legend class="label">Gravidade percebida</legend>
                        <div class="grid grid-cols-3 gap-2">
                            <template x-for="[key, s] in Object.entries(severities)" :key="key">
                                <label class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-[13.5px] font-semibold transition"
                                       :class="severity === key ? 'bg-white text-ink shadow-card' : 'border-slate-200/80 text-ink-muted hover:border-slate-300'"
                                       :style="severity === key && `border-color:${s.color}`">
                                    <input type="radio" name="severity" :value="key" x-model="severity" class="sr-only">
                                    <span class="h-2.5 w-2.5 rounded-full" :style="`background:${s.color}`"></span>
                                    <span x-text="s.label"></span>
                                </label>
                            </template>
                        </div>
                    </fieldset>
                </section>

                {{-- ========== Etapa 3: Fotografias ========== --}}
                <section x-show="step === 3" x-transition.opacity.duration.200ms aria-labelledby="s3" class="space-y-5">
                    <div>
                        <h3 id="s3" class="font-display text-lg font-bold text-ink">Adicione fotografias</h3>
                        <p class="mt-0.5 text-[13.5px] text-ink-muted">Fotos ajudam a equipe a validar a ocorrência. Evite registrar rostos ou placas de veículos.</p>
                    </div>
                    <div @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop($event)"
                         class="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition"
                         :class="dragging ? 'border-eco-500 bg-eco-50' : (errors.photos ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300')">
                        <span class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-eco-700 shadow-card">
                            <x-eco.icon name="cloud-upload" class="h-6 w-6" />
                        </span>
                        <p class="mt-3 text-[14.5px] font-semibold text-ink">Arraste e solte as imagens aqui</p>
                        <p class="mt-0.5 text-[12.5px] text-ink-muted">JPG ou PNG · até 5 MB cada · máximo de 5 fotos</p>
                        <div class="mt-4 flex flex-wrap justify-center gap-2">
                            <label class="btn-secondary btn-sm cursor-pointer">
                                <x-eco.icon name="image-plus" class="h-4 w-4" />
                                Selecionar arquivos
                                <input x-ref="fileInput" type="file" accept="image/jpeg,image/png" multiple class="sr-only" @change="addFiles($event.target.files)">
                            </label>
                            <label class="btn-secondary btn-sm cursor-pointer sm:hidden">
                                <x-eco.icon name="camera" class="h-4 w-4" />
                                Tirar foto
                                <input type="file" accept="image/jpeg,image/png" capture="environment" class="sr-only" @change="addFiles($event.target.files)">
                            </label>
                        </div>
                    </div>
                    <p x-show="errors.photos" class="flex items-start gap-1.5 text-[13px] font-medium text-red-600" role="alert"><x-eco.icon name="circle-alert" class="mt-px h-4 w-4" /><span x-text="errors.photos"></span></p>

                    <ul x-show="photos.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <template x-for="(p, i) in photos" :key="p.id">
                            <li class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                <img :src="p.url" :alt="`Pré-visualização ${i + 1}`" class="aspect-[4/3] w-full object-cover">
                                <span x-show="i === 0" class="badge absolute left-2 top-2 bg-ink/80 text-white">Capa</span>
                                <div class="absolute right-2 top-2 flex gap-1">
                                    <button type="button" x-show="i > 0" @click="makeCover(p.id)" class="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white" title="Definir como capa" aria-label="Definir como capa">
                                        <x-eco.icon name="star" class="h-4 w-4" />
                                    </button>
                                    <button type="button" @click="removePhoto(p.id)" class="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow-card hover:bg-white" title="Remover" aria-label="Remover imagem">
                                        <x-eco.icon name="trash" class="h-4 w-4" />
                                    </button>
                                </div>
                                <p class="truncate bg-white px-2.5 py-1.5 text-[11.5px] text-ink-muted" x-text="`${p.name} · ${formatSize(p.size)}`"></p>
                            </li>
                        </template>
                    </ul>
                </section>

                {{-- ========== Etapa 4: Localização ========== --}}
                <section x-show="step === 4" x-transition.opacity.duration.200ms aria-labelledby="s4" class="space-y-4">
                    <div class="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h3 id="s4" class="font-display text-lg font-bold text-ink">Onde fica?</h3>
                            <p class="mt-0.5 text-[13.5px] text-ink-muted">Toque no mapa para marcar o local. Você pode arrastar o marcador para ajustar.</p>
                        </div>
                        <button type="button" @click="useMyLocation()" class="btn-secondary btn-sm" :disabled="locating">
                            <x-eco.icon name="locate-fixed" class="h-4 w-4 text-info" x-show="!locating" />
                            <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="locating" />
                            Usar minha localização
                        </button>
                    </div>
                    <div class="relative overflow-hidden rounded-2xl border" :class="errors.coords ? 'border-red-300' : 'border-slate-200'">
                        <div x-ref="locationMap" class="h-[340px] w-full sm:h-[380px]"></div>
                        <div x-show="!coords" class="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
                            <span class="flex items-center gap-2 rounded-full bg-ink/85 px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-float backdrop-blur">
                                <x-eco.icon name="mouse-pointer" class="h-3.5 w-3.5" />
                                Clique no mapa para marcar o local
                            </span>
                        </div>
                    </div>
                    <p x-show="errors.coords" class="flex items-center gap-1.5 text-[13px] font-medium text-red-600" role="alert"><x-eco.icon name="circle-alert" class="h-4 w-4" /><span x-text="errors.coords"></span></p>

                    <div x-show="coords" class="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-eco-700 shadow-card"><x-eco.icon name="map-pin" class="h-4 w-4" /></span>
                        <div class="min-w-0 text-[13px]">
                            <p class="font-semibold text-ink" x-text="address || 'Endereço não identificado'"></p>
                            <p class="font-mono text-[12px] text-ink-muted" x-text="coords && `${coords[0]}, ${coords[1]}`"></p>
                        </div>
                    </div>

                    <template x-if="usesApi && campusPoint">
                        <div>
                            <label for="campus" class="label">Ponto de referência no campus <span class="font-normal text-ink-muted">(opcional)</span></label>
                            <select id="campus" x-model="campusPoint" class="input" :class="errors.campusPoint && 'input-error'">
                                <option value="">Selecione…</option>
                                <template x-for="[key, p] in Object.entries(campusPoints)" :key="key">
                                    <option :value="key" x-text="p.label" :selected="campusPoint === key"></option>
                                </template>
                            </select>
                            <p class="mt-1.5 text-[12px] text-ink-muted">O local marcado fica dentro da FACENS. Indicar o prédio ajuda a equipe do campus.</p>
                        </div>
                    </template>
                </section>

                {{-- ========== Etapa 5: Revisão ========== --}}
                <section x-show="step === 5" x-transition.opacity.duration.200ms aria-labelledby="s5" class="space-y-5">
                    <div>
                        <h3 id="s5" class="font-display text-lg font-bold text-ink">Revise antes de enviar</h3>
                        <p class="mt-0.5 text-[13.5px] text-ink-muted">Confira se as informações estão corretas.</p>
                    </div>

                    <div class="overflow-hidden rounded-2xl border border-slate-200">
                        <div class="flex gap-2 overflow-x-auto bg-slate-50 p-3" x-show="photos.length">
                            <template x-for="p in photos" :key="p.id">
                                <img :src="p.url" alt="" class="h-20 w-28 shrink-0 rounded-xl object-cover">
                            </template>
                        </div>
                        <dl class="divide-y divide-slate-100 text-[13.5px]">
                            @foreach ([
                                ['Categoria', 1, 'category && categories[category].label'],
                                ['Título', 2, 'title'],
                                ['Descrição', 2, 'description'],
                                ['Gravidade', 2, 'severities[severity].label'],
                                ['Localização', 4, "address || (coords && `\${coords[0]}, \${coords[1]}`)"],
                            ] as [$label, $goto, $expr])
                                <div class="flex gap-4 px-4 py-3">
                                    <dt class="w-24 shrink-0 text-ink-muted">{{ $label }}</dt>
                                    <dd class="min-w-0 flex-1 whitespace-pre-line break-words font-medium text-ink" x-text="{{ $expr }}"></dd>
                                    <button type="button" @click="goTo({{ $goto }})" class="shrink-0 text-[12.5px] font-semibold text-eco-700 hover:text-eco-900">Editar</button>
                                </div>
                            @endforeach
                        </dl>
                    </div>

                    <div class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900" role="note">
                        <x-eco.icon name="triangle-alert" class="mt-px h-4 w-4 shrink-0 text-amber-600" />
                        <p>Evite incluir informações pessoais ou confrontar pessoas envolvidas na ocorrência.</p>
                    </div>

                    <p x-show="submitError" class="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700" role="alert">
                        <x-eco.icon name="circle-alert" class="mt-px h-4 w-4 shrink-0" />
                        <span x-text="submitError"></span>
                    </p>
                </section>

                {{-- ========== Sucesso ========== --}}
                <section x-cloak x-show="step === 6" x-transition.opacity.duration.300ms class="py-6 text-center" aria-live="polite">
                    <div class="relative mx-auto grid h-20 w-20 place-items-center">
                        <span class="absolute inset-0 animate-radar rounded-full bg-eco-500/30"></span>
                        <span class="relative grid h-20 w-20 place-items-center rounded-full bg-eco-600 text-white shadow-[0_12px_28px_-8px_rgba(22,163,74,.7)]">
                            <x-eco.icon name="check" class="h-9 w-9" />
                        </span>
                    </div>
                    <h3 class="mt-6 font-display text-2xl font-extrabold text-ink">Denúncia enviada!</h3>
                    <p class="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted"
                       x-text="result?.source === 'api' ? 'Sua ocorrência foi registrada no servidor e será analisada pela equipe. Você receberá atualizações sobre o andamento.' : 'Sua ocorrência foi salva neste navegador (modo demonstração). Entre na sua conta para enviar ao servidor.'"></p>
                    <p class="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[12.5px] font-semibold text-ink">
                        Protocolo <span class="font-mono" x-text="result && `#${String(result.apiId || result.id).replace('local-', '').toUpperCase()}`"></span>
                    </p>
                    <div class="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                        <a :href="result && $u.route('report', result.id)" class="btn-primary">Acompanhar denúncia</a>
                        <a :href="result && $u.route('map', { foco: result.id })" class="btn-secondary"><x-eco.icon name="map" class="h-4 w-4" />Ver no mapa</a>
                        <button type="button" class="btn-ghost" @click="restart()">Registrar outra</button>
                    </div>
                </section>
            </div>

            {{-- Navegação do formulário --}}
            <div x-show="step <= 5" class="sticky bottom-20 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-lift backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                <button type="button" @click="back()" class="btn-ghost" :class="step === 1 && 'invisible'">
                    <x-eco.icon name="arrow-left" class="h-4 w-4" />
                    Voltar
                </button>
                <p class="hidden text-[12px] text-slate-400 sm:block" x-show="step < 5">Rascunho salvo automaticamente</p>
                <button type="submit" x-show="step < 5" class="btn-dark">
                    Continuar
                    <x-eco.icon name="arrow-right" class="h-4 w-4" />
                </button>
                <button type="submit" x-show="step === 5" class="btn-report" :disabled="submitting">
                    <x-eco.icon name="loader" class="h-4 w-4 animate-spin" x-show="submitting" />
                    <x-eco.icon name="send" class="h-4 w-4" x-show="!submitting" />
                    <span x-text="submitting ? 'Enviando…' : 'Enviar denúncia'"></span>
                </button>
            </div>
        </form>
    </div>
</x-eco.layout>
