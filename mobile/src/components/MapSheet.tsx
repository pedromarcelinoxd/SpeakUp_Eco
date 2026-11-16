/**
 * Painel inferior do mapa com dois estados (resumo / expandido),
 * arrastável pela alça. Animação com saída exponencial, sem quique.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { shouldAnimate } from '@/design/motion';
import { color, motion, radius, space } from '@/design/tokens';

export type MapSheetHandle = { expand: () => void; collapse: () => void };

type Props = {
  peek: number; // altura visível no estado resumido
  children: (expanded: boolean) => ReactNode;
  onChange?: (expanded: boolean) => void;
};

export const MapSheet = forwardRef<MapSheetHandle, Props>(function MapSheet({ peek, children, onChange }, ref) {
  const { height, width } = useWindowDimensions();
  const wide = width >= 700;
  const full = Math.round(height * (wide ? 0.82 : 0.74));
  const closedY = full - peek;
  const y = useState(() => new Animated.Value(closedY))[0];
  const [expanded, setExpanded] = useState(false);
  const current = useRef(closedY);

  const snap = (open: boolean) => {
    const to = open ? 0 : closedY;
    current.current = to;
    setExpanded(open);
    onChange?.(open);
    if (!shouldAnimate()) { y.setValue(to); return; }
    Animated.timing(y, { toValue: to, duration: motion.slow, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
  };

  // Quando a altura do resumo muda (ex.: item selecionado), reposiciona.
  useEffect(() => {
    if (!expanded) {
      current.current = closedY;
      if (!shouldAnimate()) { y.setValue(closedY); return; }
      Animated.timing(y, { toValue: closedY, duration: motion.base, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closedY]);

  useImperativeHandle(ref, () => ({ expand: () => snap(true), collapse: () => snap(false) }));

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
    onPanResponderMove: (_, g) => y.setValue(Math.min(closedY, Math.max(0, current.current + g.dy))),
    onPanResponderRelease: (_, g) => {
      const pos = current.current + g.dy;
      snap(g.vy < -0.4 || (g.vy < 0.4 && pos < closedY / 2));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [closedY]);

  return (
    <Animated.View style={[styles.sheet, wide && styles.wide, { height: full, transform: [{ translateY: y }] }]}>
      <View {...pan.panHandlers}>
        <Pressable
          onPress={() => snap(!expanded)}
          style={styles.handleArea}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Recolher painel' : 'Expandir painel'}
        >
          <View style={styles.handle} />
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>{children(expanded)}</View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: color.ground, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    shadowColor: color.ink, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  // Tablet: painel lateral flutuante, o mapa continua visível à direita
  wide: { left: space.md, right: undefined, width: 420 },
  handleArea: { alignItems: 'center', paddingTop: space.xs, paddingBottom: space.xs },
  handle: { width: 40, height: 4.5, borderRadius: 3, backgroundColor: color.line },
});
