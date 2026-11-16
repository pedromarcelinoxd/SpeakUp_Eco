/**
 * Legenda do mapa: cor e ícone de cada categoria de ocorrência, pontos de
 * descarte, agrupamentos e ocorrências encerradas.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { ClusterBubble, IconButton, PointStone, ReportDrop } from '@/design/components';
import { Text } from '@/design/Text';
import { color, float, radius, space } from '@/design/tokens';
import { REPORT_CATEGORIES } from '@/lib/catalog';

export function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.card} accessibilityLabel="Legenda do mapa">
      <View style={styles.head}>
        <Text variant="label" style={{ flex: 1 }}>Legenda</Text>
        <IconButton icon="x" label="Fechar legenda" variant="plain" size={32} onPress={onClose} />
      </View>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 7 }}>
        {Object.entries(REPORT_CATEGORIES).map(([k, c]) => (
          <View key={k} style={styles.row}>
            <View style={styles.mark}><ReportDrop category={k} size={20} /></View>
            <Text variant="caption" style={{ flex: 1 }}>{c.label}</Text>
          </View>
        ))}
        <View style={styles.rule} />
        <View style={styles.row}>
          <View style={styles.mark}><PointStone category="ecoponto" size={20} /></View>
          <Text variant="caption" style={{ flex: 1 }}>Ponto de descarte (ecoponto)</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.mark}><ReportDrop category="outros" size={20} muted /></View>
          <Text variant="caption" style={{ flex: 1 }}>Ocorrência encerrada</Text>
        </View>
        <View style={styles.row}>
          <View style={[styles.mark, { transform: [{ scale: 0.62 }] }]}><ClusterBubble count={8} hasReports /></View>
          <Text variant="caption" style={{ flex: 1 }}>Vários itens próximos — toque para aproximar</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space.sm, paddingTop: space.xs, ...float },
  head: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mark: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginVertical: 2 },
});
