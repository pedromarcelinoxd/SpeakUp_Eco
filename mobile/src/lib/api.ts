/**
 * Cliente da API Laravel central (a mesma usada pelo painel web).
 * Conta opcional: com login, token Sanctum (Bearer) salvo no SecureStore; sem login,
 * o aparelho se identifica por um UUID anônimo (cabeçalho X-EcoRadar-Dispositivo).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { PointCategory, ReportCategory, ReportStatus, Severity } from './catalog';
import { getDeviceId } from './device';

/**
 * URL da API:
 *  1. EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:8000/api) — recomendado;
 *  2. em desenvolvimento, o mesmo IP do servidor Expo (porta 8000);
 *  3. emulador Android: 10.0.2.2.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:8000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';
}

export const API_URL = resolveApiUrl();

export type User = {
  id: number;
  name: string;
  email: string;
  telefone?: string | null;
  bairro?: string | null;
  is_admin?: boolean;
  foto_perfil_path?: string | null;
};

export type Vote = 'existe' | 'resolvida';

export type Report = {
  id: number;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  autor: { nome: string; anonimo: boolean; sou_eu: boolean; foto_url?: string | null };
  categoria: ReportCategory;
  titulo: string | null;
  descricao: string | null;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  ponto_referencia: string | null;
  detalhes_localizacao: string | null;
  criticidade: Severity;
  status: ReportStatus;
  origem: 'web' | 'app';
  foto_url: string | null;
  fotos: string[];
  validacoes: { existe: number; resolvida: number };
  meu_voto: Vote | null;
  pode_validar: boolean;
  motivo_bloqueio: string | null;
  precisa_login?: boolean;
  confirmacoes_count: number;
  confirmada_por_mim: boolean;
  permissoes: { confirmar: boolean; excluir: boolean; alterar_status: boolean } | null;
  historico?: { status: ReportStatus; origem: 'autor' | 'comunidade' | 'equipe' | null; observacao: string | null; data: string }[];
  created_at: string;
  updated_at?: string;
};

export type Point = {
  id: number;
  nome: string;
  categoria: PointCategory;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  horario: string | null;
  descricao_local: string | null;
  ponto_referencia: string | null;
  residuos_aceitos: string[];
};

export type RankingRow = {
  posicao: number;
  user_id: number;
  foto_url?: string | null;
  nome: string;
  bairro: string | null;
  pontos: number;
  pontos_total: number;
  nivel: string;
};

export type Summary = {
  user: User;
  foto_perfil_url: string | null;
  pontos: number;
  nivel: { chave: string; nome: string; minimo: number; proximo: { chave: string; nome: string; minimo: number } | null; faltam: number };
  estatisticas: { enviadas: number; validadas: number; resolvidas: number; confirmacoes: number };
};

export type AppNotification = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  denuncia_id: number | null;
  lida: boolean;
  data: string;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string[]>, public data?: Record<string, unknown>) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  headers['X-EcoRadar-Dispositivo'] = await getDeviceId();
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch {
    throw new ApiError(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando e se o celular está na mesma rede.`, 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const first = data?.errors ? (Object.values(data.errors)[0] as string[])[0] : null;
    const fallback = res.status === 429 ? 'Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.' : 'Erro inesperado no servidor.';
    throw new ApiError(first || data?.message || fallback, res.status, data?.errors, data);
  }
  return data as T;
}

export type PhotoAsset = { uri: string; mimeType?: string | null; fileName?: string | null };

function filePart(photo: PhotoAsset, index: number) {
  const type = photo.mimeType || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : 'jpg';
  // React Native aceita { uri, name, type } como arquivo em FormData
  return { uri: photo.uri, name: photo.fileName || `foto-${index}.${ext}`, type } as unknown as Blob;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; user: User }>('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation: password }),
    }),
  logout: () => request<void>('/logout', { method: 'POST' }),
  me: () => request<User>('/user'),
  summary: () => request<Summary>('/perfil/resumo'),

  reports: (params: { minhas?: boolean } = {}) => request<Report[]>(`/denuncias${params.minhas ? '?minhas=1' : ''}`),
  report: (id: number | string) => request<Report>(`/denuncias/${id}`),
  confirm: (id: number) => request<Report>(`/denuncias/${id}/confirmar`, { method: 'POST' }),
  /** Validação comunitária: um voto por pessoa ("existe" ou "resolvida"); pode mudar de opinião. */
  vote: (id: number, tipo: Vote) =>
    request<{ denuncia: Report; voto_registrado: boolean; status_mudou: boolean }>(`/denuncias/${id}/validar`, { method: 'POST', body: JSON.stringify({ tipo }) }),
  remove: (id: number) => request<void>(`/denuncias/${id}`, { method: 'DELETE' }),
  createReport(input: {
    photos: PhotoAsset[];
    categoria: ReportCategory;
    titulo: string;
    descricao: string;
    criticidade: Severity;
    latitude: number;
    longitude: number;
    endereco?: string;
    ignorarDuplicata?: boolean;
  }) {
    const form = new FormData();
    const [cover, ...extras] = input.photos;
    form.append('foto', filePart(cover, 0));
    extras.slice(0, 4).forEach((p, i) => form.append('fotos[]', filePart(p, i + 1)));
    form.append('categoria', input.categoria);
    form.append('titulo', input.titulo);
    form.append('descricao', input.descricao);
    form.append('criticidade', input.criticidade);
    form.append('latitude', String(input.latitude));
    form.append('longitude', String(input.longitude));
    if (input.endereco) form.append('endereco', input.endereco.slice(0, 255));
    form.append('origem', 'app');
    if (input.ignorarDuplicata) form.append('ignorar_duplicata', '1');
    return request<Report>('/denuncias', { method: 'POST', body: form });
  },

  categories: () => request<{ slug: string; nome: string; cor: string; descricao: string | null }[]>('/categorias'),
  points: () => request<Point[]>('/ecopontos'),
  point: (id: number | string) => request<Point>(`/ecopontos/${id}`),
  ranking: (periodo: 'semanal' | 'mensal' | 'geral') =>
    request<{ ranking: RankingRow[]; eu: { posicao: number | null; pontos: number } | null }>(`/ranking?periodo=${periodo}`),

  notifications: () => request<{ nao_lidas: number; notificacoes: AppNotification[] }>('/notificacoes'),
  markRead: (id: string) => request<void>(`/notificacoes/${id}/lida`, { method: 'POST' }),
  markAllRead: () => request<void>('/notificacoes/lidas', { method: 'POST' }),

  registerPushToken: (pushToken: string, plataforma: string) =>
    request<void>('/push-tokens', { method: 'POST', body: JSON.stringify({ token: pushToken, plataforma }) }),
  removePushToken: (pushToken: string) =>
    request<void>('/push-tokens', { method: 'DELETE', body: JSON.stringify({ token: pushToken }) }),
};
