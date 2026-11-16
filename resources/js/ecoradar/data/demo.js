/**
 * ============================================================
 *  DADOS DEMONSTRATIVOS — EcoRadar
 * ============================================================
 *  Tudo neste arquivo é FICTÍCIO e serve apenas para demonstrar
 *  a interface enquanto o backend não oferece estes recursos.
 *  Cada item carrega `source: 'demo'` e a interface exibe o selo
 *  "Demonstração". Nomes de bairros são reais (Sorocaba/SP), mas
 *  endereços, ocorrências, pessoas e locais NÃO existem.
 *
 *  Para desativar: Configurações → "Exibir dados demonstrativos".
 * ============================================================
 */

const DAY = 86400000;
const now = Date.now();
const ago = (days, hours = 0) => new Date(now - days * DAY - hours * 3600000).toISOString();

/* Gerador pseudoaleatório determinístico (os dados não mudam a cada recarga) */
function rng(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export const NEIGHBORHOODS = [
    { name: 'Centro', zone: 'Centro', coords: [-23.5015, -47.4580] },
    { name: 'Vila Hortência', zone: 'Zona Leste', coords: [-23.4925, -47.4455] },
    { name: 'Campolim', zone: 'Zona Sul', coords: [-23.5300, -47.4690] },
    { name: 'Jardim Vergueiro', zone: 'Zona Oeste', coords: [-23.5135, -47.4795] },
    { name: 'Wanel Ville', zone: 'Zona Oeste', coords: [-23.5110, -47.4990] },
    { name: 'Éden', zone: 'Zona Norte', coords: [-23.4260, -47.4180] },
    { name: 'Além Ponte', zone: 'Zona Norte', coords: [-23.4880, -47.4660] },
    { name: 'Alto da Boa Vista', zone: 'Zona Leste', coords: [-23.4735, -47.4330] },
    { name: 'Vila Barcelona', zone: 'Zona Leste', coords: [-23.5170, -47.4420] },
    { name: 'Jardim Santa Rosália', zone: 'Zona Sul', coords: [-23.5145, -47.4520] },
    { name: 'Jardim Ipanema', zone: 'Zona Norte', coords: [-23.4630, -47.4790] },
    { name: 'Parque Campolim', zone: 'Zona Sul', coords: [-23.5385, -47.4610] },
    { name: 'Jardim Simus', zone: 'Zona Oeste', coords: [-23.4985, -47.4860] },
    { name: 'Vila Carvalho', zone: 'Centro', coords: [-23.4950, -47.4620] },
];

export const DEMO_USER = {
    id: 'demo-me',
    name: 'Pedro',
    fullName: 'Pedro (conta demonstrativa)',
    email: 'pedro@exemplo.com',
    bairro: 'Alto da Boa Vista',
    telefone: '',
    points: 480,
    weeklyPoints: 70,
    monthlyPoints: 210,
    stats: { sent: 12, validated: 8, confirmed: 14, pointsFound: 3 },
    joinedAt: ago(160),
};

/* ---------------- Denúncias em destaque (escritas à mão) ---------------- */
const FEATURED = [
    {
        id: 'd-1042', category: 'descarte_irregular', status: 'em_analise', severity: 'alta', mine: true,
        title: 'Sacos de lixo acumulados em terreno baldio',
        description: 'Cerca de 20 sacos de lixo doméstico e móveis velhos foram deixados no terreno ao lado da praça. O acúmulo atrai insetos e já há mau cheiro na rua.',
        hood: 'Alto da Boa Vista', offset: [0.0021, -0.0015], days: 0.2, confirmations: 6,
    },
    {
        id: 'd-1041', category: 'queimada', status: 'verificada', severity: 'alta',
        title: 'Foco de queimada em área de vegetação',
        description: 'Fumaça intensa vista no fim da tarde em área de mata próxima à avenida. Possível queima de resíduos de poda.',
        hood: 'Éden', offset: [0.004, 0.003], days: 0.6, confirmations: 11,
    },
    {
        id: 'd-1039', category: 'poluicao_agua', status: 'em_analise', severity: 'media',
        title: 'Mancha escura no córrego após chuva',
        description: 'Água com coloração escura e espuma próximo à ponte de pedestres. Suspeita de ligação clandestina de esgoto.',
        hood: 'Além Ponte', offset: [-0.002, 0.0025], days: 1.3, confirmations: 4,
    },
    {
        id: 'd-1036', category: 'entulho', status: 'resolvida', severity: 'media', mine: true,
        title: 'Entulho de reforma na calçada',
        description: 'Restos de azulejos, tijolos e sacos de cimento bloqueando a passagem de pedestres na calçada.',
        hood: 'Vila Hortência', offset: [0.0012, 0.0018], days: 2.1, confirmations: 3, resolvedAfter: 1.5,
    },
    {
        id: 'd-1033', category: 'dano_ambiental', status: 'recebida', severity: 'alta',
        title: 'Corte de árvores em área de preservação',
        description: 'Três árvores de grande porte foram cortadas próximo à nascente. Não havia placa de autorização visível.',
        hood: 'Parque Campolim', offset: [-0.003, -0.002], days: 2.8, confirmations: 2,
    },
    {
        id: 'd-1030', category: 'descarte_irregular', status: 'resolvida', severity: 'baixa',
        title: 'Pneus abandonados em esquina',
        description: 'Oito pneus velhos deixados na esquina, acumulando água parada. Risco de foco de dengue.',
        hood: 'Wanel Ville', offset: [0.0018, 0.001], days: 3.5, confirmations: 9, resolvedAfter: 2,
    },
    {
        id: 'd-1028', category: 'outros', status: 'nao_confirmada', severity: 'baixa',
        title: 'Odor forte vindo de galpão',
        description: 'Cheiro químico forte em alguns horários do dia. Não foi possível identificar a origem.',
        hood: 'Jardim Ipanema', offset: [0.001, -0.002], days: 4.4, confirmations: 0,
    },
    {
        id: 'd-1025', category: 'entulho', status: 'verificada', severity: 'media', mine: true,
        title: 'Caçamba irregular ocupando a via',
        description: 'Caçamba de entulho sem sinalização ocupando metade da faixa há mais de uma semana.',
        hood: 'Campolim', offset: [0.0025, 0.0012], days: 5.2, confirmations: 5,
    },
    {
        id: 'd-1021', category: 'poluicao_agua', status: 'resolvida', severity: 'alta',
        title: 'Óleo descartado em bueiro',
        description: 'Moradores relataram descarte de óleo de cozinha em bueiro, que deságua no córrego próximo.',
        hood: 'Jardim Santa Rosália', offset: [-0.0015, 0.0022], days: 6.1, confirmations: 7, resolvedAfter: 3,
    },
    {
        id: 'd-1019', category: 'descarte_irregular', status: 'recebida', severity: 'media',
        title: 'Eletrônicos descartados junto ao lixo comum',
        description: 'Monitores e uma geladeira antiga deixados ao lado dos contêineres de lixo comum.',
        hood: 'Centro', offset: [0.0008, -0.0012], days: 6.8, confirmations: 1,
    },
    {
        id: 'd-1016', category: 'queimada', status: 'resolvida', severity: 'media',
        title: 'Queima de lixo em quintal',
        description: 'Fumaça frequente aos fins de semana causada por queima de lixo doméstico.',
        hood: 'Jardim Simus', offset: [0.0014, 0.002], days: 8.5, confirmations: 4, resolvedAfter: 4,
    },
    {
        id: 'd-1012', category: 'dano_ambiental', status: 'em_analise', severity: 'media',
        title: 'Aterro irregular em área verde',
        description: 'Caminhões descarregando terra e entulho sobre área verde às margens da estrada.',
        hood: 'Vila Barcelona', offset: [-0.002, -0.0025], days: 9.4, confirmations: 3,
    },
];

/* ---------------- Gerador de histórico (para gráficos e mapa de calor) ---------------- */
const TEMPLATES = {
    descarte_irregular: ['Lixo acumulado na calçada', 'Descarte de móveis em via pública', 'Sacos de lixo em terreno', 'Resíduos em ponto de ônibus'],
    entulho: ['Entulho em terreno baldio', 'Restos de obra na rua', 'Caçamba transbordando'],
    queimada: ['Queimada em terreno', 'Fumaça em área de mata', 'Queima de poda'],
    poluicao_agua: ['Esgoto a céu aberto', 'Resíduos no córrego', 'Água com espuma no rio'],
    dano_ambiental: ['Poda irregular de árvore', 'Movimentação de terra em APP', 'Animais silvestres feridos'],
    outros: ['Ruído e fumaça de oficina', 'Ponto de alagamento com lixo'],
};
const WEIGHTS = [
    ['descarte_irregular', 34], ['entulho', 22], ['queimada', 14], ['poluicao_agua', 13], ['dano_ambiental', 10], ['outros', 7],
];
const ZONE_WEIGHT = { Centro: 1.4, 'Zona Norte': 1.2, 'Zona Leste': 1, 'Zona Oeste': 1.1, 'Zona Sul': 0.8 };

function pickWeighted(rand, list) {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [k, w] of list) {
        if ((r -= w) <= 0) return k;
    }
    return list[0][0];
}

function buildHistory(r) {
    const created = r.createdAt;
    const t = (d) => new Date(new Date(created).getTime() + d * DAY).toISOString();
    const h = [{ status: 'recebida', date: created, note: 'Denúncia registrada pela comunidade.' }];
    if (['em_analise', 'verificada', 'resolvida', 'nao_confirmada'].includes(r.status)) {
        h.push({ status: 'em_analise', date: t(0.15), note: 'Equipe iniciou a análise da ocorrência.' });
    }
    if (['verificada', 'resolvida'].includes(r.status)) {
        h.push({ status: 'verificada', date: t(0.5), note: 'Ocorrência confirmada por moradores e pela equipe.' });
    }
    if (r.status === 'resolvida') {
        h.push({ status: 'resolvida', date: t(r.resolvedAfter || 2), note: 'Órgão responsável informou a solução do problema.' });
    }
    if (r.status === 'nao_confirmada') {
        h.push({ status: 'nao_confirmada', date: t(1), note: 'Não foi possível confirmar a ocorrência no local.' });
    }
    return h.filter((e) => new Date(e.date).getTime() <= now);
}

function hood(name) {
    return NEIGHBORHOODS.find((n) => n.name === name) || NEIGHBORHOODS[0];
}

const AUTHORS = ['Ana Lima', 'Carlos M.', 'Juliana Reis', 'Rafael Prado', 'Beatriz S.', 'Lucas Andrade', 'Marina Costa', 'Thiago N.'];

function buildReports() {
    const list = FEATURED.map((f, i) => {
        const n = hood(f.hood);
        const r = {
            ...f,
            source: 'demo',
            neighborhood: n.name,
            zone: n.zone,
            coords: [n.coords[0] + f.offset[0], n.coords[1] + f.offset[1]],
            address: `${n.name}, Sorocaba – SP`,
            createdAt: ago(f.days),
            author: f.mine ? DEMO_USER.name : AUTHORS[i % AUTHORS.length],
            photos: [],
            seed: i + 3,
        };
        r.history = buildHistory(r);
        return r;
    });

    const rand = rng(42);
    for (let i = 0; i < 96; i++) {
        const category = pickWeighted(rand, WEIGHTS);
        const hoodPick = pickWeighted(rand, NEIGHBORHOODS.map((n) => [n.name, ZONE_WEIGHT[n.zone]]));
        const n = hood(hoodPick);
        const days = Math.round(10 + rand() * 350);
        const roll = rand();
        // Ocorrências antigas tendem a estar resolvidas
        const status = days > 45
            ? (roll < 0.72 ? 'resolvida' : roll < 0.84 ? 'verificada' : roll < 0.93 ? 'nao_confirmada' : 'em_analise')
            : (roll < 0.35 ? 'resolvida' : roll < 0.55 ? 'verificada' : roll < 0.8 ? 'em_analise' : 'recebida');
        const titles = TEMPLATES[category];
        const r = {
            id: `d-${(900 - i).toString().padStart(4, '0')}`,
            source: 'demo',
            category,
            status,
            severity: ['baixa', 'media', 'alta'][Math.floor(rand() * 3)],
            title: titles[Math.floor(rand() * titles.length)],
            description: 'Registro histórico demonstrativo utilizado para compor indicadores e o mapa de calor.',
            neighborhood: n.name,
            zone: n.zone,
            coords: [n.coords[0] + (rand() - 0.5) * 0.022, n.coords[1] + (rand() - 0.5) * 0.022],
            address: `${n.name}, Sorocaba – SP`,
            createdAt: ago(days, Math.floor(rand() * 20)),
            author: AUTHORS[Math.floor(rand() * AUTHORS.length)],
            confirmations: Math.floor(rand() * 9),
            resolvedAfter: 1 + rand() * 9,
            photos: [],
            seed: i + 20,
            mine: i % 19 === 0,
        };
        r.history = buildHistory(r);
        list.push(r);
    }
    return list;
}

/* ---------------- Pontos de descarte ---------------- */
const HOURS = {
    ecoponto: 'Seg a Sáb · 7h às 17h',
    comercio: 'Seg a Sáb · 8h às 20h',
    shopping: 'Todos os dias · 10h às 22h',
    farmacia: 'Todos os dias · 7h às 23h',
    publico: 'Seg a Sex · 8h às 17h',
};

const POINTS_RAW = [
    ['p-01', 'Ecoponto Vila Hortência', 'ecoponto', 'Vila Hortência', [0.002, -0.001], HOURS.ecoponto, ['Entulho (até 1 m³)', 'Móveis', 'Podas', 'Recicláveis', 'Eletrodomésticos']],
    ['p-02', 'Ecoponto Campolim', 'ecoponto', 'Campolim', [-0.0015, 0.002], HOURS.ecoponto, ['Entulho (até 1 m³)', 'Volumosos', 'Recicláveis', 'Pneus']],
    ['p-03', 'Ecoponto Éden', 'ecoponto', 'Éden', [0.001, 0.0015], HOURS.ecoponto, ['Entulho (até 1 m³)', 'Podas', 'Recicláveis']],
    ['p-04', 'Ecoponto Wanel Ville', 'ecoponto', 'Wanel Ville', [-0.002, -0.0012], HOURS.ecoponto, ['Volumosos', 'Recicláveis', 'Óleo de cozinha']],
    ['p-05', 'Coleta de Pilhas — Supermercado Central', 'pilhas', 'Centro', [0.0012, 0.0009], HOURS.comercio, ['Pilhas', 'Baterias de celular', 'Baterias de notebook']],
    ['p-06', 'Papa-Pilhas — Shopping Campolim', 'pilhas', 'Parque Campolim', [0.0021, -0.0011], HOURS.shopping, ['Pilhas', 'Baterias']],
    ['p-07', 'Central de Eletrônicos Recicla+', 'eletronicos', 'Jardim Santa Rosália', [-0.001, 0.0016], HOURS.publico, ['Computadores', 'Celulares', 'Cabos', 'Impressoras', 'Monitores']],
    ['p-08', 'Coleta de Eletrônicos — Campus', 'eletronicos', 'Alto da Boa Vista', [0.0018, 0.002], HOURS.publico, ['Celulares', 'Carregadores', 'Cabos', 'Periféricos']],
    ['p-09', 'Ponto de Óleo — Feira do Bairro', 'oleo', 'Além Ponte', [0.0009, -0.0017], 'Sábados · 7h às 13h', ['Óleo de cozinha usado (em garrafa PET)']],
    ['p-10', 'Coleta de Óleo — Mercado Simus', 'oleo', 'Jardim Simus', [-0.0012, 0.0008], HOURS.comercio, ['Óleo de cozinha usado']],
    ['p-11', 'Farmácia Popular Vergueiro', 'medicamentos', 'Jardim Vergueiro', [0.0007, 0.0014], HOURS.farmacia, ['Medicamentos vencidos', 'Blísteres', 'Frascos']],
    ['p-12', 'Descarte de Medicamentos — UBS Centro', 'medicamentos', 'Vila Carvalho', [-0.0011, -0.0009], HOURS.publico, ['Medicamentos vencidos', 'Seringas (em recipiente rígido)']],
    ['p-13', 'Coleta de Lâmpadas — Home Center', 'lampadas', 'Vila Barcelona', [0.0016, 0.0011], HOURS.comercio, ['Lâmpadas fluorescentes', 'Lâmpadas LED']],
    ['p-14', 'Cooperativa Recicla Sorocaba', 'reciclagem', 'Jardim Ipanema', [-0.0014, 0.0018], HOURS.publico, ['Papel', 'Papelão', 'Plástico', 'Vidro', 'Metal']],
    ['p-15', 'PEV Reciclável — Praça Central', 'reciclagem', 'Centro', [-0.0019, -0.0004], 'Acesso livre · 24h', ['Papel', 'Plástico', 'Vidro', 'Latinhas']],
    ['p-16', 'Associação de Catadores Norte', 'reciclagem', 'Além Ponte', [-0.0022, 0.0021], HOURS.publico, ['Papelão', 'Plástico', 'Metal', 'Isopor limpo']],
    ['p-17', 'Coleta de Pilhas — Escola Estadual', 'pilhas', 'Wanel Ville', [0.0019, 0.0019], 'Seg a Sex · 7h às 18h', ['Pilhas']],
    ['p-18', 'Ponto de Raio-X e Cartuchos', 'outros', 'Vila Hortência', [-0.0018, 0.0021], HOURS.comercio, ['Radiografias', 'Cartuchos de tinta', 'Toners']],
    ['p-19', 'PEV Reciclável — Parque', 'reciclagem', 'Campolim', [0.0028, -0.0021], 'Acesso livre · 24h', ['Plástico', 'Vidro', 'Latinhas']],
    ['p-20', 'Coleta de Lâmpadas — Loja Elétrica', 'lampadas', 'Jardim Simus', [0.0021, -0.0019], HOURS.comercio, ['Lâmpadas fluorescentes']],
];

function buildPoints() {
    return POINTS_RAW.map(([id, name, category, hoodName, off, hours, materials], i) => {
        const n = hood(hoodName);
        return {
            id,
            source: 'demo',
            name,
            category,
            neighborhood: n.name,
            zone: n.zone,
            coords: [n.coords[0] + off[0], n.coords[1] + off[1]],
            address: `Endereço demonstrativo · ${n.name}, Sorocaba – SP`,
            hours,
            materials,
            description: 'Local demonstrativo. Confirme horários e materiais aceitos antes de se deslocar.',
            addedAt: ago(3 + i * 9),
        };
    });
}

/* ---------------- Ranking ---------------- */
const RANK_NAMES = [
    ['Mariana Alves', 1840, 160, 520], ['João Pedro Silva', 1520, 140, 470], ['Camila Rocha', 1310, 210, 450],
    ['Gabriel Martins', 1180, 90, 380], ['Larissa Nunes', 990, 120, 300], ['Felipe Duarte', 870, 60, 260],
    ['Isabela Cardoso', 760, 180, 330], ['Rodrigo Teixeira', 690, 40, 190], ['Sofia Barbosa', 620, 100, 240],
    ['Pedro', 480, 70, 210, true], ['Henrique Lopes', 430, 30, 150], ['Natália Pires', 390, 80, 170],
    ['Vinícius Ramos', 320, 20, 90], ['Amanda Freitas', 260, 50, 110], ['Bruno Castro', 180, 10, 60],
];

export function buildRanking() {
    return RANK_NAMES.map(([name, total, weekly, monthly, me], i) => ({
        id: me ? DEMO_USER.id : `u-${i}`,
        name,
        total,
        weekly,
        monthly,
        me: !!me,
        neighborhood: NEIGHBORHOODS[(i * 5) % NEIGHBORHOODS.length].name,
        source: 'demo',
    }));
}

/* ---------------- Notificações ---------------- */
export function buildNotifications() {
    return [
        { id: 'n-1', type: 'status', icon: 'hourglass', color: '#D97706', title: 'Sua denúncia está em análise', body: '“Sacos de lixo acumulados em terreno baldio” foi encaminhada para a equipe responsável.', date: ago(0, 2), read: false, link: { route: 'report', id: 'd-1042' } },
        { id: 'n-2', type: 'confirm', icon: 'thumbs-up', color: '#2563EB', title: 'Uma ocorrência recebeu confirmação', body: '3 moradores confirmaram “Sacos de lixo acumulados em terreno baldio”.', date: ago(0, 5), read: false, link: { route: 'report', id: 'd-1042' } },
        { id: 'n-3', type: 'points', icon: 'sparkles', color: '#176B56', title: 'Você ganhou 50 pontos', body: 'Sua denúncia “Caçamba irregular ocupando a via” foi validada.', date: ago(1, 3), read: false, link: { route: 'ranking' } },
        { id: 'n-4', type: 'resolved', icon: 'circle-check', color: '#16A34A', title: 'Sua denúncia foi marcada como resolvida', body: '“Entulho de reforma na calçada” foi solucionada. Obrigado por ajudar!', date: ago(2, 1), read: true, link: { route: 'report', id: 'd-1036' } },
        { id: 'n-5', type: 'point', icon: 'map-pinned', color: '#176B56', title: 'Novo ponto de descarte cadastrado', body: 'Ecoponto Vila Hortência agora aceita eletrodomésticos.', date: ago(3), read: true, link: { route: 'point', id: 'p-01' } },
        { id: 'n-6', type: 'received', icon: 'inbox', color: '#2563EB', title: 'Sua denúncia foi recebida', body: '“Sacos de lixo acumulados em terreno baldio” foi registrada com o protocolo #1042.', date: ago(0, 6), read: true, link: { route: 'report', id: 'd-1042' } },
        { id: 'n-7', type: 'level', icon: 'sprout', color: '#176B56', title: 'Você subiu para o nível Broto', body: 'Continue contribuindo para se tornar Guardião Ambiental.', date: ago(12), read: true, link: { route: 'profile' } },
    ];
}

export const demoReports = buildReports();
export const demoPoints = buildPoints();
