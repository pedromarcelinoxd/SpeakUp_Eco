/**
 * Listagem e detalhes de denúncias.
 */
import { REPORT_CATEGORIES, STATUSES } from '../config';
import { normalize, storage } from '../utils';

const DAY = 86400000;
const PAGE = 12;

export const PERIODS = {
    all: 'Todo o período',
    7: 'Últimos 7 dias',
    30: 'Últimos 30 dias',
    90: 'Últimos 90 dias',
    365: 'Último ano',
};

export function reportsPage() {
    return {
        q: '',
        category: '',
        status: '',
        period: 'all',
        sort: 'recent',
        view: storage.get('reportsView', 'cards'),
        limit: PAGE,
        onlyMine: false,
        categories: REPORT_CATEGORIES,
        statusList: STATUSES,
        periods: PERIODS,

        init() {
            const p = new URLSearchParams(window.location.search);
            if (p.get('status') && STATUSES[p.get('status')]) this.status = p.get('status');
            if (p.get('categoria') && REPORT_CATEGORIES[p.get('categoria')]) this.category = p.get('categoria');
            if (p.get('q')) this.q = p.get('q');
            if (p.get('minhas')) this.onlyMine = true;
            ['q', 'category', 'status', 'period', 'sort', 'onlyMine'].forEach((k) => this.$watch(k, () => { this.limit = PAGE; this.syncUrl(); }));
            this.$watch('view', (v) => storage.set('reportsView', v));
        },

        syncUrl() {
            const p = new URLSearchParams();
            if (this.q) p.set('q', this.q);
            if (this.category) p.set('categoria', this.category);
            if (this.status) p.set('status', this.status);
            if (this.onlyMine) p.set('minhas', '1');
            const qs = p.toString();
            history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
        },

        get filtered() {
            const q = normalize(this.q.trim());
            const min = this.period === 'all' ? 0 : Date.now() - Number(this.period) * DAY;
            const source = this.onlyMine ? this.$store.eco.myReports : this.$store.eco.reports;
            const list = source.filter((r) => (!q || normalize(`${r.title} ${r.neighborhood} ${r.description}`).includes(q))
                && (!this.category || r.category === this.category)
                && (!this.status || r.status === this.status)
                && new Date(r.createdAt).getTime() >= min);
            return this.sort === 'recent' ? list : [...list].reverse();
        },

        get visible() {
            return this.filtered.slice(0, this.limit);
        },

        get hasFilters() {
            return !!(this.q || this.category || this.status || this.period !== 'all' || this.onlyMine);
        },

        statusCount(key) {
            return this.$store.eco.reports.filter((r) => r.status === key).length;
        },

        clear() {
            this.q = '';
            this.category = '';
            this.status = '';
            this.period = 'all';
            this.onlyMine = false;
        },

        open(r) {
            window.location.href = this.$u.route('report', r.id);
        },
    };
}

export function reportDetail(id) {
    return {
        id,
        copied: false,
        photoIndex: 0,
        newStatus: '',
        note: '',
        saving: false,
        confirmDelete: false,
        statusList: STATUSES,

        init() {
            const refresh = () => this.$store.eco.refreshReport(this.id);
            if (this.$store.eco.ready) refresh();
            else this.$watch('$store.eco.ready', refresh);
        },

        get canModerate() {
            return this.r?.source === 'api' && !!this.r.permissions?.alterar_status;
        },

        get canDelete() {
            return this.r?.source === 'api' && !!this.r.permissions?.excluir;
        },

        async saveStatus() {
            if (!this.newStatus || this.newStatus === this.r.status) return;
            this.saving = true;
            try {
                await this.$store.eco.updateReportStatus(this.id, this.newStatus, this.note.trim() || null);
                this.note = '';
            } catch (e) {
                this.$store.eco.toast(e.response?.data?.message || 'Não foi possível atualizar o status.', 'error');
            } finally {
                this.saving = false;
            }
        },

        async remove() {
            try {
                await this.$store.eco.deleteReport(this.id);
                window.location.href = this.$u.route('reports');
            } catch (e) {
                this.$store.eco.toast(e.response?.data?.message || 'Não foi possível excluir.', 'error');
            }
        },

        get r() {
            return this.$store.eco.findReport(this.id);
        },

        get notFound() {
            return this.$store.eco.ready && !this.r;
        },

        get confirmations() {
            if (!this.r) return 0;
            if (this.r.source === 'api') return this.r.confirmations || 0;
            return (this.r.confirmations || 0) + (this.$store.eco.isConfirmed(this.r.id) ? 1 : 0);
        },

        get canConfirm() {
            if (!this.r || this.$store.eco.isConfirmed(this.r.id)) return false;
            if (this.r.source === 'api') return !!this.r.permissions?.confirmar;
            return !['resolvida', 'nao_confirmada'].includes(this.r.status);
        },

        /* Linha do tempo completa: etapas concluídas + próximas etapas previstas */
        get timeline() {
            if (!this.r) return [];
            const done = this.r.history || [];
            if (this.r.status === 'nao_confirmada') return done.map((h) => ({ ...h, done: true }));
            // Próximas etapas do fluxo comunitário (a equipe pode intervir a qualquer momento)
            const flow = ['recebida', 'confirmada', 'resolvida'];
            const doneKeys = done.map((h) => h.status);
            return [
                ...done.map((h) => ({ ...h, done: true })),
                ...flow.filter((k) => !doneKeys.includes(k)).map((k) => ({ status: k, done: false })),
            ];
        },

        get related() {
            if (!this.r) return [];
            return this.$store.eco.reports
                .filter((x) => x.id !== this.r.id && (x.category === this.r.category || x.neighborhood === this.r.neighborhood))
                .slice(0, 3);
        },

        async share() {
            const url = window.location.href;
            try {
                if (navigator.share) {
                    await navigator.share({ title: this.r.title, text: 'Ocorrência ambiental no SpeakUp Eco', url });
                    return;
                }
                await navigator.clipboard.writeText(url);
                this.copied = true;
                this.$store.eco.toast('Link copiado para a área de transferência.', 'success');
                setTimeout(() => { this.copied = false; }, 2000);
            } catch {
                /* compartilhamento cancelado */
            }
        },
    };
}
