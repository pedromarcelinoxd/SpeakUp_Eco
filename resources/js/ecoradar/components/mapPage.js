/**
 * Mapa ambiental — página principal do SpeakUp Eco.
 * Leaflet (todos os ícones visíveis, sem agrupamento), filtros por categoria/status/período,
 * pesquisa local + endereço (Nominatim), painel de detalhes.
 */
import { POINT_CATEGORIES, REPORT_CATEGORIES, STATUSES } from '../config';
import { createCluster, createMap, dropIcon, L, pointIcon, reportIcon, TILE_LAYERS, userIcon } from '../map/base';
import { geocode } from '../services/api';
import { debounce, normalize } from '../utils';

const DAY = 86400000;

export default () => {
    // Objetos Leaflet fora do estado reativo
    let map = null;
    let cluster = null;
    let userMarker = null;
    let searchMarker = null;
    const markers = new Map();

    return {
        mode: 'all', // all | reports | points
        reportCats: Object.keys(REPORT_CATEGORIES),
        pointCats: Object.keys(POINT_CATEGORIES),
        statuses: Object.keys(STATUSES),
        period: '90',
        panel: null, // null | 'filters' | 'detail'
        selected: null, // { kind: 'report'|'point', item }
        query: '',
        searchOpen: false,
        addressResults: [],
        searchingAddress: false,
        addressError: '',
        layerMenu: false,
        legendOpen: true,
        locating: false,
        layers: TILE_LAYERS,
        reportCategories: REPORT_CATEGORIES,
        pointCategories: POINT_CATEGORIES,
        statusList: STATUSES,

        init() {
            const params = new URLSearchParams(window.location.search);
            if (['reports', 'points'].includes(params.get('tipo'))) this.mode = params.get('tipo');
            const cat = params.get('categoria');
            if (cat && POINT_CATEGORIES[cat]) { this.mode = 'points'; this.pointCats = [cat]; }
            if (cat && REPORT_CATEGORIES[cat] && !POINT_CATEGORIES[cat]) { this.mode = 'reports'; this.reportCats = [cat]; }
            this.legendOpen = window.innerWidth >= 1024;

            this.$nextTick(() => {
                map = createMap(this.$refs.map, { layer: this.$store.eco.settings.mapLayer });
                cluster = createCluster().addTo(map);
                map.on('click', () => { this.searchOpen = false; this.layerMenu = false; });
                this.render();

                if (this.$store.eco.location) this.placeUser(this.$store.eco.location, false);

                const focus = params.get('foco');
                if (focus) this.$watch('$store.eco.ready', () => this.focusById(focus));
                if (focus && this.$store.eco.ready) this.focusById(focus);
            });

            ['mode', 'reportCats', 'pointCats', 'statuses', 'period', '$store.eco.ready', '$store.eco.settings.showDemo']
                .forEach((key) => this.$watch(key, () => this.render()));
            this.$watch('query', debounce(() => { this.addressResults = []; this.addressError = ''; }, 150));
        },

        destroy() {
            map?.remove();
        },

        /* ---------------- Dados filtrados ---------------- */
        get visibleReports() {
            if (this.mode === 'points') return [];
            const minDate = this.period === 'all' ? 0 : Date.now() - Number(this.period) * DAY;
            return this.$store.eco.reports.filter((r) => this.reportCats.includes(r.category)
                && this.statuses.includes(r.status)
                && (new Date(r.createdAt).getTime() >= minDate || r.source !== 'demo'));
        },

        get visiblePoints() {
            if (this.mode === 'reports') return [];
            return this.$store.eco.points.filter((p) => this.pointCats.includes(p.category));
        },

        get visibleCount() {
            return this.visibleReports.length + this.visiblePoints.length;
        },

        get activeFilterCount() {
            let n = 0;
            if (this.reportCats.length !== Object.keys(REPORT_CATEGORIES).length) n++;
            if (this.pointCats.length !== Object.keys(POINT_CATEGORIES).length) n++;
            if (this.statuses.length !== Object.keys(STATUSES).length) n++;
            if (this.period !== '90') n++;
            return n;
        },

        countFor(kind, key) {
            if (kind === 'report') return this.$store.eco.reports.filter((r) => r.category === key).length;
            return this.$store.eco.points.filter((p) => p.category === key).length;
        },

        toggle(listName, key) {
            const list = this[listName];
            this[listName] = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
        },

        setAll(listName, on) {
            const all = { reportCats: REPORT_CATEGORIES, pointCats: POINT_CATEGORIES, statuses: STATUSES }[listName];
            this[listName] = on ? Object.keys(all) : [];
        },

        resetFilters() {
            this.mode = 'all';
            this.setAll('reportCats', true);
            this.setAll('pointCats', true);
            this.setAll('statuses', true);
            this.period = '90';
        },

        /** Atalho dos chips: mostra só uma categoria (ou volta a todas). */
        quickCategory(kind, key) {
            if (kind === 'report') {
                const only = this.mode === 'reports' && this.reportCats.length === 1 && this.reportCats[0] === key;
                this.mode = only ? 'all' : 'reports';
                this.reportCats = only ? Object.keys(REPORT_CATEGORIES) : [key];
            } else {
                const only = this.mode === 'points' && this.pointCats.length === 1 && this.pointCats[0] === key;
                this.mode = only ? 'all' : 'points';
                this.pointCats = only ? Object.keys(POINT_CATEGORIES) : [key];
            }
        },

        isQuickActive(kind, key) {
            return kind === 'report'
                ? this.mode === 'reports' && this.reportCats.length === 1 && this.reportCats[0] === key
                : this.mode === 'points' && this.pointCats.length === 1 && this.pointCats[0] === key;
        },

        /* ---------------- Renderização dos marcadores ---------------- */
        render() {
            if (!cluster) return;
            cluster.clearLayers();
            markers.clear();
            const add = (kind, item) => {
                const selected = this.selected?.item.id === item.id;
                const icon = kind === 'report' ? reportIcon(item, selected) : pointIcon(item, selected);
                const m = L.marker(item.coords, { icon, title: kind === 'report' ? item.title : item.name, riseOnHover: true });
                m.bindTooltip(kind === 'report' ? item.title : item.name, { direction: 'top', className: 'er-tooltip', offset: [0, -30] });
                m.on('click', () => this.select(kind, item));
                markers.set(item.id, { marker: m, kind, item });
                cluster.addLayer(m);
            };
            this.visibleReports.forEach((r) => add('report', r));
            this.visiblePoints.forEach((p) => add('point', p));
        },

        refreshIcon(id, selected) {
            const entry = markers.get(id);
            if (!entry) return;
            entry.marker.setIcon(entry.kind === 'report' ? reportIcon(entry.item, selected) : pointIcon(entry.item, selected));
        },

        select(kind, item, fly = true) {
            if (this.selected) this.refreshIcon(this.selected.item.id, false);
            this.selected = { kind, item };
            this.panel = 'detail';
            this.searchOpen = false;
            this.refreshIcon(item.id, true);
            if (fly) {
                const entry = markers.get(item.id);
                const target = item.coords;
                const zoom = Math.max(map.getZoom(), 16);
                if (entry) {
                    cluster.zoomToShowLayer(entry.marker, () => this.panTo(target, zoom));
                } else {
                    this.panTo(target, zoom);
                }
            }
        },

        /* Centraliza deixando espaço para o painel (esquerda no desktop, embaixo no mobile) */
        panTo(coords, zoom) {
            const desktop = window.innerWidth >= 1024;
            const offset = desktop ? [-200, 0] : [0, 140];
            const point = map.project(coords, zoom).add(L.point(offset[0], offset[1]));
            map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
        },

        closePanel() {
            if (this.selected) this.refreshIcon(this.selected.item.id, false);
            this.selected = null;
            this.panel = null;
        },

        focusById(id) {
            const report = this.$store.eco.findReport(id);
            const point = report ? null : this.$store.eco.findPoint(id);
            if (report) {
                if (!this.visibleReports.some((r) => r.id === id)) { this.period = 'all'; this.mode = 'all'; }
                this.$nextTick(() => this.select('report', report));
            } else if (point) {
                this.$nextTick(() => this.select('point', point));
            }
        },

        /* ---------------- Pesquisa ---------------- */
        get suggestions() {
            const q = normalize(this.query.trim());
            if (q.length < 2) return { categories: [], items: [] };
            const categories = [
                ...Object.entries(REPORT_CATEGORIES).filter(([, c]) => normalize(c.label).includes(q)).map(([key, c]) => ({ kind: 'report', key, ...c })),
                ...Object.entries(POINT_CATEGORIES).filter(([, c]) => normalize(c.label).includes(q) || normalize(c.short).includes(q)).map(([key, c]) => ({ kind: 'point', key, ...c })),
            ].slice(0, 3);
            const items = [
                ...this.$store.eco.points
                    .filter((p) => normalize(`${p.name} ${p.neighborhood} ${p.materials.join(' ')}`).includes(q))
                    .map((p) => ({ kind: 'point', item: p, title: p.name, sub: `${POINT_CATEGORIES[p.category]?.label} · ${p.neighborhood}` })),
                ...this.$store.eco.reports
                    .filter((r) => normalize(`${r.title} ${r.neighborhood}`).includes(q))
                    .slice(0, 20)
                    .map((r) => ({ kind: 'report', item: r, title: r.title, sub: `${REPORT_CATEGORIES[r.category]?.label} · ${r.neighborhood}` })),
            ].slice(0, 6);
            return { categories, items };
        },

        pickSuggestion(s) {
            this.query = s.title;
            this.select(s.kind, s.item);
        },

        pickCategory(c) {
            this.quickCategory(c.kind, c.key);
            this.query = '';
            this.searchOpen = false;
        },

        async searchAddress() {
            const q = this.query.trim();
            if (q.length < 3) return;
            this.searchingAddress = true;
            this.addressError = '';
            try {
                this.addressResults = await geocode(q.toLowerCase().includes('sorocaba') ? q : `${q}, Sorocaba`);
                if (!this.addressResults.length) this.addressError = 'Nenhum endereço encontrado.';
            } catch {
                this.addressError = 'Não foi possível buscar endereços agora. Verifique sua conexão.';
            } finally {
                this.searchingAddress = false;
            }
        },

        goToAddress(a) {
            this.searchOpen = false;
            this.query = a.label.split(',').slice(0, 2).join(',');
            if (searchMarker) map.removeLayer(searchMarker);
            searchMarker = L.marker(a.coords, { icon: dropIcon('#202A27') })
                .bindTooltip(a.label.split(',')[0], { direction: 'top', className: 'er-tooltip', offset: [0, -40], permanent: false })
                .addTo(map);
            map.flyTo(a.coords, 16, { duration: 0.8 });
        },

        clearSearch() {
            this.query = '';
            this.addressResults = [];
            if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
        },

        /* ---------------- Controles ---------------- */
        zoomIn() { map.zoomIn(); },
        zoomOut() { map.zoomOut(); },

        fitAll() {
            const all = [...this.visibleReports, ...this.visiblePoints].map((i) => i.coords);
            if (all.length) map.flyToBounds(L.latLngBounds(all).pad(0.1), { duration: 0.8 });
        },

        setLayer(key) {
            map.setTileLayer(key);
            this.$store.eco.setSetting('mapLayer', key);
            this.layerMenu = false;
        },

        placeUser(coords, fly = true) {
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker(coords, { icon: userIcon(), interactive: false, zIndexOffset: 900 }).addTo(map);
            if (fly) map.flyTo(coords, 15, { duration: 0.8 });
        },

        async locate() {
            this.locating = true;
            try {
                const coords = await this.$store.eco.locate();
                this.placeUser(coords);
            } catch (e) {
                this.$store.eco.toast(e.message, 'warning');
            } finally {
                this.locating = false;
            }
        },

        distance(item) {
            return this.$u.formatDistance(this.$store.eco.distanceTo(item.coords));
        },
    };
};
