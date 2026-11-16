/**
 * Catálogo e detalhes de pontos de descarte.
 */
import { POINT_CATEGORIES } from '../config';
import { createCluster, createMap, L, pointIcon, userIcon } from '../map/base';
import { geocode } from '../services/api';
import { normalize } from '../utils';

export function pointsPage() {
    let map = null;
    let layer = null;
    let originMarker = null;

    return {
        material: '',
        place: '',
        placeLabel: '',
        searchingPlace: false,
        placeError: '',
        category: '',
        sort: 'distance',
        view: 'list',
        categories: POINT_CATEGORIES,

        init() {
            const p = new URLSearchParams(window.location.search);
            if (p.get('categoria') && POINT_CATEGORIES[p.get('categoria')]) this.category = p.get('categoria');
            if (p.get('material')) this.material = p.get('material');
            this.$watch('view', (v) => { if (v === 'map') this.$nextTick(() => this.setupMap()); });
            ['material', 'category', '$store.eco.ready', '$store.eco.location'].forEach((k) => this.$watch(k, () => this.renderMap()));
        },

        destroy() {
            map?.remove();
        },

        get filtered() {
            const q = normalize(this.material.trim());
            const list = this.$store.eco.points
                .filter((p) => (!this.category || p.category === this.category)
                    && (!q || normalize(`${p.name} ${p.materials.join(' ')} ${POINT_CATEGORIES[p.category]?.label}`).includes(q)))
                .map((p) => ({ ...p, distance: this.$store.eco.distanceTo(p.coords) }));
            return this.sort === 'distance'
                ? list.sort((a, b) => a.distance - b.distance)
                : list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        },

        countFor(key) {
            return this.$store.eco.points.filter((p) => p.category === key).length;
        },

        async useMyLocation() {
            this.searchingPlace = true;
            this.placeError = '';
            try {
                await this.$store.eco.locate();
                this.placeLabel = 'Sua localização atual';
                this.place = '';
                this.sort = 'distance';
            } catch (e) {
                this.placeError = e.message;
            } finally {
                this.searchingPlace = false;
            }
        },

        async searchPlace() {
            const q = this.place.trim();
            if (q.length < 3) { this.placeError = 'Digite um endereço ou bairro.'; return; }
            this.searchingPlace = true;
            this.placeError = '';
            try {
                const [first] = await geocode(q.toLowerCase().includes('sorocaba') ? q : `${q}, Sorocaba`);
                if (!first) { this.placeError = 'Endereço não encontrado.'; return; }
                // Usa o local pesquisado como referência de distância
                this.$store.eco.location = first.coords;
                this.placeLabel = first.label.split(',').slice(0, 2).join(',');
                this.sort = 'distance';
            } catch {
                this.placeError = 'Não foi possível buscar o endereço agora.';
            } finally {
                this.searchingPlace = false;
            }
        },

        clear() {
            this.material = '';
            this.category = '';
        },

        setupMap() {
            if (map) { map.invalidateSize(); this.renderMap(); return; }
            map = createMap(this.$refs.map, { layer: this.$store.eco.settings.mapLayer, customControls: false });
            layer = createCluster('#176B56').addTo(map);
            this.renderMap(true);
        },

        renderMap(fit = false) {
            if (!layer) return;
            layer.clearLayers();
            this.filtered.forEach((p) => {
                const m = L.marker(p.coords, { icon: pointIcon(p), title: p.name });
                m.bindPopup(`<div style="min-width:180px"><strong style="font-size:13px">${p.name.replace(/</g, '&lt;')}</strong><br><span style="color:#64748B;font-size:12px">${p.hours}</span><br><a href="${this.$u.route('point', p.id)}" style="color:#15803D;font-weight:600;font-size:12px">Ver detalhes →</a></div>`);
                layer.addLayer(m);
            });
            if (originMarker) map.removeLayer(originMarker);
            if (this.$store.eco.location) {
                originMarker = L.marker(this.$store.eco.location, { icon: userIcon(), interactive: false }).addTo(map);
            }
            if (fit && this.filtered.length) map.fitBounds(L.latLngBounds(this.filtered.map((p) => p.coords)).pad(0.1));
        },
    };
}

export function pointDetail(id) {
    return {
        id,
        get p() {
            return this.$store.eco.findPoint(this.id);
        },
        get notFound() {
            return this.$store.eco.ready && !this.p;
        },
        get nearby() {
            if (!this.p) return [];
            return this.$store.eco.points
                .filter((x) => x.id !== this.p.id)
                .map((x) => ({ ...x, d: this.$store.eco.distanceTo(x.coords) }))
                .sort((a, b) => (a.category === this.p.category ? -1 : 0) - (b.category === this.p.category ? -1 : 0) || a.d - b.d)
                .slice(0, 4);
        },
    };
}
