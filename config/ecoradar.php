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

    'nav_secondary' => [
        ['route' => 'eco.profile', 'label' => 'Meu perfil', 'icon' => 'user', 'match' => 'eco.profile'],
        ['route' => 'eco.settings', 'label' => 'Configurações', 'icon' => 'settings', 'match' => 'eco.settings'],
    ],

];
