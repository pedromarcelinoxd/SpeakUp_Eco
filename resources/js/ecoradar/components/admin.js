/**
 * Administração do SpeakUp Eco (/app/admin) — só para a equipe.
 * A página mostra os dados apenas para administradores; a API confere is_admin
 * em todas as chamadas, então esconder a tela não é a única proteção.
 */
import { api, apiError } from '../services/api';
import { API_STATUS_MAP, POINT_CATEGORIES, REPORT_CATEGORIES, STATUSES } from '../config';
import { createMap, dropIcon, L } from '../map/base';
import { debounce } from '../utils';

/** Status oficiais que a equipe pode definir (rótulos do painel). */
const STATUS_OPTIONS = ['pendente', 'confirmada', 'em_analise', 'verificada', 'possivelmente_resolvida', 'resolvida', 'nao_confirmada'];

const emptyPoint = () => ({
    id: null, nome: '', categoria: 'ecoponto', endereco: '', horario: '', descricao_local: '',
    materiais: '', latitude: '', longitude: '',
});

export default function adminPage() {
    let pointMap = null;
    let pointMarker = null;

    return {
        tab: 'geral',
        loading: false,
        error: '',

        resumo: null,

        // Denúncias
        reports: [],
        filters: { status: 'aguardando', categoria: '', busca: '' },
        selected: null,
        votes: [],
        newStatus: '',
        note: '',
        hideReason: '',
        busy: '',
        detailOpen: false,
        confirmDelete: false,

        // Ecopontos
        points: [],
        pointForm: emptyPoint(),
        pointOpen: false,
        pointErrors: {},

        // Usuários
        users: [],
        userSearch: '',
        blockTarget: null,
        blockReason: '',
        blockOpen: false,

        // Categorias
        categories: [],
        categoryForm: null,
        categoryOpen: false,

        statusOptions: STATUS_OPTIONS,
        reportCategories: REPORT_CATEGORIES,
        pointCategories: POINT_CATEGORIES,

        init() {
            const start = () => { if (this.$store.eco.isAdmin) this.load(); };
            if (this.$store.eco.ready) start();
            else this.$watch('$store.eco.ready', (v) => v && start());
            this.$watch('tab', () => this.load());
            this.$watch('filters', debounce(() => this.tab === 'denuncias' && this.loadReports(), 300), { deep: true });
            this.$watch('userSearch', debounce(() => this.loadUsers(), 300));
        },

        get allowed() {
            return this.$store.eco.isAdmin;
        },

        statusInfo(apiStatus) {
            return STATUSES[API_STATUS_MAP[apiStatus] || 'recebida'] || STATUSES.recebida;
        },

        categoryInfo(slug) {
            return REPORT_CATEGORIES[slug] || REPORT_CATEGORIES.outros;
        },

        async load() {
            this.error = '';
            const loaders = {
                geral: () => this.loadSummary(),
                denuncias: () => this.loadReports(),
                ecopontos: () => this.loadPoints(),
                usuarios: () => this.loadUsers(),
                categorias: () => this.loadCategories(),
            };
            await loaders[this.tab]?.();
        },

        async run(fn) {
            this.loading = true;
            this.error = '';
            try {
                await fn();
            } catch (e) {
                this.error = apiError(e);
            } finally {
                this.loading = false;
            }
        },

        /* ---------------- Visão geral ---------------- */
        async loadSummary() {
            await this.run(async () => { this.resumo = await api.admin.resumo(); });
        },

        statusRows() {
            const total = Math.max(1, ...Object.values(this.resumo?.denuncias.por_status || {}));
            return STATUS_OPTIONS.map((k) => ({ key: k, info: this.statusInfo(k), count: this.resumo?.denuncias.por_status?.[k] || 0 }))
                .filter((r) => r.count > 0).map((r) => ({ ...r, pct: (r.count / total) * 100 }));
        },

        categoryRows() {
            const data = this.resumo?.denuncias.por_categoria || {};
            const total = Math.max(1, ...Object.values(data));
            return Object.entries(data).map(([k, count]) => ({ key: k, info: this.categoryInfo(k), count, pct: (count / total) * 100 }))
                .sort((a, b) => b.count - a.count);
        },

        hours(h) {
            if (h == null) return '—';
            return h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} dias`;
        },

        /* ---------------- Denúncias ---------------- */
        async loadReports() {
            await this.run(async () => {
                const params = Object.fromEntries(Object.entries(this.filters).filter(([, v]) => v));
                this.reports = await api.admin.denuncias(params);
            });
        },

        async openReport(r) {
            this.selected = r;
            this.newStatus = r.status;
            this.note = '';
            this.hideReason = '';
            this.votes = [];
            this.detailOpen = true;
            try { this.votes = await api.admin.votos(r.id); } catch { this.votes = []; }
        },

        async saveStatus() {
            if (!this.selected || this.newStatus === this.selected.status) return;
            this.busy = 'status';
            try {
                await api.admin.status(this.selected.id, this.newStatus, this.note.trim() || null);
                this.$store.eco.toast('Status atualizado. Quem denunciou é avisado no app e no painel.', 'success');
                this.detailOpen = false;
                await this.loadReports();
                this.$store.eco.refreshPublic();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            } finally {
                this.busy = '';
            }
        },

        async toggleHidden() {
            const r = this.selected;
            if (!r) return;
            if (!r.oculta && this.hideReason.trim().length < 3) {
                this.$store.eco.toast('Informe o motivo da ocultação (ex.: foto com rosto, conteúdo ofensivo).', 'warning');
                return;
            }
            this.busy = 'hide';
            try {
                if (r.oculta) await api.admin.reexibir(r.id);
                else await api.admin.ocultar(r.id, this.hideReason.trim());
                this.$store.eco.toast(r.oculta ? 'A denúncia voltou a aparecer no mapa.' : 'Denúncia ocultada: saiu do mapa público.', 'success');
                this.detailOpen = false;
                await this.loadReports();
                this.$store.eco.refreshPublic();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            } finally {
                this.busy = '';
            }
        },

        async deleteReport() {
            if (!this.selected) return;
            this.busy = 'delete';
            try {
                await api.admin.excluir(this.selected.id);
                this.$store.eco.toast('Denúncia excluída definitivamente.', 'success');
                this.confirmDelete = false;
                this.detailOpen = false;
                await this.loadReports();
                this.$store.eco.refreshPublic();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            } finally {
                this.busy = '';
            }
        },

        /* ---------------- Ecopontos ---------------- */
        async loadPoints() {
            await this.run(async () => { this.points = await api.admin.ecopontos(); });
        },

        editPoint(p = null) {
            this.pointErrors = {};
            this.pointForm = p ? {
                id: p.id, nome: p.nome, categoria: p.categoria || 'ecoponto', endereco: p.endereco || '', horario: p.horario || '',
                descricao_local: p.descricao_local || '', materiais: (p.residuos_aceitos || []).join(', '),
                latitude: p.latitude ?? '', longitude: p.longitude ?? '',
            } : emptyPoint();
            this.pointOpen = true;
            this.$nextTick(() => setTimeout(() => this.setupPointMap(), 260));
        },

        setupPointMap() {
            const el = this.$refs.pointMap;
            if (!el) return;
            const has = this.pointForm.latitude !== '' && this.pointForm.longitude !== '';
            const center = has ? [Number(this.pointForm.latitude), Number(this.pointForm.longitude)] : this.$store.eco.origin;
            if (pointMap) { pointMap.remove(); pointMap = null; pointMarker = null; }
            pointMap = createMap(el, { center, zoom: has ? 16 : 13 });
            const place = (latlng) => {
                this.pointForm.latitude = Number(latlng.lat.toFixed(6));
                this.pointForm.longitude = Number(latlng.lng.toFixed(6));
                if (pointMarker) pointMarker.setLatLng(latlng);
                else pointMarker = L.marker(latlng, { icon: dropIcon('#176B56'), draggable: true }).addTo(pointMap)
                    .on('dragend', () => place(pointMarker.getLatLng()));
            };
            if (has) place(L.latLng(center[0], center[1]));
            pointMap.on('click', (e) => place(e.latlng));
            setTimeout(() => pointMap?.invalidateSize(), 120);
        },

        async savePoint() {
            const f = this.pointForm;
            const e = {};
            if (f.nome.trim().length < 3) e.nome = 'Informe o nome do local.';
            if (f.latitude === '' || f.longitude === '') e.local = 'Clique no mapa para marcar a posição do ponto.';
            const materiais = f.materiais.split(',').map((m) => m.trim()).filter(Boolean);
            if (!materiais.length) e.materiais = 'Informe pelo menos um material recebido.';
            this.pointErrors = e;
            if (Object.keys(e).length) return;
            this.busy = 'point';
            try {
                await api.admin.salvarEcoponto(f.id, {
                    nome: f.nome.trim(), categoria: f.categoria, endereco: f.endereco.trim() || null, horario: f.horario.trim() || null,
                    descricao_local: f.descricao_local.trim() || null, residuos_aceitos: materiais,
                    latitude: Number(f.latitude), longitude: Number(f.longitude),
                });
                this.$store.eco.toast(f.id ? 'Ponto de descarte atualizado.' : 'Ponto de descarte cadastrado. Já aparece no mapa.', 'success');
                this.pointOpen = false;
                await this.loadPoints();
                this.$store.eco.refreshPublic();
            } catch (err) {
                this.$store.eco.toast(apiError(err), 'error');
            } finally {
                this.busy = '';
            }
        },

        async deletePoint(p) {
            if (!window.confirm(`Remover “${p.nome}”? Ele sai do mapa e não pode ser recuperado.`)) return;
            try {
                await api.admin.excluirEcoponto(p.id);
                this.$store.eco.toast('Ponto de descarte removido.', 'success');
                await this.loadPoints();
                this.$store.eco.refreshPublic();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            }
        },

        /* ---------------- Usuários ---------------- */
        async loadUsers() {
            if (this.tab !== 'usuarios') return;
            await this.run(async () => { this.users = await api.admin.usuarios(this.userSearch || undefined); });
        },

        isMe(u) {
            return String(u.id) === String(this.$store.eco.apiUser?.id);
        },

        async toggleAdmin(u) {
            try {
                await api.admin.usuario(u.id, { is_admin: !u.is_admin });
                this.$store.eco.toast(u.is_admin ? `${u.nome} não é mais administrador.` : `${u.nome} agora é administrador.`, 'success');
                await this.loadUsers();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            }
        },

        askBlock(u) {
            this.blockTarget = u;
            this.blockReason = '';
            this.blockOpen = true;
        },

        async confirmBlock() {
            if (this.blockReason.trim().length < 3) {
                this.$store.eco.toast('Informe o motivo do bloqueio.', 'warning');
                return;
            }
            try {
                await api.admin.usuario(this.blockTarget.id, { bloqueado: true, motivo: this.blockReason.trim() });
                this.$store.eco.toast(`${this.blockTarget.nome} foi bloqueado e desconectado.`, 'success');
                this.blockOpen = false;
                await this.loadUsers();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            }
        },

        async unblock(u) {
            try {
                await api.admin.usuario(u.id, { bloqueado: false });
                this.$store.eco.toast(`${u.nome} foi desbloqueado.`, 'success');
                await this.loadUsers();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            }
        },

        /* ---------------- Categorias ---------------- */
        async loadCategories() {
            await this.run(async () => { this.categories = await api.admin.categorias(); });
        },

        editCategory(c) {
            this.categoryForm = { ...c };
            this.categoryOpen = true;
        },

        async saveCategory() {
            const f = this.categoryForm;
            this.busy = 'category';
            try {
                await api.admin.categoria(f.id, { nome: f.nome.trim(), descricao: f.descricao?.trim() || null, cor: f.cor, ativo: !!f.ativo });
                this.$store.eco.toast('Categoria atualizada. O mapa e os formulários usam a nova versão.', 'success');
                this.categoryOpen = false;
                await this.loadCategories();
                await this.$store.eco.loadCategories();
            } catch (e) {
                this.$store.eco.toast(apiError(e), 'error');
            } finally {
                this.busy = '';
            }
        },
    };
}
