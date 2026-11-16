/**
 * Fluxo de cadastro de denúncia em 5 etapas.
 * Com login: envia para POST /api/denuncias (formato do StoreDenunciaRequest).
 * Sem login: salva apenas neste navegador (modo demonstração).
 */
import { CAMPUS_POINTS, REPORT_CATEGORIES, SEVERITIES } from '../config';
import { createMap, dropIcon, L } from '../map/base';
import { apiError, reverseGeocode, mapApiReport } from '../services/api';
import { debounce, distanceKm, storage } from '../utils';

const raw = (x) => (window.Alpine ? window.Alpine.raw(x) : x);
const MAX_PHOTOS = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — mesmo limite do backend
const ACCEPTED = ['image/jpeg', 'image/png']; // mimes:jpeg,png,jpg no backend

export const STEPS = [
    { key: 'categoria', label: 'Categoria', icon: 'layout-grid' },
    { key: 'informacoes', label: 'Informações', icon: 'pencil' },
    { key: 'fotos', label: 'Fotografias', icon: 'camera' },
    { key: 'local', label: 'Localização', icon: 'map-pin' },
    { key: 'revisao', label: 'Revisão', icon: 'check-check' },
];

export default () => {
    let map = null;
    let marker = null;

    return {
        steps: STEPS,
        step: 1,
        categories: REPORT_CATEGORIES,
        severities: SEVERITIES,
        campusPoints: CAMPUS_POINTS,
        category: '',
        title: '',
        description: '',
        severity: 'media',
        photos: [],
        dragging: false,
        coords: null,
        address: '',
        neighborhood: '',
        campusPoint: '',
        locating: false,
        errors: {},
        submitting: false,
        submitError: '',
        duplicate: null,
        result: null,

        init() {
            const draft = storage.get('reportDraft');
            if (draft) Object.assign(this, draft);
            const p = new URLSearchParams(window.location.search);
            if (p.get('categoria') && REPORT_CATEGORIES[p.get('categoria')]) this.category = p.get('categoria');
            const save = debounce(() => storage.set('reportDraft', {
                category: this.category, title: this.title, description: this.description, severity: this.severity,
            }), 400);
            ['category', 'title', 'description', 'severity'].forEach((k) => this.$watch(k, save));
            this.$watch('step', (s) => {
                if (s === 4) this.$nextTick(() => this.setupMap());
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },

        destroy() {
            map?.remove();
            this.photos.forEach((p) => URL.revokeObjectURL(p.url));
        },

        get progress() {
            return ((Math.min(this.step, 5) - 1) / 4) * 100;
        },

        /** Sempre envia ao servidor (com ou sem conta). */
        get usesApi() {
            return true;
        },

        /* ---------------- Validação ---------------- */
        validate(step = this.step) {
            const e = {};
            if (step === 1 && !this.category) e.category = 'Escolha a categoria que melhor descreve o problema.';
            if (step === 2) {
                if (this.title.trim().length < 5) e.title = 'O título deve ter pelo menos 5 caracteres.';
                if (this.title.trim().length > 120) e.title = 'O título deve ter no máximo 120 caracteres.';
                if (this.description.trim().length < 15) e.description = 'Descreva com pelo menos 15 caracteres o que você observou.';
                if (this.description.trim().length > 800) e.description = 'A descrição deve ter no máximo 800 caracteres.';
            }
            if (step === 3 && !this.photos.length) e.photos = 'Adicione pelo menos uma fotografia da ocorrência.';
            if (step === 4) {
                if (!this.coords) e.coords = 'Marque o local da ocorrência no mapa ou use sua localização atual.';
            }
            this.errors = e;
            return !Object.keys(e).length;
        },

        next() {
            if (!this.validate()) return;
            this.step = Math.min(5, this.step + 1);
        },

        back() {
            this.errors = {};
            this.step = Math.max(1, this.step - 1);
        },

        goTo(n) {
            // Só permite avançar se as etapas anteriores forem válidas
            for (let s = 1; s < n; s++) {
                if (!this.validate(s)) { this.step = s; return; }
            }
            this.errors = {};
            this.step = n;
        },

        /* ---------------- Fotografias ---------------- */
        addFiles(fileList) {
            const files = Array.from(fileList || []);
            const problems = [];
            for (const file of files) {
                if (this.photos.length >= MAX_PHOTOS) { problems.push(`Limite de ${MAX_PHOTOS} fotos atingido.`); break; }
                if (!ACCEPTED.includes(file.type)) { problems.push(`“${file.name}” não é JPG ou PNG.`); continue; }
                if (file.size > MAX_SIZE) { problems.push(`“${file.name}” tem mais de 5 MB.`); continue; }
                this.photos.push({ id: `${file.name}-${file.size}-${Date.now()}`, file, url: URL.createObjectURL(file), name: file.name, size: file.size });
            }
            this.errors = problems.length ? { photos: problems.join(' ') } : {};
            if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        },

        onDrop(e) {
            this.dragging = false;
            this.addFiles(e.dataTransfer.files);
        },

        removePhoto(id) {
            const p = this.photos.find((x) => x.id === id);
            if (p) URL.revokeObjectURL(p.url);
            this.photos = this.photos.filter((x) => x.id !== id);
        },

        makeCover(id) {
            const i = this.photos.findIndex((x) => x.id === id);
            if (i > 0) this.photos.unshift(...this.photos.splice(i, 1));
        },

        formatSize(bytes) {
            return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
        },

        /* ---------------- Localização ---------------- */
        setupMap() {
            if (map) { map.invalidateSize(); return; }
            map = createMap(this.$refs.locationMap, {
                center: this.coords || this.$store.eco.origin,
                zoom: this.coords ? 17 : 14,
                layer: this.$store.eco.settings.mapLayer,
                customControls: false,
            });
            map.on('click', (e) => this.setCoords([e.latlng.lat, e.latlng.lng], false));
            if (this.coords) this.placeMarker();
        },

        placeMarker() {
            const color = this.category ? REPORT_CATEGORIES[this.category].color : '#176B56';
            if (!marker) {
                marker = L.marker(this.coords, { icon: dropIcon(color), draggable: true, autoPan: true }).addTo(map);
                marker.on('dragend', () => {
                    const ll = marker.getLatLng();
                    this.setCoords([ll.lat, ll.lng], false);
                });
            } else {
                marker.setLatLng(this.coords);
            }
        },

        setCoords(coords, fly = true) {
            if (!map) this.setupMap();
            this.coords = coords.map((n) => Number(n.toFixed(6)));
            this.errors = { ...this.errors, coords: undefined };
            this.placeMarker();
            if (fly) {
                map.invalidateSize();
                // flyTo exige que o mapa já tenha dimensões (ex.: etapa ainda em transição)
                if (map.getSize().x > 0) map.flyTo(this.coords, 17, { duration: 0.7 });
                else map.setView(this.coords, 17);
            }
            // Sugere o prédio do campus apenas quando o local está dentro/perto da FACENS
            this.campusPoint = this.nearestCampus(this.coords) || '';
            this.lookupAddress();
        },

        lookupAddress: debounce(async function lookup() {
            this.address = '';
            try {
                const res = await reverseGeocode(this.coords);
                this.address = res.label;
                this.neighborhood = res.neighborhood;
            } catch {
                this.address = '';
            }
        }, 500),

        nearestCampus(coords) {
            let best = null;
            let bestD = Infinity;
            Object.entries(CAMPUS_POINTS).forEach(([k, p]) => {
                const d = distanceKm(coords, p.coords);
                if (d < bestD) { bestD = d; best = k; }
            });
            return bestD <= 0.4 ? best : null;
        },

        async useMyLocation() {
            this.locating = true;
            try {
                const c = await this.$store.eco.locate();
                this.setCoords(c);
            } catch (e) {
                this.$store.eco.toast(e.message, 'warning');
            } finally {
                this.locating = false;
            }
        },

        /* ---------------- Envio ---------------- */
        async readPreview(file) {
            // Pré-visualização reduzida para armazenar localmente (modo demonstração)
            const bitmap = await createImageBitmap(raw(file));
            const scale = Math.min(1, 900 / bitmap.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.72);
        },

        async submit(ignoreDuplicate = false) {
            for (let s = 1; s <= 4; s++) {
                if (!this.validate(s)) { this.step = s; return; }
            }
            this.submitting = true;
            this.submitError = '';
            this.duplicate = null;
            try {
                const previews = [];
                this.result = await this.$store.eco.submitReport({
                    ignoreDuplicate,
                    category: this.category,
                    title: this.title.trim(),
                    description: this.description.trim(),
                    severity: this.severity,
                    photo: raw(this.photos[0].file),
                    extraPhotos: this.photos.slice(1).map((p) => raw(p.file)),
                    previews,
                    coords: this.coords,
                    address: this.address,
                    neighborhood: this.neighborhood,
                    campusPoint: this.campusPoint,
                });
                storage.remove('reportDraft');
                this.step = 6;
            } catch (e) {
                // Denúncia parecida por perto: oferece confirmar a existente em vez de duplicar
                if (e.response?.status === 409 && e.response.data?.duplicata) {
                    this.duplicate = mapApiReport(e.response.data.duplicata);
                } else {
                    this.submitError = e.response ? apiError(e) : (e.message || 'Não foi possível enviar a denúncia.');
                }
            } finally {
                this.submitting = false;
            }
        },

        restart() {
            this.photos.forEach((p) => URL.revokeObjectURL(p.url));
            Object.assign(this, {
                step: 1, category: '', title: '', description: '', severity: 'media', photos: [], coords: null,
                address: '', neighborhood: '', campusPoint: '', errors: {}, result: null,
            });
            if (marker) { map.removeLayer(marker); marker = null; }
        },
    };
};
