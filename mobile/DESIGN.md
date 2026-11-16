---
name: SpeakUp Eco
description: Mapa cívico de denúncias ambientais e pontos de descarte, na voz do modernismo brasileiro.
colors:
  brand: "#176B56"
  brand-pressed: "#125847"
  brand-tint: "#DDEBE2"
  brand-soft: "#9CCBB3"
  brand-mid: "#3E8C74"
  coral: "#E77A5B"
  coral-pressed: "#D9694A"
  coral-tint: "#FBE9E3"
  coral-ink: "#A9472B"
  on-coral: "#202A27"
  info: "#2563EB"
  info-tint: "#E7EEFD"
  info-ink: "#1D4ED8"
  warning: "#D97706"
  warning-tint: "#FDF1DC"
  warning-ink: "#92400E"
  verified: "#4F46E5"
  verified-tint: "#ECEBFD"
  verified-ink: "#4338CA"
  success: "#16A34A"
  success-tint: "#E3F4E8"
  success-ink: "#166534"
  danger: "#DC2626"
  danger-tint: "#FDECEC"
  danger-ink: "#B91C1C"
  ground: "#F7F6F0"
  surface: "#FFFFFF"
  stone: "#ECEEE8"
  line: "#DCE2DC"
  ink: "#202A27"
  ink2: "#3C4844"
  muted: "#65726C"
  sage: "#68756F"
  faint: "#97A29C"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: "38px"
    letterSpacing: "-0.6px"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "29px"
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "23px"
    letterSpacing: "-0.1px"
  subhead:
    fontFamily: "Archivo, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "21px"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: "23px"
  body-strong:
    fontFamily: "Archivo, sans-serif"
    fontSize: "15.5px"
    fontWeight: 600
    lineHeight: "22px"
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: "18px"
  caption:
    fontFamily: "Archivo, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: "17px"
  number:
    fontFamily: "Archivo, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: "32px"
    letterSpacing: "-0.4px"
    fontFeature: "tnum"
  number-sm:
    fontFamily: "Archivo, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "22px"
    fontFeature: "tnum"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
  xxxl: "40px"
  huge: "56px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "14px"
    padding: "0 20px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.brand-pressed}"
  button-report:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-coral}"
    typography: "{typography.label}"
    rounded: "14px"
    padding: "0 20px"
    height: "52px"
  button-report-hover:
    backgroundColor: "{colors.coral-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    rounded: "14px"
    height: "52px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    rounded: "14px"
    height: "52px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger-ink}"
    rounded: "14px"
    height: "52px"
  button-sm:
    height: "40px"
    padding: "0 16px"
  icon-button-float:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "14px"
    size: "46px"
  icon-button-tint:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand}"
    rounded: "14px"
    size: "46px"
  segmented:
    backgroundColor: "{colors.stone}"
    rounded: "{rounded.md}"
    padding: "3px"
  segmented-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    height: "34px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "14px"
    padding: "0 16px"
    height: "52px"
  status-tag:
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.caption}"
  urgent-tag:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.caption}"
  row:
    typography: "{typography.body-strong}"
    padding: "12px 0"
    height: "64px"
  row-you:
    backgroundColor: "{colors.brand-tint}"
    padding: "0 12px"
  screen-header:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "12px 20px 20px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.sage}"
    height: "68px"
  tab-bar-active:
    textColor: "{colors.brand}"
  tab-bar-report:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-coral}"
    rounded: "{rounded.md}"
    width: "52px"
    height: "34px"
  map-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "50px"
  map-sheet:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.xl}"
  report-drop:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-coral}"
    size: "40px"
  point-stone:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    size: "40px"
  panel-sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    width: "264px"
  panel-nav-active:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-pressed}"
    rounded: "14px"
  panel-card:
    backgroundColor: "{colors.surface}"
    rounded: "18px"
---

# Design System: SpeakUp Eco

## Overview

**Creative North Star: "Modernismo Cívico"**

O SpeakUp Eco fala com a voz do design público modernista brasileiro: sinalização clara, o calçadão de pedra portuguesa como assinatura de dados e uma única cor de chamado, reservada para a denúncia. É sinalização pública, não aplicativo de marca: um chão marfim carrega todas as telas, superfícies brancas recebem o que se destaca ou flutua, o carvão escreve o texto e um verde-petróleo marca a navegação e as ações principais, sempre em áreas pequenas. Nenhuma parte da moldura é um bloco escuro: cabeçalhos, barra de abas, barra lateral do painel e login são claros.

A hierarquia vem da escala tipográfica e de listas com linhas finas (hairline), nunca de pilhas de cartões. Títulos e números grandes usam Archivo em pesos fortes (Bold/ExtraBold), em proporção normal; o texto corrido usa o corte normal. Valores importantes ficam à direita, em algarismos tabulares. Sombras existem só no que flutua sobre o mapa. O padrão "app eco" de verde em tudo, cartões com sombra empilhados e ícones decorativos em quadradinhos tintados é recusado.

O mapa é a primeira tela e o centro do produto: marcadores com formas próprias (gota coral, pedra petróleo, ponto azul) ficam nas suas posições verdadeiras, e o painel inferior marfim resume o bairro com o mosaico de atividade.

**Key Characteristics:**
- Chão marfim (#F7F6F0), superfícies brancas e texto carvão (#202A27); cabeçalhos, barra de abas, barra lateral e login sempre claros.
- Verde-petróleo (#176B56) em áreas pequenas: marca, navegação ativa e botão principal.
- Coral queimado (#E77A5B) só na ação de denunciar e nos marcadores de denúncia, sempre com conteúdo em carvão.
- Estados das denúncias com cores semânticas próprias (azul, âmbar, índigo, verde, vermelho), separadas da marca.
- Archivo em proporção normal para tudo: ExtraBold/Bold em títulos e números, Regular/Medium/SemiBold no texto.
- Listas com divisórias finas, sem pilhas de cartões; valor à direita em algarismos tabulares.
- Mosaico de pedra portuguesa, com pedras talhadas à mão, como visualização de atividade e de progresso.
- Sombra apenas sobre o mapa; movimento com saída exponencial, desligado por "Reduzir movimento".

## Colors

Uma paleta de praça clara: marfim e branco no chão, carvão no texto, um verde-petróleo contido para marca e navegação, um coral queimado reservado para denunciar e uma família semântica separada para os estados.

### Primary
- **Verde-Petróleo** (brand): a marca e o "você está aqui" da navegação. Logotipo e nome SpeakUp Eco, aba ativa, fio de 4px do item ativo da barra lateral, botão principal (Como chegar, Também vi isso, Continuar, Entrar), segmento ativo, borda de campo em foco, links de seção ("Ver no mapa"), pedra do ponto de descarte, avatar padrão, ponto de não lida, barra de etapas da denúncia, contador de filtros. Contraste de 6,4:1 com o branco. **Petróleo Pressionado** (brand-pressed) é o hover do botão principal no painel e o texto do item ativo e do chip ativo no painel.
- **Realce Sálvia-Claro** (brand-tint): a cor da seleção. Chip selecionado (com borda e texto petróleo), linha "você" no ranking, botões de ícone tint nos cabeçalhos claros, item ativo da barra lateral, chips de material do ponto, fundo da denúncia sem foto, seleção de texto no painel.

### Secondary
- **Folha Suave** (brand-soft) e **Folha Média** (brand-mid): só dados. São os dois primeiros níveis do mosaico de atividade (o terceiro é o petróleo) e as cores dos níveis Semente e Broto no painel.

### Tertiary
- **Coral Queimado** (coral): só a ação de denunciar e as denúncias no mapa. Pastilha central "Denunciar" da barra de abas, botão "Enviar denúncia", botão "Nova denúncia" da barra lateral do painel, gota de denúncia no app e pino de denúncia no painel. **Coral Pressionado** (coral-pressed) é o hover do botão de denúncia no painel. **Sobre Coral** (on-coral) é o carvão de todo conteúdo sobre o coral (5,2:1; o branco daria 2,9:1).
- **Tinta Coral** (coral-ink): o coral legível como texto (5,8:1 no branco). Rótulo "Denunciar" da aba, tom de texto `coral`, contagem de denúncias abertas na barra lateral (sobre **Coral Claro**, coral-tint) e cor única de todas as categorias de denúncia no painel.
- **Estados semânticos**, separados da marca, cada um com cor de ponto, fundo claro (`-tint`) e tinta de texto (`-ink`): **Azul Informativo** (info) para "Recebida", o ponto "você" no mapa e o aviso informativo; **Âmbar** (warning) para "Em análise"; **Índigo** (verified) para "Verificada"; **Verde de Sucesso** (success) para "Resolvida"; **Vermelho** (danger) para urgência e erro: tag "Urgente" das denúncias de gravidade alta, borda do campo com erro, mensagem e aviso de erro, selo de notificações, ação "Excluir".

### Neutral
- **Marfim** (ground): o chão de todas as telas, do ScreenHeader, do painel inferior do mapa, da folha modal e do painel web.
- **Branco** (surface): cartões e superfícies. Barra de abas, barra lateral do painel, busca e botões flutuantes sobre o mapa, campos, chips, botão secundário, formulário do login, cartões do painel.
- **Pedra** (stone): preenchimento neutro. Trilho do segmentado, pedras vazias do mosaico, skeleton, linha pressionada, hover da navegação do painel, tag "Não confirmada".
- **Linha** (line): bordas de 1,5px de campos, chips e botão secundário; divisórias hairline; fio superior da barra de abas e da barra lateral; onda do calçadão; gota de denúncia encerrada; alça das folhas.
- **Carvão** (ink): texto principal, ícones dos botões flutuantes, tooltip do mapa no painel, véu da folha modal (42%) e a tinta de todas as sombras.
- **Grafite** (ink2): texto secundário forte, segmentos inativos, glifo da gota encerrada.
- **Cinza-Sálvia** (muted): texto secundário, legendas e placeholder da busca do mapa. É a sálvia escurecida até 4,5:1 sobre o marfim.
- **Sálvia** (sage): ícones e rótulos inativos da barra de abas branca (4,8:1 no branco); não é tom de texto corrido.
- **Cinza Tênue** (faint): só decorativo, chevrons e ícones de estado vazio.

### Named Rules
**The Small Petrol Rule.** O verde-petróleo marca, navega e confirma em áreas pequenas: botão, aba, segmento, fio, pedra. Nunca preenche cabeçalhos, barras, faixas ou telas; a moldura é marfim ou branca.

**The Coral Means Report Rule.** Coral queimado é só a ação de denunciar e o marcador de denúncia. Conteúdo sobre coral é carvão, nunca branco; texto coral usa coral-ink. Denúncia encerrada vira gota em linha com glifo grafite. No painel, toda categoria de denúncia é #A9472B e todo ponto é #176B56: o glifo diferencia a categoria, não a cor.

**The Status Is Not Brand Rule.** Estados usam só a família semântica (azul, âmbar, índigo, verde, vermelho), nunca o petróleo nem o coral. Erro e urgência são vermelhos, não coral.

**The Data Greens Rule.** No mosaico, a escala de atividade é folha suave, folha média e petróleo, sobre pedra vazia. Nenhuma outra cor entra na grade.

## Typography

**Display Font:** Archivo Bold e ExtraBold (@expo-google-fonts/archivo), em proporção normal. O corte expandido (wdth 125) foi abandonado porque achatava as letras.
**Body Font:** Archivo (400, 500, 600, 700, via @expo-google-fonts/archivo).

**Character:** Uma única família, diferenciada só pelo peso: ExtraBold/Bold dão presença aos títulos e números; os pesos leves mantêm o texto compacto e legível na rua.

### Hierarchy
- **Display** (Archivo ExtraBold): marca e números de destaque (posição no ranking, nome no login).
- **Title** (Archivo Bold): título dos cabeçalhos claros (ScreenHeader) e das etapas da denúncia.
- **Headline** (Archivo Bold): títulos de seção ("Perto de você", "Sua atividade", "Conquistas") e da folha modal.
- **Subhead** (Archivo SemiBold): títulos de estados vazios.
- **Body / Body Strong** (Archivo Regular / SemiBold): texto corrido e título de linha de lista. Largura de leitura máxima de 720px.
- **Label** (Archivo SemiBold): botões, segmentos, chips, rótulos de campo.
- **Caption** (Archivo Medium): subtítulos de linha, legendas do mosaico, tags de status, rótulos sob números.
- **Number / Number Sm** (Archivo ExtraBold/Bold, algarismos tabulares): contagens do bairro e do perfil; valores à direita das linhas (distância, pontos).

### Named Rules
**The Scale-Only Rule.** Todo texto usa uma variante da escala; não há tamanho solto. O tamanho escala com a acessibilidade até 1,4x.

**The Signpost Number Rule.** Números que importam são grandes, em peso forte e tabulares, com o rótulo em caption logo abaixo, separados por fios verticais finos, nunca em cartões.

## Layout

Grade em múltiplos de 4 (4 a 56px). Telas com margem lateral de 20px; seções separadas por 32px com título e 12px até o conteúdo. Conteúdo de leitura limitado a 720px e centralizado em tablets.

O Mapa ocupa a tela inteira. No topo flutuam a busca branca e o sino; abaixo, o segmento Tudo/Denúncias/Descarte e o botão Filtros, ambos em superfície branca. Embaixo, o painel marfim arrasta entre "espiar" e expandido; no tablet ele vira painel lateral flutuante de 420px à esquerda, com o mapa visível à direita. Ao selecionar um marcador, o painel vira o cartão do item, com a distância grande à direita e a ação principal em petróleo.

Marcadores no mesmo local ficam nas suas posições verdadeiras (sem deslocamento nem agrupamento no app). Os vizinhos do item selecionado são alcançados pela lista "Também neste local", abaixo do painel do item, separada por um fio fino.

Barra de abas branca com fio superior em linha, 68px mais a área segura, rótulos sempre abaixo do ícone; ordem Mapa, Descarte, Denunciar, Ranking, Perfil, com Denunciar no centro. Os demais cabeçalhos são o ScreenHeader marfim, fechado por um fio hairline.

No painel web, barra lateral branca de 264px (76px recolhida) a partir de lg, sobre o chão marfim.

## Elevation & Depth

O sistema é plano. Profundidade vem do contraste entre marfim e branco e de divisórias hairline. A sombra existe só para o que flutua sobre o mapa, sempre tingida de carvão, nunca preta.

### Shadow Vocabulary
- **Flutuante** (`0 6px 18px rgba(32,42,39,0.14)`; Android elevation 6): busca do mapa, botões de ícone sobre o mapa (localização, sino).
- **Flutuante Suave** (`0 3px 10px rgba(32,42,39,0.09)`; elevation 3): segmento e filtros sobre o mapa; borda dos marcadores (com contorno branco de 2px).
- **Painel do Mapa** (`0 -4px 18px rgba(32,42,39,0.12)`; elevation 12): o painel inferior que sobe do mapa.
- **Levantar** (`0 4px 12px -2px rgba(32,42,39,0.08), 0 2px 4px -2px rgba(32,42,39,0.04)`): só no painel web, no hover de um cartão interativo.

### Named Rules
**The Map-Only Shadow Rule.** Se o elemento não está sobre o mapa, ele não tem sombra. Listas, cabeçalhos, seções e formulários são planos; no painel, o cartão só levanta em resposta ao hover.

## Shapes

Cantos suavemente arredondados: 14px em botões, campos e botões de ícone; 12px em segmentos e avisos; 24px no topo das folhas e do painel do mapa; pílula em chips e tags de status. No painel, 14px em botões, campos e itens de navegação e 18px nos cartões. Bordas de controles têm 1,5px em linha; divisórias são hairline.

Três silhuetas próprias definem o mapa e se repetem nas listas: a **gota coral** (círculo com um canto de 16%, girado 45°), a **pedra de descarte** (quadrado petróleo com cantos de 24%) e o **ponto azul** do usuário. A **pedra portuguesa** do mosaico é irregular: cada lado recua até 13% e cada canto varia entre 1,5 e 5,5px, de forma determinística.

Ícones Lucide em traço único de 2px, acompanhando o texto, sem caixas decorativas atrás.

## Components

### Buttons
- **Shape:** cantos de 14px, borda de 1,5px; 52px de altura (40px no tamanho pequeno).
- **Primary:** fundo petróleo, texto branco em Label. A ação principal de cada tela ou painel (Como chegar, Também vi isso, Continuar, Entrar).
- **Report:** fundo coral, texto e ícone carvão. Só para denunciar ("Enviar denúncia", "Nova denúncia").
- **Secondary:** fundo branco, borda em linha, texto petróleo. **Quiet:** sem fundo nem borda, texto petróleo. **Danger:** texto em tinta vermelha, sem fundo ("Excluir denúncia", "Sair").
- **Pressed / Disabled:** encolhe para 97% em 160ms com saída exponencial; desabilitado a 45% de opacidade. No painel, o hover escurece para brand-pressed ou coral-pressed.

### Icon Buttons
- **Float:** branco com ícone carvão e sombra flutuante, sobre o mapa. **Plain:** sem fundo, para fechar. **Tint:** realce sálvia-claro com ícone petróleo, nos cabeçalhos claros (sino do perfil, mapa no Descarte).
- Selo de contagem vermelho com contorno branco de 2px.

### Chips
- **Style:** pílula de 36px, fundo branco, borda de 1,5px em linha, Label de 13px, ícone opcional de 15px.
- **State:** selecionado ganha fundo sálvia-claro, borda e texto petróleo. Não há variante escura.

### Segmented
- Trilho em pedra com 3px de respiro; segmento ativo em petróleo com texto branco, inativo em grafite. Sobre o mapa, trilho branco com sombra suave.

### Cards / Containers
- No app não há cartões. Conteúdo é organizado em **Linhas** (64px mínimo, título em Body Strong, subtítulo em caption, valor à direita em Number Sm ou chevron) separadas por divisórias hairline; ao pressionar, a linha fica em pedra. A linha "você" do ranking ganha fundo sálvia-claro.
- **Folha modal:** chão marfim, topo com cantos de 24px, alça de 38x4px em linha, fundo escurecido em carvão a 42%.
- **Painel web:** cartões brancos com borda de 1px em linha, cantos de 18px, sem sombra em repouso.

### Inputs / Fields
- **Style:** superfície branca, borda de 1,5px em linha, cantos de 14px, 52px de altura, Archivo 16px. Rótulo em Label acima.
- **Focus:** borda em petróleo.
- **Error:** borda vermelha (danger) e mensagem em tinta vermelha abaixo.

### Status Tag
- Pílula com ponto de 7px e texto caption semibold; cores do catálogo: Recebida em azul, Em análise em âmbar, Verificada em índigo, Resolvida em verde, Não confirmada em cinza-sálvia sobre pedra. Cada uma usa o ponto, o fundo `-tint` e o texto `-ink` da sua família.
- **Urgente:** denúncias de gravidade alta mostram uma pílula vermelho-clara com "Urgente" em tinta vermelha, ao lado do status.

### Navigation
- **Barra de abas:** branca com fio superior em linha; ícones de 23px; ativo em petróleo, inativo em sálvia; rótulos Archivo SemiBold 11,5px.
- **Denunciar:** pastilha coral de 52x34px com "+" carvão e rótulo em tinta coral negrito. É a ação principal do app.
- **ScreenHeader:** cabeçalho marfim com título em Title carvão, subtítulo em caption cinza-sálvia, fio hairline embaixo; ações à direita como botões de ícone tint.
- **Barra lateral do painel:** branca, borda direita em linha. Logotipo e nome em petróleo, botão "Nova denúncia" em coral no topo. Itens em cinza-sálvia (hover em pedra); o ativo ganha fundo sálvia-claro, texto brand-pressed e um fio petróleo de 4px à esquerda. A contagem de denúncias abertas é uma pastilha coral-tint com número em tinta coral.

### Mosaico de Pedra Portuguesa (assinatura)
- **Atividade:** colunas são semanas (8 a 26, conforme a largura) e linhas são dias; juntas de 2px. Toda pedra é dado: vazia em pedra ou em três níveis (folha suave, folha média, petróleo), com legenda "menos/mais". Não há pedra decorativa.
- **Progresso de nível:** faixa de duas fileiras; pedras conquistadas em petróleo assentam coluna a coluna em 900ms com saída exponencial. Só aqui aparece a onda de duas cores do calçadão: uma faixa em linha serpenteia entre as fileiras a cada 3 colunas nas pedras não conquistadas.

### Marcadores do mapa
- Gota coral de denúncia com glifo carvão (em linha com glifo grafite quando encerrada), pedra petróleo de descarte com glifo branco, ponto azul do usuário. No mapa, contorno branco de 2px e sombra suave; selecionado, cresce e ganha halo carvão a 12%.
- No painel, o pino de denúncia é coral com glifo carvão e um ponto de 11px na cor do status; o ponto de descarte é a pedra petróleo, selecionada com halo petróleo a 35%.

## Do's and Don'ts

### Do:
- **Do** reservar o coral (#E77A5B) para a ação de denunciar e os marcadores de denúncia, com conteúdo em carvão (#202A27).
- **Do** usar o petróleo (#176B56) em áreas pequenas: botão principal, aba e item de navegação ativos, segmento ativo, foco, links de seção.
- **Do** marcar seleção com o realce sálvia-claro (#DDEBE2): chips, linha "você", botões de ícone tint, item ativo do painel.
- **Do** usar cinza-sálvia (#65726C) para texto secundário sobre marfim; a sálvia (#68756F) fica para ícones e rótulos inativos sobre branco.
- **Do** tirar as cores de status da família semântica do catálogo e mostrar a tag "Urgente" vermelha nas denúncias de gravidade alta.
- **Do** construir hierarquia com a escala tipográfica e divisórias hairline em linha (#DCE2DC).
- **Do** pôr títulos e números em Archivo Bold/ExtraBold, com números tabulares alinhados à direita.
- **Do** limitar sombras ao que flutua sobre o mapa, sempre tingidas de carvão (rgba(32,42,39,…)).
- **Do** manter cada pedra do mosaico de atividade como dado, na escala folha suave, folha média, petróleo.
- **Do** checar `shouldAnimate()` antes de qualquer animação e ir direto ao estado final quando "Reduzir movimento" estiver ativo.
- **Do** manter marcadores no mesmo local nas posições verdadeiras e oferecer a lista "Também neste local".

### Don't:
- **Don't** pintar cabeçalhos, barra de abas, barra lateral, login ou faixas inteiras de petróleo ou carvão.
- **Don't** pôr texto ou ícone branco sobre o coral.
- **Don't** usar coral para erros, status ou destaques; erro e urgência são vermelhos.
- **Don't** usar o petróleo ou o coral para indicar estado de uma denúncia.
- **Don't** diferenciar categorias por cor; o glifo diferencia, a cor diz só denúncia (coral) ou descarte (petróleo).
- **Don't** usar amarelo-ipê nem gradientes em faixas, banners ou placeholders.
- **Don't** empilhar cartões com sombra fora do mapa.
- **Don't** colocar ícones decorativos dentro de quadradinhos tintados.
- **Don't** usar a onda de duas cores fora da faixa de progresso, nem pedras decorativas na grade de atividade.
- **Don't** usar tamanhos de texto fora da escala.
- **Don't** deslocar nem agrupar marcadores no app para separá-los.
