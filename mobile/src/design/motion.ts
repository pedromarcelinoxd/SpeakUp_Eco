/**
 * Movimento com respeito à acessibilidade:
 * - "Reduzir movimento" ativado no sistema → estados finais sem animação;
 * - tela não visível (aba/janela oculta) → não inicia animação de entrada.
 */
import { AccessibilityInfo, Platform } from 'react-native';

// Na pré-visualização web, `?reduzir-movimento` simula a preferência do sistema (capturas e testes).
let reduceMotion = Platform.OS === 'web' && typeof location !== 'undefined' && location.search.includes('reduzir-movimento');
const forced = reduceMotion;
AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion = forced || v; }).catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduceMotion = forced || v; });

export function shouldAnimate() {
  if (reduceMotion) return false;
  if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  return true;
}
