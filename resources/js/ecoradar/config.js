/**
 * Configurações e dicionários do EcoRadar.
 * Fonte única para categorias, status, níveis e pontos de referência.
 */

export const MAP_DEFAULTS = {
    // Sorocaba/SP — cidade da FACENS
    center: [-23.4995, -47.4560],
    // Cidade inteira à vista: todos os ícones aparecem sem precisar de zoom
    zoom: 12,
};

/* --------------------------------------------------------------
 | Categorias de denúncias ambientais
 * -------------------------------------------------------------- */
export const REPORT_CATEGORIES = {
    // Cada categoria com cor própria (contraste ≥ 4,5:1 com o ícone branco), igual ao app
    // e à tabela categorias_ocorrencia do banco.
    descarte_irregular: {
        label: 'Descarte irregular', short: 'Descarte irregular', icon: 'trash', color: '#C2410C',
        description: 'Lixo ou resíduos abandonados em local inadequado.',
    },
    entulho: {
        label: 'Entulho', short: 'Entulho', icon: 'construction', color: '#8B5E34',
        description: 'Restos de construção, reformas ou demolição.',
    },
    eletronicos: {
        label: 'Resíduos eletrônicos', short: 'Eletrônicos', icon: 'cpu', color: '#7C3AED',
        description: 'Aparelhos, pilhas, baterias ou cabos descartados.',
    },
    poluicao_agua: {
        label: 'Poluição da água', short: 'Poluição', icon: 'droplets', color: '#0369A1',
        description: 'Esgoto, óleo ou resíduos em rios, córregos e lagos.',
    },
    queimada: {
        label: 'Queimada', short: 'Queimadas', icon: 'flame', color: '#DC2626',
        description: 'Fogo em terrenos, vegetação ou queima de lixo.',
    },
    dano_ambiental: {
        label: 'Dano ambiental', short: 'Dano ambiental', icon: 'axe', color: '#BE185D',
        description: 'Desmatamento, corte de árvores ou dano à fauna e flora.',
    },
    outros: {
        label: 'Outros', short: 'Outros', icon: 'circle-help', color: '#475569',
        description: 'Outros problemas ambientais.',
    },
};

/* --------------------------------------------------------------
 | Categorias de pontos de descarte
 * -------------------------------------------------------------- */
export const POINT_CATEGORIES = {
    ecoponto: {
        label: 'Ecoponto',
        short: 'Ecopontos',
        icon: 'warehouse',
        color: '#176B56',
        tip: 'Separe os materiais por tipo antes de levar. Ecopontos costumam receber volumosos, entulho em pequena quantidade e recicláveis.',
    },
    pilhas: {
        label: 'Pilhas e baterias',
        short: 'Pilhas',
        icon: 'battery-charging',
        color: '#176B56',
        tip: 'Guarde pilhas em um pote plástico fechado. Nunca descarte no lixo comum: metais pesados contaminam o solo.',
    },
    eletronicos: {
        label: 'Eletrônicos',
        short: 'Eletrônicos',
        icon: 'monitor-smartphone',
        color: '#176B56',
        tip: 'Apague seus dados pessoais e remova baterias removíveis antes de entregar o equipamento.',
    },
    oleo: {
        label: 'Óleo de cozinha',
        short: 'Óleo',
        icon: 'droplet',
        color: '#176B56',
        tip: 'Espere o óleo esfriar, coe e armazene em garrafa PET bem fechada.',
    },
    medicamentos: {
        label: 'Medicamentos',
        short: 'Medicamentos',
        icon: 'pill',
        color: '#176B56',
        tip: 'Leve os remédios vencidos na embalagem original. Seringas e agulhas devem ir em recipiente rígido.',
    },
    lampadas: {
        label: 'Lâmpadas',
        short: 'Lâmpadas',
        icon: 'lightbulb',
        color: '#176B56',
        tip: 'Lâmpadas fluorescentes contêm mercúrio: transporte inteiras, embaladas na caixa original ou em jornal.',
    },
    reciclagem: {
        label: 'Reciclagem',
        short: 'Reciclagem',
        icon: 'recycle',
        color: '#176B56',
        tip: 'Lave e seque as embalagens. Papel, plástico, vidro e metal devem estar limpos para serem reciclados.',
    },
    outros: {
        label: 'Outros resíduos',
        short: 'Outros',
        icon: 'package',
        color: '#176B56',
        tip: 'Consulte o local antes de levar materiais incomuns.',
    },
};

/* --------------------------------------------------------------
 | Status das denúncias
 | api: valores do enum `status` na tabela `denuncias`
 * -------------------------------------------------------------- */
export const STATUSES = {
    recebida: { label: 'Aguardando validação', color: '#2563EB', bg: 'bg-blue-50', text: 'text-blue-700', icon: 'hourglass', api: 'pendente' },
    confirmada: { label: 'Confirmada pela comunidade', color: '#0F766E', bg: 'bg-teal-50', text: 'text-teal-800', icon: 'users', api: 'confirmada' },
    em_analise: { label: 'Em análise pela equipe', color: '#D97706', bg: 'bg-amber-50', text: 'text-amber-800', icon: 'clock', api: 'em_analise', official: true },
    verificada: { label: 'Verificada pela equipe', color: '#4F46E5', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'badge-check', api: 'verificada', official: true },
    possivelmente_resolvida: { label: 'Possivelmente resolvida', color: '#4D7C0F', bg: 'bg-lime-50', text: 'text-lime-800', icon: 'circle-check', api: 'possivelmente_resolvida' },
    resolvida: { label: 'Resolvida', color: '#16A34A', bg: 'bg-green-50', text: 'text-green-800', icon: 'circle-check', api: 'resolvida' },
    nao_confirmada: { label: 'Não confirmada', color: '#64748B', bg: 'bg-slate-100', text: 'text-slate-600', icon: 'circle-x', api: 'nao_confirmada', official: true },
};

export const API_STATUS_MAP = {
    pendente: 'recebida',
    confirmada: 'confirmada',
    em_analise: 'em_analise',
    verificada: 'verificada',
    possivelmente_resolvida: 'possivelmente_resolvida',
    resolvida: 'resolvida',
    nao_confirmada: 'nao_confirmada',
};

/** Texto fixo que separa a validação da comunidade da confirmação oficial. */
export const COMMUNITY_DISCLAIMER = 'Validação feita por moradores. Não é uma confirmação oficial da prefeitura.';

/** Origem de cada mudança no histórico. */
export const HISTORY_ORIGINS = { autor: 'registro de quem denunciou', comunidade: 'validação da comunidade', equipe: 'equipe oficial' };

export const SEVERITIES = {
    baixa: { label: 'Baixa', color: '#16A34A' },
    media: { label: 'Média', color: '#D97706' },
    alta: { label: 'Alta', color: '#DC2626' },
};

/* --------------------------------------------------------------
 | Gamificação
 * -------------------------------------------------------------- */
export const LEVELS = [
    { key: 'semente', label: 'Semente', min: 0, icon: 'circle-dot', color: '#9CCBB3' },
    { key: 'broto', label: 'Broto', min: 200, icon: 'sprout', color: '#3E8C74' },
    { key: 'guardiao', label: 'Guardião Ambiental', min: 600, icon: 'shield-check', color: '#176B56' },
    { key: 'protetor', label: 'Protetor Ambiental', min: 1500, icon: 'trees', color: '#0F4A3B' },
];

export const SCORE_RULES = [
    { action: 'Denúncia validada pela equipe', points: 50, icon: 'badge-check', note: 'Só conta após validação.' },
    { action: 'Cadastro de ponto ambiental aprovado', points: 30, icon: 'map-pinned', note: 'Após conferência dos dados.' },
    { action: 'Confirmação de ocorrência', points: 10, icon: 'thumbs-up', note: 'Quando a ocorrência é verificada.' },
];

/* --------------------------------------------------------------
 | Pontos de referência do campus FACENS
 | Chaves aceitas pelo backend (StoreDenunciaRequest / EcopontoRequest).
 | Coordenadas APROXIMADAS dentro do perímetro do campus (OpenStreetMap).
 * -------------------------------------------------------------- */
export const CAMPUS_POINTS = {
    portaria: { label: 'Portaria', coords: [-23.4720, -47.4300] },
    estacionamento: { label: 'Estacionamento', coords: [-23.4714, -47.4311] },
    predio_a: { label: 'Prédio A', coords: [-23.4706, -47.4301] },
    predio_b: { label: 'Prédio B', coords: [-23.4703, -47.4296] },
    predio_c: { label: 'Prédio C', coords: [-23.4700, -47.4291] },
    predio_d: { label: 'Prédio D', coords: [-23.4697, -47.4286] },
    predio_e: { label: 'Prédio E', coords: [-23.4709, -47.4289] },
    predio_f: { label: 'Prédio F', coords: [-23.4712, -47.4284] },
    predio_h: { label: 'Prédio H', coords: [-23.4694, -47.4294] },
    predio_i: { label: 'Prédio I', coords: [-23.4692, -47.4302] },
    predio_l: { label: 'Prédio L', coords: [-23.4699, -47.4308] },
    quadra: { label: 'Quadra', coords: [-23.4716, -47.4291] },
    lago: { label: 'Lago', coords: [-23.4710, -47.4278] },
    cantina: { label: 'Cantina', coords: [-23.4704, -47.4307] },
};

/* Palavras-chave para inferir a categoria de um ecoponto vindo da API */
export const MATERIAL_KEYWORDS = {
    pilhas: ['pilha', 'bateria'],
    eletronicos: ['eletr', 'celular', 'computador', 'cabo', 'notebook'],
    oleo: ['óleo', 'oleo'],
    medicamentos: ['medic', 'remédio', 'remedio', 'seringa'],
    lampadas: ['lâmpada', 'lampada'],
    reciclagem: ['papel', 'plástico', 'plastico', 'vidro', 'metal', 'recicl', 'latinha', 'papelão'],
};
