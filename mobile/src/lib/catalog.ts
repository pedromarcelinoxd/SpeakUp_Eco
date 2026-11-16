/**
 * Dicionários compartilhados com o backend (App\Models\Denuncia / Ecoponto)
 * e com o painel web (resources/js/ecoradar/config.js).
 *
 * Cor com função: denúncias usam o coral (aberta) e se distinguem pelo glifo;
 * pontos de descarte usam o verde de jardim. Status têm suas próprias cores.
 */
import type { IconName } from '@/design/Icon';
import { color } from '@/design/tokens';

export type ReportCategory = 'descarte_irregular' | 'entulho' | 'queimada' | 'poluicao_agua' | 'dano_ambiental' | 'outros';
export type ReportStatus = 'pendente' | 'em_analise' | 'verificada' | 'resolvida' | 'nao_confirmada';
export type Severity = 'baixa' | 'media' | 'alta';
export type PointCategory = 'ecoponto' | 'pilhas' | 'eletronicos' | 'oleo' | 'medicamentos' | 'lampadas' | 'reciclagem' | 'outros';

export const REPORT_CATEGORIES: Record<ReportCategory, { label: string; icon: IconName; description: string }> = {
  descarte_irregular: { label: 'Descarte irregular', icon: 'trash', description: 'Lixo ou resíduos abandonados em local inadequado' },
  entulho: { label: 'Entulho', icon: 'brick', description: 'Restos de construção, reforma ou demolição' },
  queimada: { label: 'Queimada', icon: 'flame', description: 'Fogo em terreno, vegetação ou queima de lixo' },
  poluicao_agua: { label: 'Poluição da água', icon: 'droplets', description: 'Esgoto, óleo ou resíduos em rios e córregos' },
  dano_ambiental: { label: 'Dano ambiental', icon: 'axe', description: 'Corte de árvores, aterro ou dano à fauna' },
  outros: { label: 'Outro problema', icon: 'help', description: 'Algo que não se encaixa acima' },
};

export const STATUSES: Record<ReportStatus, { label: string; fg: string; bg: string; dot: string; icon: IconName; open: boolean }> = {
  pendente: { label: 'Recebida', fg: color.infoInk, bg: color.infoTint, dot: color.info, icon: 'inbox', open: true },
  em_analise: { label: 'Em análise', fg: color.warningInk, bg: color.warningTint, dot: color.warning, icon: 'hourglass', open: true },
  verificada: { label: 'Verificada', fg: color.verifiedInk, bg: color.verifiedTint, dot: color.verified, icon: 'badge-check', open: true },
  resolvida: { label: 'Resolvida', fg: color.successInk, bg: color.successTint, dot: color.success, icon: 'circle-check', open: false },
  nao_confirmada: { label: 'Não confirmada', fg: color.muted, bg: color.stone, dot: color.faint, icon: 'circle-x', open: false },
};

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
  { label: 'Denúncia validada pela equipe', points: 50, icon: 'badge-check' as IconName },
  { label: 'Confirmação de ocorrência validada', points: 10, icon: 'thumbs-up' as IconName },
];

export const reportCategory = (k?: string) => REPORT_CATEGORIES[(k as ReportCategory) ?? 'outros'] ?? REPORT_CATEGORIES.outros;
export const pointCategory = (k?: string) => POINT_CATEGORIES[(k as PointCategory) ?? 'outros'] ?? POINT_CATEGORIES.outros;
export const statusInfo = (k?: string) => STATUSES[(k as ReportStatus) ?? 'pendente'] ?? STATUSES.pendente;

/** Centro de Sorocaba/SP — referência quando o GPS não está disponível. */
export const DEFAULT_CENTER = { latitude: -23.4995, longitude: -47.456 };
export const DEFAULT_REGION = { ...DEFAULT_CENTER, latitudeDelta: 0.09, longitudeDelta: 0.09 };
