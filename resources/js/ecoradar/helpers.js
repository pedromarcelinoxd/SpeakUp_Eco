/**
 * Funções disponíveis nos templates Blade via a mágica Alpine `$u`.
 * Ex.: <span x-text="$u.timeAgo(r.createdAt)"></span>
 */
import { POINT_CATEGORIES, REPORT_CATEGORIES, SEVERITIES, STATUSES, LEVELS, SCORE_RULES } from './config';
import { route } from './store';
import {
    avatarColor, directionsUrl, formatDate, formatDateTime, formatDistance, formatNumber, formatPercent,
    initials, levelFor, placeholderPhoto, pointCategory, reportCategory, status, timeAgo,
} from './utils';

const photoCache = new Map();

export const helpers = {
    timeAgo,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercent,
    formatDistance,
    initials,
    avatarColor,
    directionsUrl,
    levelFor,
    route,
    reportCategory,
    pointCategory,
    status,
    severity: (k) => SEVERITIES[k] || SEVERITIES.media,
    REPORT_CATEGORIES,
    POINT_CATEGORIES,
    STATUSES,
    SEVERITIES,
    LEVELS,
    SCORE_RULES,

    /** Primeira foto real ou imagem ilustrativa (identificada como tal). */
    photo(r) {
        if (r?.photos?.length) return r.photos[0];
        const key = `${r?.category}-${r?.seed ?? 1}`;
        if (!photoCache.has(key)) photoCache.set(key, placeholderPhoto(r?.category, r?.seed ?? 1));
        return photoCache.get(key);
    },

    hasRealPhoto(r) {
        return !!r?.photos?.length;
    },

    sourceLabel(item) {
        return { api: 'Dados reais', local: 'Salvo neste dispositivo', demo: 'Demonstração' }[item?.source] || '';
    },

    /** Caminho SVG de um mini-gráfico (sparkline). */
    sparkPath(values = [], w = 96, h = 40, area = false) {
        if (!values.length) return '';
        const max = Math.max(...values, 1);
        const min = Math.min(...values, 0);
        const step = w / Math.max(values.length - 1, 1);
        const y = (v) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
        const pts = values.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`);
        const line = `M${pts.join(' L')}`;
        return area ? `${line} L${w},${h} L0,${h} Z` : line;
    },

    /** Estilo inline para "pílulas" coloridas por categoria */
    tint(color, alpha = 0.12) {
        const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `background:${color}${a};color:${color}`;
    },
};
