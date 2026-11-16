/**
 * Fábrica de mapas Leaflet com a identidade visual do EcoRadar.
 */
import L from 'leaflet';
import 'leaflet.markercluster';
import { MAP_DEFAULTS, STATUSES } from '../config';
import { iconSvg } from '../icons';
import { pointCategory, reportCategory } from '../utils';

export { L };

/* Provedores de mapa gratuitos e sem chave de API */
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

export const DEFAULT_LAYER = 'osm';

export const TILE_LAYERS = {
    osm: {
        label: 'Padrão',
        icon: 'map',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: 'er-tiles-soft',
    },
    light: {
        label: 'Claro',
        icon: 'sun',
        url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
        overlay: `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
        attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap',
        maxNativeZoom: 16,
    },
    streets: {
        label: 'Ruas',
        icon: 'route',
        url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
        attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap',
    },
    satellite: {
        label: 'Satélite',
        icon: 'satellite',
        url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
        overlay: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`,
        attribution: 'Imagens &copy; Esri, Maxar, Earthstar Geographics',
    },
};

export function createMap(el, { center = MAP_DEFAULTS.center, zoom = MAP_DEFAULTS.zoom, layer = DEFAULT_LAYER, interactive = true, customControls = true } = {}) {
    const map = L.map(el, {
        center,
        zoom,
        zoomControl: !customControls && interactive,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        tap: interactive,
        preferCanvas: false,
    });
    if (customControls) el.classList.add('er-map--custom');
    map.attributionControl.setPrefix(false);

    let tiles = [];
    map.setTileLayer = (key) => {
        const cfg = TILE_LAYERS[key] || TILE_LAYERS[DEFAULT_LAYER];
        tiles.forEach((t) => map.removeLayer(t));
        const opts = { maxZoom: 19, maxNativeZoom: cfg.maxNativeZoom || 19, className: cfg.className || '' };
        tiles = [L.tileLayer(cfg.url, { ...opts, attribution: cfg.attribution }).addTo(map)];
        if (cfg.overlay) tiles.push(L.tileLayer(cfg.overlay, opts).addTo(map));
    };
    map.setTileLayer(layer);

    // Corrige tamanho quando o contêiner muda (sidebar recolhida, abas, etc.)
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        ro.observe(el);
    }
    return map;
}

/* ---------------- Ícones dos marcadores ---------------- */
export function reportIcon(report, selected = false) {
    const cat = reportCategory(report.category);
    const st = STATUSES[report.status] || STATUSES.recebida;
    // Cada categoria tem sua cor (a mesma do app e da legenda); encerradas ficam em cinza.
    const closed = ['resolvida', 'nao_confirmada'].includes(report.status);
    const fill = closed ? '#DCE2DC' : cat.color;
    return L.divIcon({
        className: `er-marker${selected ? ' is-selected' : ''}`,
        html: `<div class="er-pin${closed ? ' er-pin--closed' : ''}" style="--c:${fill};--s:${st.color}">
                 <div class="er-pin__body"></div>
                 <div class="er-pin__icon">${iconSvg(cat.icon)}</div>
                 <span class="er-pin__status"></span>
               </div>`,
        iconSize: [34, 42],
        iconAnchor: [17, 40],
        tooltipAnchor: [0, -38],
    });
}

export function pointIcon(point, selected = false) {
    const cat = pointCategory(point.category);
    return L.divIcon({
        className: `er-marker${selected ? ' is-selected' : ''}`,
        html: `<div class="er-badge">${iconSvg(cat.icon)}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        tooltipAnchor: [0, -18],
    });
}

export function userIcon() {
    return L.divIcon({
        className: 'er-marker',
        html: '<div class="er-user"><span class="er-user__pulse"></span><span class="er-user__dot"></span></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

export function dropIcon(color = '#176B56') {
    return L.divIcon({
        className: 'er-marker',
        html: `<svg class="er-drop" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                 <path d="M20 47s16-15.2 16-27A16 16 0 0 0 4 20c0 11.8 16 27 16 27z" fill="${color}" stroke="#fff" stroke-width="3"/>
                 <circle cx="20" cy="20" r="6" fill="#fff"/>
               </svg>`,
        iconSize: [40, 48],
        iconAnchor: [20, 46],
    });
}

export function createCluster(color = '#202A27') {
    return L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 48,
        disableClusteringAtZoom: 17,
        iconCreateFunction(cluster) {
            const n = cluster.getChildCount();
            const size = n < 10 ? 36 : n < 50 ? 42 : 50;
            return L.divIcon({
                className: 'er-cluster',
                html: `<div class="er-cluster__inner" style="--c:${color}">${n}</div>`,
                iconSize: [size, size],
            });
        },
    });
}

export function tooltip(text) {
    return { content: text, opts: { direction: 'top', className: 'er-tooltip', offset: [0, -4] } };
}
