# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users
Two audiences, served equally:
- **Comunidade FACENS** (alunos e funcionários do campus, Sorocaba/SP): o piloto real. Registram problemas ambientais no campus e encontram pontos de coleta próximos.
- **Moradores da cidade**: cidadãos que veem um problema no bairro (descarte irregular, entulho, queimada, poluição da água, dano ambiental) e querem registrá-lo em segundos, além de saber onde descartar pilhas, óleo, eletrônicos, medicamentos, lâmpadas e recicláveis.

Situação típica: a pessoa está na rua, com o celular em uma mão, diante do problema ou procurando onde deixar um resíduo.

## Product Purpose
Plataforma colaborativa de monitoramento ambiental: identificar, denunciar e acompanhar ocorrências em um mapa compartilhado, e encontrar o destino correto para cada resíduo. Sucesso = denúncias bem documentadas (foto + localização), resolvidas e visíveis, e uma comunidade que volta a contribuir.

Slogan: **Identifique. Denuncie. Transforme.**

## Positioning
Um único mapa que junta problemas ambientais e soluções de descarte, alimentado pela comunidade e moderado por uma equipe — com pontuação que só existe depois da validação (não incentiva denúncias falsas). App mobile e painel web compartilham a mesma API, os mesmos dados e as mesmas regras.

## Operating Context
- App nativo (React Native + Expo) para Android e iOS; painel web (Laravel Blade) para a comunidade e para administradores que moderam o status.
- Fluxo de denúncia: categoria → foto (câmera/galeria) → localização (GPS ou mapa) → título/descrição/gravidade → revisão → envio.
- Status: Recebida, Em análise, Verificada, Resolvida, Não confirmada. O autor recebe notificação (banco + push) a cada mudança.
- Projeto acadêmico (UPX, Engenharia da Computação, FACENS) que será apresentado em banca e usado como portfólio.

## Capabilities and Constraints
- Backend Laravel 12 + Sanctum; endpoints em `routes/api.php`. Não recriar o backend.
- Recursos nativos: GPS, câmera/galeria, mapa com localização do usuário, push (Expo), armazenamento seguro de token.
- Gamificação: +50 por denúncia validada, +10 por confirmação validada; níveis Semente (0), Broto (200), Guardião Ambiental (600), Protetor Ambiental (1500).
- Mapas sem chave paga (react-native-maps no app; Leaflet + OSM/Esri no web).
- Conquistas (badges) ainda não existem no backend: qualquer conquista exibida deve ser derivada de dados reais já disponíveis (estatísticas, pontos, nível), nunca inventada.

## Brand Commitments
- Nome EcoRadar e slogan acima.
- Verde como cor da marca; a paleta inicial (#16A34A, #14532D, #DCFCE7, #F8FAFC, vermelho para denúncias, âmbar para análise, azul para informação) **pode ser reinterpretada** no redesign (confirmado pelo usuário).
- Marca: radar com folha (logo já existente no painel web).

## Evidence on Hand
- Dados reais vêm só da API. O painel web tem dados demonstrativos isolados em `resources/js/ecoradar/data/demo.js`, sempre rotulados "Demonstração"; o app não usa dados fictícios.
- Seeder opcional `EcoRadarDemoSeeder` cria ecopontos marcados "(demonstração)".
- Não existem depoimentos, métricas públicas nem parceiros oficiais: não inventar.

## Product Principles
1. **Registrar em segundos, com uma mão.** O caminho até "Enviar denúncia" é o mais curto e óbvio do app.
2. **O mapa é o produto.** Problemas e soluções aparecem no mesmo lugar, sempre com a localização do usuário como referência.
3. **Confiança antes de engajamento.** Status, histórico e validação são claros; pontos só existem após validação.
4. **Comunidade visível.** Confirmações, ranking e progresso mostram que cada contribuição importa — sem infantilizar.
5. **Verdade dos dados.** Nada fictício apresentado como real; estados vazios são honestos.

## Accessibility & Inclusion
Uso ao ar livre (sol forte) e com uma mão: contraste alto, alvos de toque ≥ 44pt, texto legível sem zoom, ações principais ao alcance do polegar. Público amplo (não só técnico): linguagem simples em português.
