/**
 * Pontos de descarte: buscar por material, filtrar por categoria e ver o mais perto primeiro.
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Banner, Chip, Divider, EmptyState, ScreenHeader, IconButton, PointStone, SkeletonRows } from '@/design/components';
import { Icon } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, font, radius, readable, space } from '@/design/tokens';
import { api } from '@/lib/api';
import { POINT_CATEGORIES, pointCategory } from '@/lib/catalog';
import { formatDistance } from '@/lib/format';
import { withDistance } from '@/lib/insights';
import { useMyLocation } from '@/lib/location';
import { useApi } from '@/lib/useApi';

export default function PointsScreen() {
  const router = useRouter();
  const location = useMyLocation();
  const { data, error, loading, refreshing, reload } = useApi(() => api.points());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withDistance((data ?? []).filter((p) => (!category || p.categoria === category)
      && (!q || `${p.nome} ${p.residuos_aceitos.join(' ')} ${pointCategory(p.categoria).label}`.toLowerCase().includes(q))), location.coords);
  }, [data, query, category, location.coords]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data ?? []).forEach((p) => { c[p.categoria] = (c[p.categoria] ?? 0) + 1; });
    return c;
  }, [data]);

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Descarte certo"
        subtitle={location.coords ? 'Ordenado pelo mais perto de você' : 'Distâncias a partir do centro de Sorocaba'}
        right={<IconButton icon="map" label="Ver no mapa" variant="tint" onPress={() => router.navigate({ pathname: '/', params: { tipo: 'descarte' } })} />}
      >
        <View style={styles.search}>
          <Icon name="search" size={18} tint={color.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="O que você quer descartar? Pilha, óleo…"
            placeholderTextColor={color.muted}
            style={styles.input}
            accessibilityLabel="Buscar por material"
          />
          {!!query && <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Limpar busca"><Icon name="x" size={18} tint={color.muted} /></Pressable>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }} style={{ marginHorizontal: -space.lg }} contentInset={{ left: space.lg, right: space.lg }}>
          <View style={{ width: space.lg - space.xs }} />
          <Chip label="Todos" selected={!category} onPress={() => setCategory(null)} />
          {Object.entries(POINT_CATEGORIES).filter(([k]) => counts[k]).map(([k, c]) => (
            <Chip key={k} label={c.label} icon={c.icon} selected={category === k} onPress={() => setCategory(category === k ? null : k)} />
          ))}
          <View style={{ width: space.lg - space.xs }} />
        </ScrollView>
      </ScreenHeader>

      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={[readable, { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={color.brand} />}
        ItemSeparatorComponent={() => <Divider inset={56} />}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.xs }}>
            {error && <Banner text={error} action="Tentar" onAction={reload} />}
            {!loading && !!list.length && <Text variant="label" tone="muted">{list.length} {list.length === 1 ? 'local' : 'locais'}</Text>}
            {loading && <SkeletonRows count={5} />}
          </View>
        }
        ListEmptyComponent={loading ? undefined : (
          <EmptyState
            icon="recycle"
            title={query || category ? 'Nenhum local para essa busca' : 'Nenhum ponto cadastrado ainda'}
            text={query || category ? 'Tente outro material ou remova o filtro.' : 'Os pontos de descarte são cadastrados pela equipe no painel web.'}
            action={query || category ? 'Limpar busca' : undefined}
            onAction={() => { setQuery(''); setCategory(null); }}
          />
        )}
        renderItem={({ item: p }) => (
          <Pressable onPress={() => router.push(`/ponto/${p.id}`)} style={({ pressed }) => [styles.item, pressed && { backgroundColor: color.stone }]} accessibilityRole="button">
            <PointStone category={p.categoria} size={42} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="bodyStrong" numberOfLines={2}>{p.nome}</Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>{pointCategory(p.categoria).label} · {p.horario || 'horário não informado'}</Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>{p.residuos_aceitos.join(' · ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', minWidth: 58 }}>
              <Text variant="numberSm">{formatDistance(p.km)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { height: 50, borderRadius: radius.md + 2, backgroundColor: color.surface, borderWidth: 1.5, borderColor: color.line, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md },
  input: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 15.5, color: color.ink },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, paddingVertical: space.md, borderRadius: radius.sm },
});
