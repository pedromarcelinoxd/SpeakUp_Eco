/**
 * Assinatura visual do EcoRadar: o mosaico de pedra portuguesa.
 *
 * Como num calçadão, cada pedra é talhada à mão: lados e cantos variam um pouco,
 * e as juntas entre elas ficam desiguais. Na grade de atividade TODA pedra é
 * dado (vazia ou verde) — nada decorativo compete com a legenda. A onda de duas
 * cores do calçadão aparece só na faixa de progresso, onde não há escala a ler.
 */
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View, type LayoutChangeEvent } from 'react-native';
import { dailyActivity } from '@/lib/insights';
import { shouldAnimate } from './motion';
import { Text } from './Text';
import { color, space } from './tokens';

const JOINT = 2; // junta mínima; a irregularidade da pedra alarga a junta visível
const LEVELS = [color.brandSoft, color.brandMid, color.brand];

/** Número pseudoaleatório determinístico (0–1) por pedra e por "faceta". */
function rnd(col: number, row: number, salt: number) {
  const h = Math.sin(col * 12.9898 + row * 78.233 + salt * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

function Stone({ size, col, row, fill }: { size: number; col: number; row: number; fill: string }) {
  // Cada lado recua de forma independente (até ~13% da pedra) e os cantos variam:
  // pedras de formatos diferentes, como as talhadas à mão.
  const cut = Math.min(3.2, size * 0.13);
  return (
    <View
      style={{
        width: size,
        height: size,
        paddingTop: rnd(col, row, 1) * cut,
        paddingBottom: rnd(col, row, 2) * cut,
        paddingLeft: rnd(col, row, 3) * cut,
        paddingRight: rnd(col, row, 4) * cut,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: fill,
          borderTopLeftRadius: 1.5 + rnd(col, row, 5) * 4,
          borderTopRightRadius: 1.5 + rnd(col, row, 6) * 4,
          borderBottomLeftRadius: 1.5 + rnd(col, row, 7) * 4,
          borderBottomRightRadius: 1.5 + rnd(col, row, 8) * 4,
        }}
      />
    </View>
  );
}

/**
 * Atividade (denúncias por dia). Colunas = semanas, linhas = dias; o número de
 * semanas acompanha a largura disponível, então a grade sempre preenche a linha.
 */
export function MosaicActivity({ dates, caption }: { dates: string[]; caption: string }) {
  const [w, setW] = useState(0);
  const weeks = w ? Math.max(8, Math.min(26, Math.floor((w + JOINT) / (24 + JOINT)))) : 12;
  const size = w ? (w - JOINT * (weeks - 1)) / weeks : 0;
  const days = useMemo(() => dailyActivity(dates.map((d) => ({ created_at: d })), weeks), [dates, weeks]);
  const max = Math.max(1, ...days);
  const total = days.reduce((a, b) => a + b, 0);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${total} registros nas últimas ${weeks} semanas`}>
      {!!size && (
        <View style={{ flexDirection: 'row', gap: JOINT }}>
          {Array.from({ length: weeks }).map((_, c) => (
            <View key={c} style={{ gap: JOINT }}>
              {Array.from({ length: 7 }).map((__, r) => {
                const v = days[c * 7 + r] ?? 0;
                const level = v === 0 ? -1 : Math.min(2, Math.floor((v / max) * 2.999));
                return <Stone key={r} size={size} col={c} row={r} fill={level >= 0 ? LEVELS[level] : color.stone} />;
              })}
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs, alignItems: 'center' }}>
        <Text variant="caption" tone="muted">{caption} · {weeks} semanas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="caption" tone="muted">menos</Text>
          {[color.stone, ...LEVELS].map((c) => <View key={c} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />)}
          <Text variant="caption" tone="muted">mais</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Progresso de nível como faixa de calçadão (2 fileiras). As pedras conquistadas,
 * em verde, assentam coluna a coluna — o momento animado do app.
 */
export function MosaicProgress({ value }: { value: number }) {
  const [anim] = useState(() => new Animated.Value(0));
  const [w, setW] = useState(0);
  const columns = w ? Math.max(14, Math.min(40, Math.floor((w + JOINT) / (18 + JOINT)))) : 18;
  const size = w ? (w - JOINT * (columns - 1)) / columns : 0;
  const total = columns * 2;
  const filled = Math.round(Math.max(0, Math.min(1, value)) * total);

  useEffect(() => {
    if (!shouldAnimate()) { anim.setValue(1); return; }
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
  }, [filled, anim]);

  const fill = color.brand;
  const empty = color.stone;
  // Segunda cor do calçadão: a onda em pedra escura entre as claras (só nas não conquistadas).
  const waveTone = color.line;
  const cols = useMemo(() => Array.from({ length: columns }), [columns]);

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ gap: JOINT, height: size ? size * 2 + JOINT : 20 }}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      {!!size && [0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row', gap: JOINT }}>
          {cols.map((_, col) => {
            const order = col * 2 + row;
            const isFilled = order < filled;
            // Onda: a faixa escura serpenteia entre as duas fileiras a cada 3 colunas.
            const wave = !isFilled && Math.floor(col / 3) % 2 === row;
            const appear = anim.interpolate({
              inputRange: [0, Math.min(0.99, (order + 1) / Math.max(filled, 1)), 1],
              outputRange: [0, 1, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={col}
                style={isFilled ? { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] } : null}
              >
                <Stone size={size} col={col} row={row} fill={isFilled ? fill : wave ? waveTone : empty} />
              </Animated.View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
