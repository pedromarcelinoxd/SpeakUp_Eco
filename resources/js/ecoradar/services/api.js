/**
 * Cliente da API Laravel existente (routes/api.php).
 * Somente endpoints que JÁ existem no backend são utilizados aqui.
 *
 *   POST   /api/login            → { access_token, user }
 *   POST   /api/register         → { access_token, user }
 *   GET    /api/user             (token)
 *   POST   /api/logout           (token)
 *   POST   /api/perfil           (token, multipart)
 *   GET    /api/ecopontos        (público)
 *   GET    /api/perfil/resumo    (token)
 *   GET    /api/denuncias        (token)       GET /api/denuncias/{id}
 *   POST   /api/denuncias        (token, multipart)
 *   PATCH  /api/denuncias/{id}/status (admin)  POST /api/denuncias/{id}/confirmar
 *   DELETE /api/denuncias/{id}   (autor enquanto pendente, ou admin)
 *   GET    /api/ranking          GET /api/notificacoes
 */
import axios from 'axios';
import { API_STATUS_MAP, CAMPUS_POINTS, MATERIAL_KEYWORDS } from '../config';
import { normalize, storage } from '../utils';

const http = axios.create({
    baseURL: '/api',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    timeout: 12000,
});

http.interceptors.request.use((config) => {
    const token = storage.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/* Extrai a mensagem de erro do Laravel (validação ou genérica) */
export function apiError(err) {
    const data = err?.response?.data;
    if (data?.errors) return Object.values(data.errors).flat()[0];
    if (data?.message) return data.message;
    if (err?.code === 'ECONNABORTED') return 'O servidor demorou para responder.';
    return 'Não foi possível conectar ao servidor.';
}

/* ---------------- Mapeadores (API → modelo do front) ---------------- */
function campus(key) {
    return CAMPUS_POINTS[key] || { label: key, coords: CAMPUS_POINTS.predio_a.coords };
}

/* Registros antigos (antes da API v2) guardavam categoria e título em
 * `detalhes_localizacao` no formato "[categoria] Título — descrição". */
const DETAILS_RE = /^\[([a-z_]+)\]\s*(.*?)(?:\s+—\s+([\s\S]*))?$/;

export const toApiStatus = (s) => (s === 'recebida' ? 'pendente' : s);

export function mapApiReport(d) {
    const hasGps = d.latitude != null && d.longitude != null;
    const loc = d.ponto_referencia ? campus(d.ponto_referencia) : null;
    const legacy = (d.detalhes_localizacao || '').match(DETAILS_RE);
    const category = d.categoria && d.categoria !== 'outros' ? d.categoria : (legacy?.[1] || d.categoria || 'outros');
    const title = d.titulo || legacy?.[2] || `Ocorrência em ${loc?.label || 'local informado'}`;
    const description = d.descricao || (legacy ? (legacy[3] || '') : (d.detalhes_localizacao || 'Sem descrição informada.'));
    const status = API_STATUS_MAP[d.status] || 'recebida';
    const history = (d.historico?.length ? d.historico : [{ status: 'pendente', data: d.created_at }])
        .map((h) => ({
            status: API_STATUS_MAP[h.status] || 'recebida',
            date: h.data,
            note: h.observacao || (h.status === 'pendente' ? 'Denúncia registrada.' : 'Status atualizado pela equipe.'),
        }));
    if (!d.historico?.length && status !== 'recebida') history.push({ status, date: d.updated_at, note: 'Status atualizado pela equipe.' });

    return {
        id: `api-${d.id}`,
        apiId: d.id,
        source: 'api',
        origin: d.origem || 'web',
        category,
        status,
        severity: d.criticidade,
        title,
        description,
        neighborhood: loc && !hasGps ? 'Campus FACENS' : (d.endereco?.split(' · ')[1] || 'Sorocaba'),
        zone: loc && !hasGps ? 'Campus FACENS' : 'Geolocalizadas',
        coords: hasGps ? [d.latitude, d.longitude] : (loc?.coords || CAMPUS_POINTS.predio_a.coords),
        approximate: !hasGps,
        address: d.endereco || (loc ? `${loc.label} · Campus FACENS, Sorocaba – SP` : `${d.latitude}, ${d.longitude}`),
        campusPoint: d.ponto_referencia,
        createdAt: d.created_at,
        author: d.user?.name || 'Usuário',
        authorId: d.user_id,
        confirmations: d.confirmacoes_count || 0,
        confirmedByMe: !!d.confirmada_por_mim,
        permissions: d.permissoes || {},
        photos: d.fotos?.length ? d.fotos : (d.foto_url ? [d.foto_url] : []),
        history,
    };
}

function inferPointCategory(materials = []) {
    const text = normalize(materials.join(' '));
    const hits = Object.entries(MATERIAL_KEYWORDS)
        .filter(([, words]) => words.some((w) => text.includes(normalize(w))))
        .map(([k]) => k);
    if (hits.length === 1) return hits[0];
    return 'ecoponto';
}

export function mapApiPoint(e) {
    const hasGps = e.latitude != null && e.longitude != null;
    const loc = e.ponto_referencia ? campus(e.ponto_referencia) : null;
    const materials = Array.isArray(e.residuos_aceitos) ? e.residuos_aceitos : [];
    return {
        id: `api-${e.id}`,
        apiId: e.id,
        source: 'api',
        name: e.nome,
        category: e.categoria && e.categoria !== 'ecoponto' ? e.categoria : inferPointCategory(materials),
        neighborhood: loc && !hasGps ? 'Campus FACENS' : 'Sorocaba',
        zone: loc && !hasGps ? 'Campus FACENS' : 'Sorocaba',
        coords: hasGps ? [e.latitude, e.longitude] : (loc?.coords || CAMPUS_POINTS.predio_a.coords),
        approximate: !hasGps,
        address: e.endereco || `${loc?.label || ''}${e.descricao_local ? ` — ${e.descricao_local}` : ''} · Campus FACENS`,
        hours: e.horario || 'Horário não informado',
        materials,
        description: e.descricao_local || 'Ponto de coleta cadastrado.',
        addedAt: e.created_at,
    };
}

/* ---------------- Endpoints ---------------- */
export const api = {
    async login(email, password) {
        const { data } = await http.post('/login', { email, password });
        return data;
    },
    async register(payload) {
        const { data } = await http.post('/register', payload);
        return data;
    },
    async me() {
        const { data } = await http.get('/user');
        return data;
    },
    async summary() {
        const { data } = await http.get('/perfil/resumo');
        return data;
    },
    async logout() {
        await http.post('/logout');
    },
    async updateProfile({ name, email, telefone, bairro, foto }) {
        const form = new FormData();
        form.append('name', name);
        form.append('email', email);
        if (telefone) form.append('telefone', telefone);
        if (bairro) form.append('bairro', bairro);
        if (foto) form.append('foto_perfil', foto);
        const { data } = await http.post('/perfil', form);
        return data;
    },
    async points() {
        const { data } = await http.get('/ecopontos');
        return data.map(mapApiPoint);
    },
    async reports() {
        const { data } = await http.get('/denuncias');
        return data.map(mapApiReport);
    },
    async report(apiId) {
        const { data } = await http.get(`/denuncias/${apiId}`);
        return mapApiReport(data);
    },
    /** Mesmo contrato usado pelo app mobile (StoreDenunciaRequest). */
    async createReport({ photo, extraPhotos = [], coords, address, campusPoint, severity, category, title, description }) {
        const form = new FormData();
        form.append('foto', photo);
        extraPhotos.slice(0, 4).forEach((f) => form.append('fotos[]', f));
        form.append('categoria', category);
        form.append('titulo', title);
        form.append('descricao', description);
        form.append('latitude', coords[0]);
        form.append('longitude', coords[1]);
        if (address) form.append('endereco', address.slice(0, 255));
        if (campusPoint) form.append('ponto_referencia', campusPoint);
        form.append('criticidade', severity);
        form.append('origem', 'web');
        const { data } = await http.post('/denuncias', form);
        return mapApiReport(data);
    },
    async confirmReport(apiId) {
        const { data } = await http.post(`/denuncias/${apiId}/confirmar`);
        return mapApiReport(data);
    },
    async updateStatus(apiId, status, observacao) {
        const { data } = await http.patch(`/denuncias/${apiId}/status`, { status: toApiStatus(status), observacao });
        return mapApiReport(data);
    },
    async deleteReport(apiId) {
        await http.delete(`/denuncias/${apiId}`);
    },
    async ranking(periodo) {
        const { data } = await http.get('/ranking', { params: { periodo } });
        return data;
    },
    async notifications() {
        const { data } = await http.get('/notificacoes');
        return data;
    },
    async markNotificationRead(id) {
        await http.post(`/notificacoes/${id}/lida`);
    },
    async markAllNotificationsRead() {
        await http.post('/notificacoes/lidas');
    },
    async ping() {
        const started = performance.now();
        await http.get('/ecopontos');
        return Math.round(performance.now() - started);
    },
};

/* ---------------- Geocodificação (OpenStreetMap / Nominatim, sem chave) ---------------- */
const NOMINATIM = 'https://nominatim.openstreetmap.org';

export async function geocode(query) {
    const params = new URLSearchParams({
        q: query, format: 'json', limit: '5', countrycodes: 'br', addressdetails: '0', 'accept-language': 'pt-BR',
        viewbox: '-47.62,-23.38,-47.30,-23.60', bounded: '0',
    });
    const res = await fetch(`${NOMINATIM}/search?${params}`);
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    return data.map((r) => ({ label: r.display_name, coords: [parseFloat(r.lat), parseFloat(r.lon)] }));
}

export async function reverseGeocode([lat, lng]) {
    const params = new URLSearchParams({ lat, lon: lng, format: 'json', zoom: '17', 'accept-language': 'pt-BR' });
    const res = await fetch(`${NOMINATIM}/reverse?${params}`);
    if (!res.ok) throw new Error('reverse');
    const data = await res.json();
    const a = data.address || {};
    const street = [a.road, a.house_number].filter(Boolean).join(', ');
    const area = a.suburb || a.neighbourhood || a.quarter || '';
    return {
        label: [street, area, a.city || a.town].filter(Boolean).join(' · ') || data.display_name,
        neighborhood: area,
    };
}
