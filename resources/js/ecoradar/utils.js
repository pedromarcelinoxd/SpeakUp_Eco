import { LEVELS, REPORT_CATEGORIES, POINT_CATEGORIES, STATUSES } from './config';
import { iconSvg } from './icons';

/* ---------------- Datas ---------------- */
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function timeAgo(date) {
    const d = new Date(date);
    const diff = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return 'agora mesmo';
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
    return rtf.format(Math.round(diff / (86400 * 365)), 'year');
}

export function formatDate(date, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
    return new Date(date).toLocaleDateString('pt-BR', opts).replace('.', '');
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).replace('.', '');
}

export function greeting(date = new Date()) {
    const h = date.getHours();
    if (h < 5) return 'Boa noite';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

/* ---------------- Números ---------------- */
const nf = new Intl.NumberFormat('pt-BR');
export const formatNumber = (n) => nf.format(Math.round(n ?? 0));

export function formatPercent(n, digits = 0) {
    return `${(n ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`;
}

/* ---------------- Geografia ---------------- */
export function distanceKm([lat1, lon1], [lat2, lon2]) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
    if (km == null || Number.isNaN(km)) return '—';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function directionsUrl([lat, lng]) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/* ---------------- Gamificação ---------------- */
export function levelFor(points = 0) {
    let idx = 0;
    LEVELS.forEach((l, i) => { if (points >= l.min) idx = i; });
    const current = LEVELS[idx];
    const next = LEVELS[idx + 1] || null;
    const progress = next ? ((points - current.min) / (next.min - current.min)) * 100 : 100;
    return {
        ...current,
        index: idx,
        next,
        progress: Math.max(0, Math.min(100, progress)),
        remaining: next ? next.min - points : 0,
    };
}

/* ---------------- Dicionários ---------------- */
export const reportCategory = (k) => REPORT_CATEGORIES[k] || REPORT_CATEGORIES.outros;
export const pointCategory = (k) => POINT_CATEGORIES[k] || POINT_CATEGORIES.outros;
export const status = (k) => STATUSES[k] || STATUSES.recebida;

export function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

/* Cor de avatar estável a partir do nome */
// Avatares nos tons de verde-petróleo da marca.
const AVATAR_COLORS = ['#176B56', '#125847', '#0F4A3B', '#3E8C74'];
export function avatarColor(name = '') {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/**
 * Imagem ilustrativa (SVG) para ocorrências sem fotografia real.
 * Deixa claro que NÃO é uma foto do local.
 */
export function placeholderPhoto(categoryKey, seed = 1) {
    const cat = reportCategory(categoryKey);
    const c = cat.color;
    const icon = iconSvg(cat.icon, '', { x: 276, y: 118, width: 48, height: 48, stroke: c, 'stroke-width': 1.6 });
    const r = (n) => ((seed * 9301 + n * 49297) % 233280) / 233280;
    const stones = [0, 1, 2, 3].map((i) => `<circle cx="${Math.round(r(i) * 600)}" cy="${Math.round(r(i + 7) * 300)}" r="${80 + Math.round(r(i + 3) * 90)}" fill="#DCE2DC" opacity="${(0.35 + r(i + 5) * 0.3).toFixed(2)}"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
<rect width="600" height="300" fill="#ECEEE8"/>${stones}
<circle cx="300" cy="142" r="52" fill="#FFFFFF"/>${icon}
<text x="300" y="232" text-anchor="middle" font-family="Archivo, sans-serif" font-size="13" font-weight="600" fill="#65726C" letter-spacing="1.5">IMAGEM ILUSTRATIVA</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function debounce(fn, ms = 250) {
    let t;
    return function debounced(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
    };
}

export function normalize(str = '') {
    return str.toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ---------------- Armazenamento local seguro ---------------- */
export const storage = {
    get(key, fallback = null) {
        try {
            const v = localStorage.getItem(`ecoradar:${key}`);
            return v === null ? fallback : JSON.parse(v);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(`ecoradar:${key}`, JSON.stringify(value));
        } catch {
            /* modo privado / armazenamento bloqueado */
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(`ecoradar:${key}`);
        } catch {
            /* ignore */
        }
    },
};
