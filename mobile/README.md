# EcoRadar — aplicativo mobile (Android e iOS)

Aplicativo nativo em **React Native + Expo SDK 58** com **Expo Router**. Consome a mesma API Laravel do painel web: uma denúncia enviada pelo app aparece no painel e vice-versa.

## Recursos nativos

| Recurso | Biblioteca | Onde |
| --- | --- | --- |
| GPS da ocorrência e "minha localização" | `expo-location` | Mapa, Denunciar |
| Câmera e galeria (até 5 fotos) | `expo-image-picker` | Denunciar |
| Mapa interativo com a posição do usuário | `react-native-maps` (Apple Maps / Google Maps) | Mapa, detalhes |
| Notificações push | `expo-notifications` + backend (Expo Push API) | Toda mudança de status |
| Token de acesso protegido | `expo-secure-store` | Login |
| Rotas até pontos de descarte | app de mapas do aparelho | Descarte |

Abas: **Mapa · Denunciar · Descarte · Ranking · Perfil**. Também há telas de detalhe da denúncia e do ponto, além de notificações.

## Executar em desenvolvimento

1. Suba o backend acessível na rede (na raiz do projeto):

   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. Instale e inicie o app:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. Abra no celular com o **Expo Go** (lendo o QR Code), na mesma rede Wi-Fi do computador.

O app detecta o IP do computador automaticamente. Se não conectar, crie `mobile/.env` a partir de `.env.example` com `EXPO_PUBLIC_API_URL=http://SEU_IP:8000/api` e reinicie com `npx expo start --clear`. No emulador Android, o padrão é `http://10.0.2.2:8000/api`.

> Libere a porta 8000 no firewall do Windows caso o celular não alcance o servidor.

## Notificações push

O push exige um **development build** ou o app instalado: o Expo Go não recebe push remoto. Passos:

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # cria o projectId usado pelo push
npx eas-cli@latest build --profile development --platform android
```

Ao entrar no app, o token do aparelho é enviado para `POST /api/push-tokens`. O backend envia o push pela Expo Push API (sem chave) quando a denúncia é recebida, confirmada ou muda de status. As mesmas notificações ficam salvas no banco e aparecem no painel web.

## Gerar o app instalável (APK / IPA)

```bash
npx eas-cli@latest build --platform android   # APK/AAB
npx eas-cli@latest build --platform ios       # requer conta Apple Developer
```

**Google Maps no Android (build de produção):** o Expo Go já funciona sem chave. Para o APK/AAB, crie uma chave gratuita do *Maps SDK for Android* e adicione o plugin em `app.json`:

```json
["react-native-maps", { "androidGoogleMapsApiKey": "SUA_CHAVE" }]
```

No iOS é usado o Apple Maps, sem chave. Em produção, use HTTPS na `EXPO_PUBLIC_API_URL`.

## Design system

Fundo marfim, cartões brancos e texto carvão; verde-petróleo em áreas pequenas (marca, navegação ativa, botões principais) e coral queimado só para denunciar. Tokens em `src/design/tokens.ts`; nenhuma tela define cor própria.

| Papel | Token | Cor | Uso |
| --- | --- | --- | --- |
| Fundo principal | `ground` | `#F7F6F0` | Fundo das telas, cabeçalhos |
| Superfícies | `surface` | `#FFFFFF` | Cartões, campos, barra de abas, painel do mapa |
| Texto principal | `ink` | `#202A27` | Títulos e texto |
| Texto secundário | `muted` | `#65726C` | Legendas (sálvia `#68756F` levemente escurecido para 4,5:1 no marfim) |
| Marca | `brand` | `#176B56` | Botões principais, aba ativa, seleção, pontos de descarte, progresso |
| Denunciar | `coral` | `#E77A5B` | Aba/botão Denunciar e marcadores de ocorrência (conteúdo em carvão) |
| Realce suave | `brandTint` | `#DDEBE2` | Chips selecionados, linha "você", botões de ícone |
| Bordas | `line` | `#DCE2DC` | Bordas e divisórias |

Status das denúncias (separados da marca): recebida azul `info`, em análise âmbar `warning`, verificada índigo `verified`, resolvida verde `success`, urgente/erro vermelho `danger`.

- **Tipografia:** Archivo em proporção normal (Regular a SemiBold no texto; Bold e ExtraBold em títulos e números).
- **Ícones:** Lucide, traço de 2 px, o mesmo conjunto do painel web, sem caixas coloridas atrás.
- **Marcadores:** gota coral = denúncia (o glifo indica a categoria; encerradas ficam em pedra) · pedra verde-petróleo = ponto de descarte · ponto azul = você.
- **Assinatura:** o mosaico de pedra portuguesa — atividade da região/usuário (12 semanas) e progresso de nível.
- **Regras:** hierarquia por escala tipográfica, não por cartões; sombras só no que flutua sobre o mapa; ações destrutivas isoladas por espaço; valores (distância, pontos) alinhados à direita em algarismos tabulares.
- Componentes em `src/design/components.tsx`: `Button`, `IconButton`, `Segmented`, `Chip`, `Field`, `StatusTag`, `ReportDrop`, `PointStone`, `Row`, `Section`, `Sheet`, `ScreenHeader`, `EmptyState`, `Banner`, `Skeleton`.

## Pré-visualização no navegador (desenvolvimento)

Para inspecionar telas sem celular, o app também roda no navegador (o mapa usa Leaflet só nesse modo; no celular é o mapa nativo):

```bash
npx expo start --web
```

## Verificações

```bash
npm run typecheck     # TypeScript
npx expo-doctor       # dependências e configuração
```

## Estrutura

```
mobile/
  app.json                 permissões nativas, plugins, bundle id
  src/app/                 rotas (Expo Router)
    _layout.tsx            pilha raiz, rotas protegidas por login, toque em push
    login.tsx              entrar / criar conta
    (tabs)/                Mapa (index), Denunciar, Descarte, Ranking, Perfil
    denuncia/[id].tsx      detalhe, histórico, confirmar, excluir
    ponto/[id].tsx         detalhe do ponto e "Como chegar"
    notificacoes.tsx
  src/lib/                 api.ts (cliente REST), auth.tsx, push.ts, catalog.ts, theme.ts
  src/components/          componentes de interface
```
