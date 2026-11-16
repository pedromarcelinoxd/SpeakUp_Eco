/**
 * Ranking, perfil, notificações, configurações e autenticação.
 */
import { api, apiError } from '../services/api';
import { levelFor, storage } from '../utils';
import { route } from '../store';

export function rankingPage() {
    return {
        period: 'weekly', // weekly | monthly | total

        init() {
            this.$store.eco.loadRanking().catch(() => {});
            this.$watch('$store.eco.ready', () => this.$store.eco.loadRanking().catch(() => {}));
        },

        get list() {
            const key = this.period === 'weekly' ? 'weekly' : this.period === 'monthly' ? 'monthly' : 'total';
            return [...this.$store.eco.ranking]
                .map((u) => ({ ...u, score: u[key] || 0, level: levelFor(u.total) }))
                .sort((a, b) => b.score - a.score)
                .map((u, i) => ({ ...u, position: i + 1 }));
        },

        get podium() {
            const [first, second, third] = this.list;
            return [second, first, third].filter(Boolean);
        },

        get me() {
            return this.list.find((u) => u.me);
        },

        get rest() {
            return this.list.slice(3);
        },

        get periodLabel() {
            return { weekly: 'nesta semana', monthly: 'neste mês', total: 'no total' }[this.period];
        },
    };
}

export function profilePage() {
    return {
        editing: false,
        saving: false,
        form: { name: '', email: '', telefone: '', bairro: '' },
        photo: null,
        photoPreview: null,
        errors: '',
        tab: 'todas',

        openEdit() {
            const u = this.$store.eco.user;
            this.form = { name: u.fullName || u.name, email: u.email, telefone: u.telefone || '', bairro: u.bairro || '' };
            this.photo = null;
            this.photoPreview = null;
            this.errors = '';
            this.editing = true;
        },

        pickPhoto(file) {
            if (!file) return;
            if (!['image/jpeg', 'image/png'].includes(file.type)) { this.errors = 'A foto deve ser JPG ou PNG.'; return; }
            if (file.size > 5 * 1024 * 1024) { this.errors = 'A foto deve ter no máximo 5 MB.'; return; }
            this.errors = '';
            this.photo = file;
            this.photoPreview = URL.createObjectURL(file);
        },

        async save() {
            if (this.form.name.trim().length < 2) { this.errors = 'Informe seu nome.'; return; }
            if (!/^\S+@\S+\.\S+$/.test(this.form.email)) { this.errors = 'Informe um e-mail válido.'; return; }
            this.saving = true;
            this.errors = '';
            try {
                await this.$store.eco.updateProfile({ ...this.form, foto: this.photo ? window.Alpine.raw(this.photo) : null });
                this.editing = false;
                this.$store.eco.toast('Perfil atualizado com sucesso.', 'success');
            } catch (e) {
                this.errors = e.response ? apiError(e) : e.message;
            } finally {
                this.saving = false;
            }
        },

        get reports() {
            const list = this.$store.eco.myReports;
            if (this.tab === 'abertas') return list.filter((r) => ['recebida', 'em_analise', 'verificada'].includes(r.status));
            if (this.tab === 'resolvidas') return list.filter((r) => r.status === 'resolvida');
            return list;
        },
    };
}

export function notificationsPage() {
    return {
        filter: 'all',
        get list() {
            const all = this.$store.eco.notifications;
            return this.filter === 'unread' ? all.filter((n) => !n.read) : all;
        },
        groupLabel(n) {
            const days = Math.floor((Date.now() - new Date(n.date).getTime()) / 86400000);
            if (days < 1) return 'Hoje';
            if (days < 7) return 'Esta semana';
            return 'Anteriores';
        },
        get groups() {
            const out = [];
            this.list.forEach((n) => {
                const label = this.groupLabel(n);
                let g = out.find((x) => x.label === label);
                if (!g) { g = { label, items: [] }; out.push(g); }
                g.items.push(n);
            });
            return out;
        },
    };
}

export function settingsPage() {
    return {
        checking: false,
        latency: null,
        confirmClear: false,

        async check() {
            this.checking = true;
            try {
                this.latency = await api.ping();
                this.$store.eco.apiOnline = true;
            } catch {
                this.latency = null;
                this.$store.eco.apiOnline = false;
            } finally {
                this.checking = false;
            }
        },

        toggleDemo() {
            const on = !this.$store.eco.settings.showDemo;
            this.$store.eco.setSetting('demoOptIn', on);
            this.$store.eco.setSetting('showDemo', on);
            this.$store.eco.toast(on ? 'Dados demonstrativos (fictícios) ativados.' : 'Exibindo apenas dados reais do servidor.', 'info');
        },

        clearLocal() {
            ['localReports', 'confirmed', 'readNotifications', 'extraNotifications', 'reportDraft', 'lastLocation'].forEach((k) => storage.remove(k));
            this.$store.eco.toast('Dados locais apagados. Recarregando…', 'success');
            setTimeout(() => window.location.reload(), 900);
        },

        init() {
            this.check();
        },
    };
}

export function authPage() {
    return {
        mode: new URLSearchParams(window.location.search).get('modo') === 'cadastro' ? 'register' : 'login',
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        showPassword: false,
        loading: false,
        error: '',

        async submit() {
            this.error = '';
            if (!/^\S+@\S+\.\S+$/.test(this.email)) { this.error = 'Informe um e-mail válido.'; return; }
            if (this.mode === 'register') {
                if (this.name.trim().length < 2) { this.error = 'Informe seu nome.'; return; }
                if (this.password.length < 8) { this.error = 'A senha deve ter pelo menos 8 caracteres.'; return; }
                if (this.password !== this.passwordConfirmation) { this.error = 'As senhas não coincidem.'; return; }
            } else if (!this.password) {
                this.error = 'Informe sua senha.';
                return;
            }
            this.loading = true;
            try {
                if (this.mode === 'register') {
                    await this.$store.eco.register({
                        name: this.name.trim(), email: this.email.trim(), password: this.password, password_confirmation: this.passwordConfirmation,
                    });
                } else {
                    await this.$store.eco.login(this.email.trim(), this.password);
                }
                const back = new URLSearchParams(window.location.search).get('voltar');
                window.location.href = back && /^\/app(\/[\w\-/]*)?$/.test(back) ? back : route('dashboard');
            } catch (e) {
                this.error = apiError(e);
            } finally {
                this.loading = false;
            }
        },

        continueDemo() {
            window.location.href = route('dashboard');
        },
    };
}
