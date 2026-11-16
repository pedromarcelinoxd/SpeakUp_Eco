/**
 * Dicionários compartilhados com o backend (App\Models\Denuncia, tabela
 * categorias_ocorrencia) e com o painel web (resources/js/ecoradar/config.js).
 *
 * Cada categoria de ocorrência tem cor própria (todas com contraste ≥ 4,5:1 para o
 * ícone branco); pontos de descarte ficam no verde da marca. Status têm cores
 * semânticas, separadas das cores das categorias.
 */
import type { IconName } from '@/design/Icon';
import { color } from '@/design/tokens';

export type ReportCategory = 'descarte_irregular' | 'entulho' | 'eletronicos' | 'poluicao_agua' | 'queimada' | 'dano_ambiental' | 'outros';
export type ReportStatus = 'pendente' | 'confirmada' | 'em_analise' | 'verificada' | 'possivelmente_resolvida' | 'resolvida' | 'nao_confirmada';
export type Severity = 'baixa' | 'media' | 'alta';
export type PointCategory = 'ecoponto' | 'pilhas' | 'eletronicos' | 'oleo' | 'medicamentos' | 'lampadas' | 'reciclagem' | 'outros';

export const REPORT_CATEGORIES: Record<ReportCategory, { label: string; icon: IconName; color: string; description: string }> = {
  descarte_irregular: { label: 'Descarte irregular', icon: 'trash', color: '#C2410C', description: 'Lixo ou resíduos abandonados em local inadequado' },
  entulho: { label: 'Entulho', icon: 'brick', color: '#8B5E34', description: 'Restos de construção, reforma ou demolição' },
  eletronicos: { label: 'Resíduos eletrônicos', icon: 'cpu', color: '#7C3AED', description: 'Aparelhos, pilhas, baterias ou cabos descartados' },
  poluicao_agua: { label: 'Poluição da água', icon: 'droplets', color: '#0369A1', description: 'Esgoto, óleo ou resíduos em rios e córregos' },
  queimada: { label: 'Queimada', icon: 'flame', color: '#DC2626', description: 'Fogo em terreno, vegetação ou queima de lixo' },
  dano_ambiental: { label: 'Dano ambiental', icon: 'axe', color: '#BE185D', description: 'Corte de árvores, aterro ou dano à fauna' },
  outros: { label: 'Outro problema', icon: 'help', color: '#475569', description: 'Algo que não se encaixa acima' },
};

/** Cor dos pontos de descarte no mapa (verde da marca). */
export const POINT_COLOR = color.brand;

export type StatusInfo = { label: string; short: string; fg: string; bg: string; dot: string; icon: IconName; open: boolean; official?: boolean };

export const STATUSES: Record<ReportStatus, StatusInfo> = {
  pendente: { label: 'Aguardando validação', short: 'Aguardando', fg: color.infoInk, bg: color.infoTint, dot: color.info, icon: 'hourglass', open: true },
  confirmada: { label: 'Confirmada pela comunidade', short: 'Confirmada', fg: '#115E59', bg: '#DDF1EE', dot: '#0F766E', icon: 'users', open: true },
  em_analise: { label: 'Em análise pela equipe', short: 'Em análise', fg: color.warningInk, bg: color.warningTint, dot: color.warning, icon: 'clock', open: true, official: true },
  verificada: { label: 'Verificada pela equipe', short: 'Verificada', fg: color.verifiedInk, bg: color.verifiedTint, dot: color.verified, icon: 'badge-check', open: true, official: true },
  possivelmente_resolvida: { label: 'Possivelmente resolvida', short: 'Possivelmente resolvida', fg: '#3F6212', bg: '#ECF5DC', dot: '#4D7C0F', icon: 'circle-check', open: true },
  resolvida: { label: 'Resolvida', short: 'Resolvida', fg: color.successInk, bg: color.successTint, dot: color.success, icon: 'circle-check', open: false },
  nao_confirmada: { label: 'Não confirmada', short: 'Não confirmada', fg: color.muted, bg: color.stone, dot: color.faint, icon: 'circle-x', open: false, official: true },
};

/** Texto fixo que separa a validação da comunidade da confirmação oficial. */
export const COMMUNITY_DISCLAIMER = 'Validação feita por moradores. Não é uma confirmação oficial da prefeitura.';

export const SEVERITIES: Record<Severity, { label: string; hint: string }> = {
  baixa: { label: 'Baixa', hint: 'Incomoda, mas não oferece risco imediato' },
  media: { label: 'Média', hint: 'Afeta a vizinhança e precisa de atenção' },
  alta: { label: 'Alta', hint: 'Risco à saúde, ao meio ambiente ou à segurança' },
};

export const POINT_CATEGORIES: Record<PointCategory, { label: string; icon: IconName; tip: string }> = {
  ecoponto: { label: 'Ecoponto', icon: 'warehouse', tip: 'Separe os materiais por tipo antes de levar.' },
  pilhas: { label: 'Pilhas e baterias', icon: 'battery', tip: 'Guarde pilhas em um pote plástico fechado até levar.' },
  eletronicos: { label: 'Eletrônicos', icon: 'phone', tip: 'Apague seus dados pessoais antes de entregar o aparelho.' },
  oleo: { label: 'Óleo de cozinha', icon: 'droplet', tip: 'Espere esfriar, coe e leve em garrafa PET fechada.' },
  medicamentos: { label: 'Medicamentos', icon: 'pill', tip: 'Leve os remédios vencidos na embalagem original.' },
  lampadas: { label: 'Lâmpadas', icon: 'bulb', tip: 'Transporte inteiras, embaladas em jornal ou na caixa.' },
  reciclagem: { label: 'Recicláveis', icon: 'recycle', tip: 'Lave e seque as embalagens antes de descartar.' },
  outros: { label: 'Outros resíduos', icon: 'package', tip: 'Confirme com o local antes de levar materiais incomuns.' },
};

/** Níveis — mesma regra de App\Support\Pontuacao. */
export const LEVELS = [
  { name: 'Semente', min: 0 },
  { name: 'Broto', min: 200 },
  { name: 'Guardião Ambiental', min: 600 },
  { name: 'Protetor Ambiental', min: 1500 },
];

export const SCORE_RULES = [
  { label: 'Denúncia confirmada pela comunidade ou pela equipe', points: 50, icon: 'badge-check' as IconName },
  { label: 'Validação sua numa ocorrência confirmada', points: 10, icon: 'thumbs-up' as IconName },
];

export const reportCategory = (k?: string) => REPORT_CATEGORIES[(k as ReportCategory) ?? 'outros'] ?? REPORT_CATEGORIES.outros;
export const pointCategory = (k?: string) => POINT_CATEGORIES[(k as PointCategory) ?? 'outros'] ?? POINT_CATEGORIES.outros;
export const statusInfo = (k?: string) => STATUSES[(k as ReportStatus) ?? 'pendente'] ?? STATUSES.pendente;

/** Centro de Sorocaba/SP — referência quando o GPS não está disponível. */
export const DEFAULT_CENTER = { latitude: -23.4995, longitude: -47.456 };
export const DEFAULT_REGION = { ...DEFAULT_CENTER, latitudeDelta: 0.09, longitudeDelta: 0.09 };
