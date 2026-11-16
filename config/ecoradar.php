<?php

/*
|--------------------------------------------------------------------------
| EcoRadar — configuração da interface web
|--------------------------------------------------------------------------
| Itens de navegação compartilhados entre a sidebar (desktop) e o menu
| inferior (mobile). Não afeta a API.
*/

return [

    'name' => 'EcoRadar',
    'tagline' => 'Identifique. Denuncie. Transforme.',

    'nav' => [
        ['route' => 'eco.dashboard', 'label' => 'Visão geral', 'icon' => 'layout-dashboard', 'match' => 'eco.dashboard'],
        ['route' => 'eco.map', 'label' => 'Mapa ambiental', 'icon' => 'map', 'match' => 'eco.map'],
        ['route' => 'eco.reports.index', 'label' => 'Denúncias', 'icon' => 'megaphone', 'match' => 'eco.reports.*'],
        ['route' => 'eco.points.index', 'label' => 'Pontos de descarte', 'icon' => 'recycle', 'match' => 'eco.points.*'],
        ['route' => 'eco.ranking', 'label' => 'Ranking', 'icon' => 'trophy', 'match' => 'eco.ranking'],
        ['route' => 'eco.panorama', 'label' => 'Panorama ambiental', 'icon' => 'chart-column', 'match' => 'eco.panorama'],
    ],

    /*
    | Validação comunitária (não é confirmação oficial da prefeitura).
    | Os números contam pessoas distintas; o autor da denúncia não vota.
    */
    'validacao' => [
        // "Esse problema ainda existe" de N pessoas → Confirmada pela comunidade
        'confirmar_minimo' => (int) env('ECORADAR_CONFIRMAR_MINIMO', 2),
        // "Foi resolvido" de N pessoas (e mais que as confirmações posteriores) → Possivelmente resolvida
        'possivel_resolucao_minimo' => (int) env('ECORADAR_POSSIVEL_RESOLUCAO_MINIMO', 1),
        // "Foi resolvido" de N pessoas (e mais que as confirmações posteriores) → Resolvida
        'resolver_minimo' => (int) env('ECORADAR_RESOLVER_MINIMO', 3),
    ],

    /*
    | Prevenção de abusos para denúncias e validações públicas.
    */
    'limites' => [
        'denuncias_por_hora' => (int) env('ECORADAR_DENUNCIAS_POR_HORA', 6),
        'denuncias_por_dia_por_ip' => (int) env('ECORADAR_DENUNCIAS_POR_DIA_IP', 30),
        'validacoes_por_hora' => (int) env('ECORADAR_VALIDACOES_POR_HORA', 60),
        // Mesma categoria, ainda aberta, a menos de X metros, nos últimos N dias = possível duplicata
        'duplicata_raio_metros' => (int) env('ECORADAR_DUPLICATA_RAIO', 60),
        'duplicata_dias' => (int) env('ECORADAR_DUPLICATA_DIAS', 14),
    ],

    'nav_secondary' => [
        ['route' => 'eco.profile', 'label' => 'Meu perfil', 'icon' => 'user', 'match' => 'eco.profile'],
        ['route' => 'eco.settings', 'label' => 'Configurações', 'icon' => 'settings', 'match' => 'eco.settings'],
    ],

];
