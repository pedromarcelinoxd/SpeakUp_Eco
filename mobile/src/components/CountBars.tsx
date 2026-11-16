/**
 * Barras horizontais simples: quantidade por categoria ou por status.
 * Substitui a grade de "atividade" (parecida com a do GitHub), que era difícil de ler.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, radius, space } from '@/design/tokens';

export type CountBarItem = { key: string; label: string; color: string; icon: IconName; count: number };

export function CountBars({ items, empty, onPress }: { items: CountBarItem[]; empty: string; onPress?: (key: string) => void }) {
  const list = items.filter((i) => i.count > 0).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...list.map((i) => i.count));
  if (!list.length) return <Text variant="body" tone="muted">{empty}</Text>;

  return (
    <View style={{ gap: space.sm }} accessibilityRole="list">
      {list.map((i) => (
        <Pressable
          key={i.key}
          onPress={onPress ? () => onPress(i.key) : undefined}
          disabled={!onPress}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={`${i.label}: ${i.count}`}
        >
          <View style={styles.head}>
            <Icon name={i.icon} size={15} tint={i.color} strokeWidth={2.2} />
            <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>{i.label}</Text>
            <Text variant="label" style={{ fontVariant: ['tabular-nums'] }}>{i.count}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(i.count / max) * 100}%`, backgroundColor: i.color }]} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: color.stone, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
