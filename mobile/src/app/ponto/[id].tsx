/**
 * Detalhe do ponto de descarte: onde fica, quando abre, o que aceita e como preparar.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EcoMap } from '@/components/map/EcoMap';
import { Banner, Button, IconButton, PointStone, Skeleton } from '@/design/components';
import { Icon } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, radius, readable, space } from '@/design/tokens';
import { api } from '@/lib/api';
import { pointCategory } from '@/lib/catalog';
import { formatDistance, openDirections } from '@/lib/format';
import { withDistance } from '@/lib/insights';
import { useMyLocation } from '@/lib/location';
import { useApi } from '@/lib/useApi';

export default function PointDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useMyLocation();
  const { data: p, error, loading, reload } = useApi(() => api.point(id), id);

  const back = (
    <View style={[styles.back, { top: insets.top + space.xs }]}>
      <IconButton icon="arrow-left" label="Voltar" onPress={() => router.back()} />
    </View>
  );

  if (loading || !p) {
    return (
      <View style={{ flex: 1, backgroundColor: color.ground }}>
        <Stack.Screen options={{ headerShown: false }} />
        {loading ? <Skeleton height={300} style={{ borderRadius: 0 }} /> : (
          <View style={{ paddingTop: insets.top + 72, paddingHorizontal: space.lg }}>
            <Banner text={error ?? 'Ponto não encontrado.'} action="Tentar" onAction={reload} />
          </View>
        )}
        {back}
      </View>
    );
  }

  const cat = pointCategory(p.categoria);
  const km = p.latitude != null ? withDistance([p], location.coords)[0]?.km ?? null : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {p.latitude != null ? (
          <View style={{ height: 300 + insets.top }}>
            <EcoMap
              markers={[{ id: 'p', kind: 'point', latitude: p.latitude, longitude: p.longitude!, category: p.categoria, selected: true }]}
              initialCenter={{ latitude: p.latitude, longitude: p.longitude! }}
              initialZoom="street"
              userLocation={location.coords}
              interactive={false}
            />
          </View>
        ) : <View style={{ height: insets.top + 72 }} />}

        <View style={[readable, { paddingHorizontal: space.lg, paddingTop: space.xl, gap: space.lg }]}>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <PointStone category={p.categoria} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="title">{p.nome}</Text>
              <Text variant="label" tone="brand">{cat.label}</Text>
            </View>
          </View>

          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text variant="caption" tone="muted">Distância</Text>
              <Text variant="numberSm">{formatDistance(km)}</Text>
            </View>
            <View style={[styles.fact, styles.factRule]}>
              <Text variant="caption" tone="muted">Funcionamento</Text>
              <Text variant="bodyStrong">{p.horario || 'Não informado'}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Icon name="pin" size={18} tint={color.muted} />
            <Text variant="body" style={{ flex: 1 }}>{p.endereco || p.descricao_local || 'Endereço não informado'}</Text>
          </View>

          <View style={{ gap: space.sm }}>
            <Text variant="headline">O que aceita</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
              {p.residuos_aceitos.map((m) => (
                <View key={m} style={styles.material}>
                  <Icon name="check" size={14} tint={color.brand} strokeWidth={2.6} />
                  <Text variant="label">{m}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: space.xs }}>
            <Text variant="headline">Como preparar</Text>
            <Text variant="body" tone="secondary">{cat.tip}</Text>
            {!!p.descricao_local && p.endereco && <Text variant="body" tone="secondary">{p.descricao_local}</Text>}
          </View>
        </View>
      </ScrollView>

      {p.latitude != null && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + space.sm }]}>
          <Button label="Como chegar" icon="navigation" onPress={() => openDirections(p.latitude!, p.longitude!, p.nome)} />
        </View>
      )}
      {back}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', left: space.md },
  facts: { flexDirection: 'row' },
  fact: { flex: 1, gap: 2 },
  factRule: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.line, paddingLeft: space.md },
  material: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.sm, height: 34, borderRadius: radius.pill, backgroundColor: color.brandTint },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: color.ground, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
});
