/**
 * Cálculos de indicadores a partir das denúncias carregadas (reais + demo).
 */
import { REPORT_CATEGORIES } from './config';

const DAY = 86400000;

export const OPEN_STATUSES = ['recebida', 'em_analise'];

export function inLastDays(list, days, offsetDays = 0) {
    const end = Date.now() - offsetDays * DAY;
    const start = end - days * DAY;
    return list.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t > start && t <= end;
    });
}

export function pctDelta(curr, prev) {
    if (!prev) return curr ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
}

/** Contagem semanal das últimas N semanas (mais antiga → mais recente). */
export function weeklySeries(list, weeks = 8, predicate = () => true) {
    const out = Array(weeks).fill(0);
    const now = Date.now();
    list.forEach((r) => {
        if (!predicate(r)) return;
        const w = Math.floor((now - new Date(r.createdAt).getTime()) / (7 * DAY));
        if (w >= 0 && w < weeks) out[weeks - 1 - w] += 1;
    });
    return out;
}

export function kpis(reports, points) {
    const last = inLastDays(reports, 30);
    const prev = inLastDays(reports, 30, 30);
    const resolved = reports.filter((r) => r.status === 'resolvida');
    const open = reports.filter((r) => OPEN_STATUSES.includes(r.status));
    const resolvedLast = last.filter((r) => r.status === 'resolvida').length;
    const resolvedPrev = prev.filter((r) => r.status === 'resolvida').length;
    return {
        total: reports.length,
        totalDelta: pctDelta(last.length, prev.length),
        totalSpark: weeklySeries(reports, 10),
        resolved: resolved.length,
        resolvedDelta: pctDelta(resolvedLast, resolvedPrev),
        resolvedSpark: weeklySeries(reports, 10, (r) => r.status === 'resolvida'),
        open: open.length,
        openSpark: weeklySeries(reports, 10, (r) => OPEN_STATUSES.includes(r.status)),
        points: points.length,
        resolutionRate: reports.length ? Math.round((resolved.length / reports.length) * 100) : 0,
    };
}

export function byCategory(reports) {
    return Object.entries(REPORT_CATEGORIES)
        .map(([key, c]) => ({ key, label: c.label, color: c.color, count: reports.filter((r) => r.category === key).length }))
        .sort((a, b) => b.count - a.count);
}

export function byZone(reports) {
    const map = {};
    reports.forEach((r) => {
        const z = r.zone || 'Outros';
        map[z] ??= { zone: z, total: 0, resolved: 0 };
        map[z].total += 1;
        if (r.status === 'resolvida') map[z].resolved += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
}

/** Série mensal (últimos N meses) de registradas e resolvidas. */
export function monthlySeries(reports, months = 12) {
    const now = new Date();
    const buckets = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            key: `${d.getFullYear()}-${d.getMonth()}`,
            label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
            created: 0,
            resolved: 0,
        });
    }
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    reports.forEach((r) => {
        const d = new Date(r.createdAt);
        const i = idx[`${d.getFullYear()}-${d.getMonth()}`];
        if (i === undefined) return;
        buckets[i].created += 1;
        if (r.status === 'resolvida') buckets[i].resolved += 1;
    });
    return buckets;
}

/** Série diária (últimos N dias) para períodos curtos. */
export function dailySeries(reports, days = 30, groupDays = 1) {
    const now = Date.now();
    const n = Math.ceil(days / groupDays);
    const buckets = Array.from({ length: n }, (_, i) => {
        const d = new Date(now - (n - 1 - i) * groupDays * DAY);
        return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''), created: 0, resolved: 0 };
    });
    reports.forEach((r) => {
        const age = Math.floor((now - new Date(r.createdAt).getTime()) / (groupDays * DAY));
        if (age < 0 || age >= n) return;
        const b = buckets[n - 1 - age];
        b.created += 1;
        if (r.status === 'resolvida') b.resolved += 1;
    });
    return buckets;
}

/** Feed de atividades recentes a partir do histórico das denúncias e dos pontos. */
export function activityFeed(reports, points, confirmedIds = [], limit = 8) {
    const events = [];
    reports.slice(0, 60).forEach((r) => {
        (r.history || []).forEach((h) => {
            const type = h.status === 'recebida' ? 'new' : h.status === 'resolvida' ? 'resolved' : 'status';
            events.push({ id: `${r.id}-${h.status}`, type, status: h.status, date: h.date, report: r });
        });
        if (r.confirmations > 3 && r.history?.length) {
            events.push({
                id: `${r.id}-confirm`, type: 'confirm', date: new Date(new Date(r.createdAt).getTime() + 3 * 3600000).toISOString(),
                report: r, count: r.confirmations,
            });
        }
        if (confirmedIds.includes(r.id)) {
            events.push({ id: `${r.id}-me-confirm`, type: 'confirm', date: new Date().toISOString(), report: r, count: 1, mine: true });
        }
    });
    points.forEach((p) => {
        if (p.addedAt) events.push({ id: `${p.id}-added`, type: 'point', date: p.addedAt, point: p });
    });
    return events
        .filter((e) => new Date(e.date).getTime() <= Date.now())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}
