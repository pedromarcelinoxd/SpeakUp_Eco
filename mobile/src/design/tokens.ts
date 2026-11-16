/**
 * EcoRadar — design tokens.
 *
 * Fundo marfim · cartões brancos · texto carvão · verde-petróleo para marca,
 * navegação ativa e botões principais (em áreas pequenas, nunca em grandes blocos)
 * · coral queimado só para a ação de denunciar e os marcadores de ocorrência.
 * Estados das denúncias usam cores semânticas próprias (azul, âmbar, verde,
 * vermelho), separadas da paleta da marca.
 */
import { Platform } from 'react-native';

export const color = {
  // Marca: verde-petróleo
  brand: '#176B56',
  brandPressed: '#125847',
  brandTint: '#DDEBE2', // realce suave (seleção, linha "você", fundos de destaque)
  brandSoft: '#9CCBB3', // níveis dos dados (mosaico): brandSoft → brandMid → brand
  brandMid: '#3E8C74',

  // Fundo e superfícies
  ground: '#F7F6F0', // marfim suave
  surface: '#FFFFFF',
  stone: '#ECEEE8', // preenchimento neutro (trilhos, pedras vazias, esqueletos)
  line: '#DCE2DC', // bordas e divisórias

  // Texto
  ink: '#202A27', // carvão
  ink2: '#3C4844',
  muted: '#65726C', // cinza-sálvia (#68756F) levemente escurecido: >= 4,5:1 no marfim
  sage: '#68756F', // ícones inativos e elementos não textuais
  faint: '#97A29C', // só decorativo (chevrons, ícones de vazio)

  // Ação de denunciar e ocorrências: coral queimado
  coral: '#E77A5B',
  coralPressed: '#D9694A',
  coralTint: '#FBE9E3',
  coralInk: '#A9472B', // texto coral legível (5,8:1 no branco)
  onCoral: '#202A27', // conteúdo sobre o coral (carvão: 5,2:1; branco seria 2,9:1)

  // Estados semânticos das denúncias (não confundir com a marca)
  info: '#2563EB', infoTint: '#E7EEFD', infoInk: '#1D4ED8', // recebida / localização
  warning: '#D97706', warningTint: '#FDF1DC', warningInk: '#92400E', // em análise
  verified: '#4F46E5', verifiedTint: '#ECEBFD', verifiedInk: '#4338CA', // verificada
  success: '#16A34A', successTint: '#E3F4E8', successInk: '#166534', // resolvida
  danger: '#DC2626', dangerTint: '#FDECEC', dangerInk: '#B91C1C', // urgente / erro
} as const;

/** Escala de espaço em múltiplos de 4. */
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;

/** Largura máxima de leitura (tablets e telas largas). */
export const readable = { width: '100%', maxWidth: 720, alignSelf: 'center' } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Sombra apenas para o que flutua sobre o mapa. */
export const float = Platform.select({
  ios: { shadowColor: '#202A27', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 6 },
  default: { boxShadow: '0 6px 18px rgba(32,42,39,0.14)' } as object,
}) as object;

export const floatSoft = Platform.select({
  ios: { shadowColor: '#202A27', shadowOpacity: 0.09, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
  default: { boxShadow: '0 3px 10px rgba(32,42,39,0.09)' } as object,
}) as object;

export const font = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  heavy: 'Archivo_800ExtraBold', // títulos grandes e números, em proporção normal
} as const;

/** Escala tipográfica (tamanho / altura de linha). Hierarquia por escala, não por caixas. */
export const type = {
  display: { fontFamily: font.heavy, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  title: { fontFamily: font.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.3 },
  headline: { fontFamily: font.bold, fontSize: 18, lineHeight: 23, letterSpacing: -0.1 },
  subhead: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: font.regular, fontSize: 15.5, lineHeight: 23 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15.5, lineHeight: 22 },
  label: { fontFamily: font.semibold, fontSize: 13.5, lineHeight: 18 },
  caption: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17 },
  number: { fontFamily: font.heavy, fontSize: 28, lineHeight: 32, letterSpacing: -0.4, fontVariant: ['tabular-nums'] as const },
  numberSm: { fontFamily: font.bold, fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] as const },
} as const;

export type TypeVariant = keyof typeof type;

/** Duração e curvas de movimento: saída exponencial, sem quicar. */
export const motion = { fast: 160, base: 240, slow: 380 } as const;
