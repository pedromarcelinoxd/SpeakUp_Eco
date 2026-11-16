/**
 * Store global (Alpine.store('eco')).
 *
 * Organiza as três origens de dados, sempre identificadas por `source`:
 *   - 'api'   → dados reais vindos do backend Laravel
 *   - 'local' → registros feitos neste navegador sem login (modo demonstração)
 *   - 'demo'  → dados demonstrativos (data/demo.js)
 */
import { api, apiError } from './services/api';
import { DEMO_USER, buildNotifications, buildRanking, demoPoints, demoReports } from './data/demo';
import { distanceKm, levelFor, storage } from './utils';
import { MAP_DEFAULTS } from './config';

const MAP_LAYERS = ['osm', 'light', 'streets', 'satellite'];
const BASE = (window.EcoRadar && window.EcoRadar.base) || '/app';

export const ROUTES = {
    dashboard: () => `${BASE}`,
    map: (q) => `${BASE}/mapa${q ? `?${new URLSearchParams(q)}` : ''}`,
    reports: () => `${BASE}/denuncias`,
    report: (id) => `${BASE}/denuncias/${id}`,
    newReport: () => `${BASE}/denuncias/nova`,
    points: () => `${BASE}/descarte`,
    point: (id) => `${BASE}/descarte/${id}`,
    ranking: () => `${BASE}/ranking`,
    panorama: () => `${BASE}/panorama`,
    profile: () => `${BASE}/perfil`,
    notifications: () => `${BASE}/notificacoes`,
    settings: () => `${BASE}/configuracoes`,
    login: () => `${BASE}/entrar`,
};

export function route(name, ...args) {
    return (ROUTES[name] || ROUTES.dashboard)(...args);
}

export function createStore() {
    return {
        ready: false,
        loading: true,
        token: storage.get('token'),
        apiUser: storage.get('user'),
        apiOnline: null,
        apiError: null,
        apiReports: [],
        apiPoints: [],
        apiSummary: null,
        apiNotifications: [],
        apiRanking: null,
        localReports: storage.get('localReports', []),
        confirmed: storage.get('confirmed', []),
        readIds: storage.get('readNotifications', []),
        extraNotifications: storage.get('extraNotifications', []),
        settings: {
            showDemo: true,
            mapLayer: 'osm',
            sidebarCollapsed: false,
            ...storage.get('settings', {}),
        },
        location: storage.get('lastLocation'),
        toasts: [],

        async init() {
            if (!MAP_LAYERS.includes(this.settings.mapLayer)) this.settings.mapLayer = 'osm';
            await this.load();
        },

        /* ---------------- Carregamento ---------------- */
        async load() {
            this.loading = true;
            const tasks = [
                api.points().then((p) => { this.apiPoints = p; this.apiOnline = true; }),
            ];
            if (this.token) {
                tasks.push(api.me().then((u) => { this.apiUser = u; storage.set('user', u); }));
                tasks.push(api.reports().then((r) => { this.apiReports = r; }));
                tasks.push(api.summary().then((s) => { this.apiSummary = s; }));
                tasks.push(this.loadNotifications());
            }
            const results = await Promise.allSettled(tasks);
            const failed = results.find((r) => r.status === 'rejected');
            if (failed) {
                const status = failed.reason?.response?.status;
                if (status === 401) {
                    this.clearSession();
                    this.toast('Sua sessão expirou. Entre novamente.', 'warning');
                } else if (!failed.reason?.response) {
                    this.apiOnline = false;
                }
                this.apiError = apiError(failed.reason);
            }
            this.loading = false;
            this.ready = true;
        },

        /* ---------------- Coleções (com filtro de origem) ---------------- */
        get reports() {
            const list = [...this.apiReports, ...this.localReports];
            if (this.settings.showDemo) list.push(...demoReports);
            return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        get points() {
            const list = [...this.apiPoints];
            if (this.settings.showDemo) list.push(...demoPoints);
            return list;
        },

        get hasDemo() {
            return this.settings.showDemo;
        },

        findReport(id) {
            return this.reports.find((r) => String(r.id) === String(id))
                || demoReports.find((r) => r.id === id) || null;
        },

        findPoint(id) {
            return this.points.find((p) => String(p.id) === String(id))
                || demoPoints.find((p) => p.id === id) || null;
        },

        /* ---------------- Usuário ---------------- */
        get isAuthenticated() {
            return !!this.token && !!this.apiUser;
        },

        get user() {
            if (this.isAuthenticated) {
                const u = this.apiUser;
                const mine = this.apiReports.filter((r) => String(r.authorId) === String(u.id));
                const st = this.apiSummary?.estatisticas;
                const validated = st?.validadas ?? mine.filter((r) => ['verificada', 'resolvida'].includes(r.status)).length;
                const points = this.apiSummary?.pontos ?? validated * 50;
                return {
                    id: u.id,
                    name: (u.name || '').split(' ')[0] || 'Você',
                    fullName: u.name,
                    email: u.email,
                    bairro: u.bairro || '',
                    telefone: u.telefone || '',
                    avatar: u.foto_perfil_path ? `/storage/${u.foto_perfil_path}` : null,
                    isAdmin: !!u.is_admin,
                    points,
                    weeklyPoints: 0,
                    monthlyPoints: points,
                    stats: { sent: st?.enviadas ?? mine.length, validated, confirmed: st?.confirmacoes ?? 0, pointsFound: 0 },
                    joinedAt: u.created_at,
                    source: 'api',
                };
            }
            const localCount = this.localReports.length;
            return {
                ...DEMO_USER,
                avatar: null,
                stats: { ...DEMO_USER.stats, sent: DEMO_USER.stats.sent + localCount },
                source: 'demo',
            };
        },

        get isAdmin() {
            return this.isAuthenticated && !!this.apiUser.is_admin;
        },

        get level() {
            return levelFor(this.user.points);
        },

        get myReports() {
            if (this.isAuthenticated) {
                return this.apiReports.filter((r) => String(r.authorId) === String(this.apiUser.id));
            }
            return [...this.localReports, ...(this.settings.showDemo ? demoReports.filter((r) => r.mine) : [])]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        /** Ranking real (API) quando logado; demonstrativo caso contrário. */
        async loadRanking() {
            if (!this.isAuthenticated) return;
            const periods = { weekly: 'semanal', monthly: 'mensal', total: 'geral' };
            const results = await Promise.all(Object.values(periods).map((p) => api.ranking(p)));
            const rows = {};
            Object.keys(periods).forEach((key, i) => {
                results[i].ranking.forEach((r) => {
                    rows[r.user_id] ??= { id: r.user_id, name: r.nome, neighborhood: r.bairro || '—', weekly: 0, monthly: 0, total: 0, source: 'api' };
                    rows[r.user_id][key] = r.pontos;
                });
            });
            this.apiRanking = Object.values(rows);
        },

        get ranking() {
            if (this.isAuthenticated && this.apiRanking) {
                const meId = this.apiUser.id;
                const list = this.apiRanking.map((r) => ({ ...r, me: r.id === meId }));
                if (!list.some((r) => r.me)) {
                    list.push({ id: meId, name: this.user.name, neighborhood: this.user.bairro || '—', weekly: 0, monthly: 0, total: this.user.points, me: true, source: 'api' });
                }
                return list;
            }
            const me = this.user;
            const others = this.settings.showDemo ? buildRanking().filter((u) => !u.me) : [];
            return [
                ...others,
                { id: me.id, name: me.name, total: me.points, weekly: me.weeklyPoints, monthly: me.monthlyPoints, me: true, neighborhood: me.bairro || '—', source: me.source },
            ];
        },

        async login(email, password) {
            const data = await api.login(email, password);
            this.setSession(data);
        },

        async register(payload) {
            const data = await api.register(payload);
            this.setSession(data);
        },

        setSession(data) {
            this.token = data.access_token;
            this.apiUser = data.user;
            storage.set('token', this.token);
            storage.set('user', this.apiUser);
        },

        clearSession() {
            this.token = null;
            this.apiUser = null;
            this.apiReports = [];
            this.apiSummary = null;
            this.apiNotifications = [];
            this.apiRanking = null;
            storage.remove('token');
            storage.remove('user');
        },

        async logout() {
            if (this.token) {
                try { await api.logout(); } catch { /* token já inválido */ }
            }
            this.clearSession();
            this.toast('Você saiu da sua conta.', 'success');
            window.location.href = route('login');
        },

        async updateProfile(payload) {
            if (!this.isAuthenticated) {
                throw new Error('Entre com sua conta para editar o perfil. A conta de demonstração não pode ser alterada.');
            }
            const data = await api.updateProfile(payload);
            this.apiUser = data.user;
            storage.set('user', data.user);
        },

        /* ---------------- Denúncias ---------------- */
        async submitReport(form) {
            if (this.isAuthenticated) {
                const report = await api.createReport(form);
                this.apiReports.unshift(report);
                this.loadNotifications();
                return report;
            }
            // Modo demonstração: guarda apenas neste navegador.
            const id = `local-${Date.now().toString(36)}`;
            const report = {
                id,
                source: 'local',
                category: form.category,
                status: 'recebida',
                severity: form.severity,
                title: form.title,
                description: form.description,
                neighborhood: form.neighborhood || 'Sorocaba',
                zone: '—',
                coords: form.coords,
                address: form.address || `${form.coords[0].toFixed(5)}, ${form.coords[1].toFixed(5)}`,
                createdAt: new Date().toISOString(),
                author: this.user.name,
                confirmations: 0,
                photos: form.previews || [],
                mine: true,
                history: [{ status: 'recebida', date: new Date().toISOString(), note: 'Denúncia registrada neste dispositivo (modo demonstração).' }],
            };
            this.localReports.unshift(report);
            // Fotos em base64 podem exceder o limite do localStorage; guardamos só a primeira.
            storage.set('localReports', this.localReports.map((r) => ({ ...r, photos: r.photos.slice(0, 1) })));
            this.pushNotification({
                icon: 'inbox', color: '#2563EB', title: 'Sua denúncia foi recebida',
                body: `“${report.title}” foi registrada neste dispositivo.`, link: { route: 'report', id },
            });
            return report;
        },

        isConfirmed(id) {
            return this.confirmed.includes(id) || !!this.apiReports.find((r) => r.id === id)?.confirmedByMe;
        },

        replaceApiReport(report) {
            const i = this.apiReports.findIndex((r) => r.id === report.id);
            if (i >= 0) this.apiReports.splice(i, 1, report);
            else this.apiReports.unshift(report);
        },

        async confirmReport(id) {
            if (this.isConfirmed(id)) return;
            const report = this.findReport(id);
            if (report?.source === 'api') {
                try {
                    this.replaceApiReport(await api.confirmReport(report.apiId));
                } catch (e) {
                    this.toast(apiError(e), 'error');
                    return;
                }
            } else {
                this.confirmed.push(id);
                storage.set('confirmed', this.confirmed);
            }
            this.toast('Obrigado! Sua confirmação foi registrada. Os +10 pontos contam após a verificação.', 'success');
        },

        /** Detalhe completo (com histórico) direto da API. */
        async refreshReport(id) {
            const report = this.findReport(id);
            if (report?.source !== 'api' || !this.isAuthenticated) return;
            try { this.replaceApiReport(await api.report(report.apiId)); } catch { /* mantém versão em cache */ }
        },

        /** Moderação (somente administradores — validado também no servidor). */
        async updateReportStatus(id, status, note) {
            const report = this.findReport(id);
            this.replaceApiReport(await api.updateStatus(report.apiId, status, note));
            this.toast('Status atualizado. O autor foi notificado no app e no painel.', 'success');
        },

        async deleteReport(id) {
            const report = this.findReport(id);
            await api.deleteReport(report.apiId);
            this.apiReports = this.apiReports.filter((r) => r.id !== id);
            this.toast('Denúncia excluída.', 'success');
        },

        /* ---------------- Notificações ---------------- */
        async loadNotifications() {
            if (!this.token) return;
            const meta = {
                recebida: { icon: 'inbox', color: '#2563EB' },
                status: { icon: 'refresh', color: '#D97706' },
                confirmacao: { icon: 'thumbs-up', color: '#2563EB' },
            };
            const data = await api.notifications();
            this.apiNotifications = data.notificacoes.map((n) => ({
                id: n.id,
                api: true,
                ...(meta[n.tipo] || meta.status),
                ...(n.titulo?.includes('resolvida') ? { icon: 'circle-check', color: '#16A34A' } : {}),
                title: n.titulo,
                body: n.mensagem,
                date: n.data,
                read: n.lida,
                link: n.denuncia_id ? { route: 'report', id: `api-${n.denuncia_id}` } : null,
            }));
        },

        get notifications() {
            // Logado: notificações reais do servidor (as mesmas que chegam por push no app).
            const base = this.isAuthenticated ? this.apiNotifications : (this.settings.showDemo ? buildNotifications() : []);
            return [...this.extraNotifications, ...base]
                .map((n) => ({ ...n, read: n.read || this.readIds.includes(n.id) }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        get unreadCount() {
            return this.notifications.filter((n) => !n.read).length;
        },

        markRead(id) {
            const n = this.apiNotifications.find((x) => x.id === id);
            if (n && !n.read) {
                n.read = true;
                api.markNotificationRead(id).catch(() => {});
            }
            if (!this.readIds.includes(id)) {
                this.readIds.push(id);
                storage.set('readNotifications', this.readIds);
            }
        },

        markAllRead() {
            if (this.isAuthenticated && this.apiNotifications.some((n) => !n.read)) {
                this.apiNotifications.forEach((n) => { n.read = true; });
                api.markAllNotificationsRead().catch(() => {});
            }
            this.readIds = [...new Set([...this.readIds, ...this.notifications.map((n) => n.id)])];
            storage.set('readNotifications', this.readIds);
        },

        pushNotification(n) {
            this.extraNotifications.unshift({ id: `x-${Date.now()}`, date: new Date().toISOString(), read: false, ...n });
            this.extraNotifications = this.extraNotifications.slice(0, 20);
            storage.set('extraNotifications', this.extraNotifications);
        },

        notificationUrl(n) {
            if (!n.link) return route('notifications');
            return route(n.link.route, n.link.id);
        },

        /* ---------------- Preferências ---------------- */
        setSetting(key, value) {
            this.settings[key] = value;
            storage.set('settings', this.settings);
        },

        toggleSidebar() {
            const collapsed = !this.settings.sidebarCollapsed;
            this.setSetting('sidebarCollapsed', collapsed);
            if (collapsed) document.documentElement.dataset.sidebar = 'collapsed';
            else delete document.documentElement.dataset.sidebar;
        },

        /* ---------------- Localização ---------------- */
        get origin() {
            return this.location || MAP_DEFAULTS.center;
        },

        distanceTo(coords) {
            return distanceKm(this.origin, coords);
        },

        locate() {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Seu navegador não oferece geolocalização.'));
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.location = [pos.coords.latitude, pos.coords.longitude];
                        storage.set('lastLocation', this.location);
                        resolve(this.location);
                    },
                    (err) => reject(new Error(err.code === 1
                        ? 'Permissão de localização negada. Ative-a nas configurações do navegador.'
                        : 'Não foi possível obter sua localização.')),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
                );
            });
        },

        /* ---------------- Toasts ---------------- */
        toast(message, type = 'info') {
            const id = Date.now() + Math.random();
            this.toasts.push({ id, message, type });
            setTimeout(() => { this.toasts = this.toasts.filter((t) => t.id !== id); }, 4200);
        },

        dismissToast(id) {
            this.toasts = this.toasts.filter((t) => t.id !== id);
        },

        route,
    };
}
