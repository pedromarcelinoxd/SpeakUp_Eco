import { activityFeed, kpis } from '../analytics';
import { greeting } from '../utils';

// Cores com função, as mesmas do app: coral = denúncia aberta, folha = resolvido/descarte.
const ACTIVITY_META = {
    new: { icon: 'megaphone', color: '#A9472B', label: 'Nova denúncia' },
    resolved: { icon: 'circle-check', color: '#16A34A', label: 'Resolvida' },
    status: { icon: 'refresh', color: '#B45309', label: 'Status atualizado' },
    confirm: { icon: 'thumbs-up', color: '#2563EB', label: 'Confirmação' },
    point: { icon: 'map-pinned', color: '#176B56', label: 'Novo ponto de descarte' },
};

export default () => ({
    greeting: greeting(),

    get store() {
        return this.$store.eco;
    },

    get k() {
        return kpis(this.store.reports, this.store.points);
    },

    /** Quanto de cada número vem dos dados demonstrativos (exibido sob cada número). */
    get kDemo() {
        return kpis(this.store.reports.filter((r) => r.source === 'demo'), this.store.points.filter((p) => p.source === 'demo'));
    },

    deltaText(v) {
        return `${v > 0 ? '+' : ''}${v}% em 30 dias`;
    },

    /** Faixa de calçadão: 36 pedras (18 colunas × 2), preenchidas coluna a coluna. */
    stoneClass(i) {
        const col = i % 18;
        const row = Math.floor(i / 18);
        const order = col * 2 + row;
        const filled = Math.round((this.store.level.progress / 100) * 36);
        if (order < filled) return 'bg-eco-600';
        // Onda em duas cores do calçadão: pedra escura serpenteando entre as fileiras (desenho, não dado)
        return Math.floor(col / 3) % 2 === row ? 'bg-stone-dark' : 'bg-stone';
    },

    get activities() {
        return activityFeed(this.store.reports, this.store.points, this.store.confirmed, 7);
    },

    meta(a) {
        return ACTIVITY_META[a.type];
    },

    activityText(a) {
        if (a.type === 'point') return a.point.name;
        return a.report.title;
    },

    activityDetail(a) {
        if (a.type === 'point') return `${a.point.neighborhood} · ${this.$u.pointCategory(a.point.category).label}`;
        if (a.type === 'status') return `${a.report.neighborhood} · agora “${this.$u.status(a.status).label}”`;
        if (a.type === 'confirm') return a.mine ? 'Você confirmou esta ocorrência' : `${a.count} moradores confirmaram`;
        return `${a.report.neighborhood} · ${this.$u.reportCategory(a.report.category).label}`;
    },

    activityUrl(a) {
        return a.type === 'point' ? this.$u.route('point', a.point.id) : this.$u.route('report', a.report.id);
    },

    get nearby() {
        return this.store.reports
            .filter((r) => ['recebida', 'em_analise', 'verificada'].includes(r.status))
            .map((r) => ({ ...r, distance: this.store.distanceTo(r.coords) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
    },
});
