---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# EcoRadar app (mobile) — surface brief

Scope: app nativo inteiro (Expo Router, `mobile/src/app`), com o painel web alinhado aos mesmos tokens. Mode: Operate.
Audience/job: morador ou aluno na rua, celular numa mão, quer registrar um problema em segundos ou achar onde descartar um resíduo.
Constraints: navegação priorizada pelo usuário (Mapa, Denunciar, Pontos de descarte, Ranking, Perfil); só dados reais da API; Android e iOS; push e GPS preservados.
Chosen direction: Modernismo Cívico (sorteado, aceito pelo usuário). Memorable moment: o mosaico de pedra portuguesa que se preenche de verde com a atividade.
Unresolved: conquistas são derivadas de dados existentes (sem tabela de badges no backend).

## Direction contract

THESIS: O EcoRadar fala com a voz do design público modernista brasileiro — jardim de Burle Marx, calçadão de pedra portuguesa, ipê-amarelo — e recusa o padrão "app eco" de cartões brancos, ícones em quadradinhos tintados e verde em tudo.

OWN-WORLD: Casca em verde-jardim profundo (#0E3A2C) na barra de abas e nos topos; chão em branco-pedra frio (#F6F7F4); tipografia e controles em basalto (#141816). Amarelo-ipê (#F2C230) existe só na ação principal de cada tela. Coral (#E5484D) só para denúncias abertas. Tipografia Archivo: títulos e números grandes em corte expandido, texto em corte normal; algarismos tabulares, valores à direita. Ícones Lucide em traço único, sem caixas atrás. Hierarquia por escala e espaço, não por cartões; sombras só em elementos que flutuam sobre o mapa.

STORY: Quem abre o app vê o mapa da sua região com o que está aberto perto dele, entende em um olhar o estado do bairro, e com um toque no amarelo registra uma denúncia (categoria, foto, local, texto, enviar). Confirma ocorrências de vizinhos, encontra o ecoponto certo e acompanha seu progresso.

FIRST VIEWPORT: Mapa em tela cheia. No topo, busca em basalto e avatar; abaixo, segmento Tudo/Denúncias/Descarte e botão Filtros. Marcadores: gota coral com glifo (denúncia), pedra quadrada verde com glifo (descarte), ponto azul (você). Painel inferior "Perto de você" (resumo do bairro + mosaico de atividade) que, ao selecionar um marcador, vira o cartão do item com distância grande à direita e ação primária amarela. Barra de abas verde-jardim; Denunciar no centro em amarelo-ipê.

FORM: Modernismo brasileiro no espaço público (Burle Marx / calçadão / ipê), posição 5 da lista ordenada por ressonância. Assinatura: mosaico de pedra portuguesa como visualização de atividade e de progresso de nível. seed:8c92833eb394ee98

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
