/**
 * Panorama ambiental — os mesmos indicadores do painel web, para o celular:
 * números do período, evolução (registradas × resolvidas), taxa de resolução,
 * denúncias por categoria e situação, e bairros em destaque.
 * Tudo calculado a partir das denúncias públicas do servidor (sem dados fictícios).
 */
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CountBars } from '@/components/CountBars';
import { HeatMap } from '@/components/map/HeatMap';
import { HEAT_STOPS } from '@/components/map/heat';
import { Banner, IconButton, Section, Segmented, SkeletonRows } from '@/design/components';
import { Text } from '@/design/Text';
import { color, radius, readable, space } from '@/design/tokens';
import { api, type Report } from '@/lib/api';
import { REPORT_CATEGORIES, STATUSES, statusInfo } from '@/lib/catalog';
import { useApi } from '@/lib/useApi';

type Period = '30' | '90' | '365' | 'all';
const PERIODS: { value: Period; label: string }[] = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
  { value: 'all', label: 'Tudo' },
];

const DAY = 86_400_000;
const REGISTERED = color.coral;
const RESOLVED = color.success;

/** "Rua X, Bairro · Sorocaba – SP" → "Bairro" */
function neighborhood(r: Report) {
  const first = (r.endereco ?? '').split(' · ')[0];
  const part = first.split(',').pop()?.trim();
  return part || 'Sem endereço';
}

function formatDuration(ms: number | null) {
  if (ms == null) return '—';
  const h = ms / 3_600_000;
  return h < 48 ? `${Math.max(1, Math.round(h))} h` : `${Math.round(h / 24)} dias`;
}

export default function PanoramaScreen() {
  const router = useRouter();
  // Volta para a tela anterior; se a tela foi aberta direto (link ou recarga), vai para o mapa
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const [period, setPeriod] = useState<Period>('90');
  const { data, error, loading, refreshing, reload } = useApi(async () => {
    const [reports, points] = await Promise.all([api.reports(), api.points()]);
    return { reports, points, at: Date.now() };
  });

  const stats = useMemo(() => {
    const all = data?.reports ?? [];
    const now = data?.at ?? 0;
    const since = period === 'all' ? 0 : now - Number(period) * DAY;
    const list = all.filter((r) => new Date(r.created_at).getTime() >= since);
    const resolved = list.filter((r) => r.status === 'resolvida');
    const open = list.filter((r) => statusInfo(r.status).open);
    // Tempo até resolver: do registro até a última atualização (quando foi marcada como resolvida)
    const durations = resolved.map((r) => new Date(r.updated_at ?? r.created_at).getTime() - new Date(r.created_at).getTime()).filter((d) => d >= 0);

    // Evolução: semanas (30/90 dias) ou meses (12 meses / tudo)
    const monthly = period === '365' || period === 'all';
    const buckets: { label: string; start: number; end: number; registered: number; resolved: number }[] = [];
    if (monthly) {
      const d = new Date(now);
      for (let i = 11; i >= 0; i--) {
        const start = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
        const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
        buckets.push({ label: new Date(start).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), start, end, registered: 0, resolved: 0 });
      }
    } else {
      const weeks = period === '30' ? 5 : 13;
      for (let i = weeks - 1; i >= 0; i--) {
        const end = now - i * 7 * DAY;
        const start = end - 7 * DAY;
        buckets.push({ label: new Date(start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), start, end, registered: 0, resolved: 0 });
      }
    }
    for (const r of all) {
      const c = new Date(r.created_at).getTime();
      const b = buckets.find((x) => c >= x.start && c < x.end);
      if (b) b.registered += 1;
      if (r.status === 'resolvida') {
        const u = new Date(r.updated_at ?? r.created_at).getTime();
        const br = buckets.find((x) => u >= x.start && u < x.end);
        if (br) br.resolved += 1;
      }
    }

    // Bairros em destaque
    const byPlace = new Map<string, { total: number; resolved: number }>();
    for (const r of list) {
      const k = neighborhood(r);
      const v = byPlace.get(k) ?? { total: 0, resolved: 0 };
      v.total += 1;
      if (r.status === 'resolvida') v.resolved += 1;
      byPlace.set(k, v);
    }
    const places = [...byPlace.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 6);

    return {
      total: list.length,
      resolved: resolved.length,
      open: open.length,
      rate: list.length ? resolved.length / list.length : 0,
      avg: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      buckets,
      monthly,
      categories: Object.entries(REPORT_CATEGORIES).map(([key, c]) => ({
        key, label: c.label, color: c.color, icon: c.icon, count: list.filter((r) => r.categoria === key).length,
      })),
      statuses: Object.entries(STATUSES).map(([key, s]) => ({
        key, label: s.label, color: s.dot, icon: s.icon, count: list.filter((r) => r.status === key).length,
      })),
      places,
      // Mapa de calor: denúncias abertas pesam mais que as já encerradas
      heat: list.flatMap((r) => (r.latitude != null && r.longitude != null
        ? [{ latitude: Number(r.latitude), longitude: Number(r.longitude), weight: statusInfo(r.status).open ? 1 : 0.4 }]
        : [])),
    };
  }, [data, period]);

  // Até ~5 rótulos no eixo, para caberem sem cortar
  const labelStep = Math.ceil(stats.buckets.length / 5);
  const max = Math.max(1, ...stats.buckets.flatMap((b) => [b.registered, b.resolved]));

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Stack.Screen options={{
        title: 'Panorama ambiental',
        headerLeft: () => <IconButton icon="arrow-left" label="Voltar" variant="plain" size={40} onPress={goBack} />,
      }} />
      <ScrollView
        contentContainerStyle={[readable, { paddingHorizontal: space.lg, paddingBottom: space.xxxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={color.brand} />}
      >
        <Text variant="body" tone="muted" style={{ marginTop: space.sm }}>
          Indicadores das denúncias registradas pela comunidade, atualizados com os dados do servidor.
        </Text>
        <Segmented value={period} onChange={setPeriod} options={PERIODS} style={{ marginTop: space.md, alignSelf: 'stretch' }} />

        {error && <View style={{ marginTop: space.md }}><Banner text={error} action="Tentar" onAction={reload} /></View>}

        {loading ? <SkeletonRows count={4} /> : (
          <>
            {/* Números do período */}
            <View style={styles.figures}>
              <Figure value={stats.total} label="denúncias no período" />
              <Figure value={stats.resolved} label="resolvidas" />
              <Figure value={stats.open} label="em aberto" />
              <Figure value={data?.points.length ?? 0} label="pontos de descarte" />
            </View>

            {/* Taxa de resolução */}
            <Section title="Taxa de resolução">
              <View style={styles.rateRow}>
                <Text variant="number" style={{ color: RESOLVED }}>{Math.round(stats.rate * 100)}%</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.track}><View style={[styles.fill, { width: `${stats.rate * 100}%`, backgroundColor: RESOLVED }]} /></View>
                  <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>
                    {stats.resolved} de {stats.total} resolvidas · tempo médio até resolver: {formatDuration(stats.avg)}
                  </Text>
                </View>
              </View>
            </Section>

            {/* Evolução */}
            <Section title="Evolução ao longo do tempo">
              <View style={styles.legend}>
                <Legend color={REGISTERED} label="Registradas" />
                <Legend color={RESOLVED} label="Resolvidas" />
                <Text variant="caption" tone="muted">{stats.monthly ? 'por mês' : 'por semana'}</Text>
              </View>
              <View style={styles.chart} accessibilityLabel="Gráfico de denúncias registradas e resolvidas por período">
                {stats.buckets.map((b, i) => (
                  <View key={b.start} style={styles.col}>
                    <View style={styles.bars}>
                      <View style={[styles.bar, { height: `${(b.registered / max) * 100}%`, backgroundColor: REGISTERED }]} />
                      <View style={[styles.bar, { height: `${(b.resolved / max) * 100}%`, backgroundColor: RESOLVED }]} />
                    </View>
                    <Text variant="caption" tone="muted" style={[styles.colLabel, !(i % labelStep === 0 || i === stats.buckets.length - 1) && { opacity: 0 }]}>
                      {b.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Mapa de calor">
              <Text variant="caption" tone="muted">Onde as denúncias do período se concentram. Arraste e use dois dedos para aproximar.</Text>
              <View style={styles.heat}>
                <HeatMap points={stats.heat} />
              </View>
              <View style={styles.heatLegend}>
                <Text variant="caption" tone="muted">Menos</Text>
                <View style={styles.heatScale}>
                  {HEAT_STOPS.slice(1).map(([k, c]) => <View key={k} style={{ flex: 1, backgroundColor: c }} />)}
                </View>
                <Text variant="caption" tone="muted">Mais</Text>
              </View>
            </Section>

            <Section title="Denúncias por categoria">
              <CountBars items={stats.categories} empty="Nenhuma denúncia neste período." />
            </Section>

            <Section title="Denúncias por situação">
              <CountBars items={stats.statuses} empty="Nenhuma denúncia neste período." />
            </Section>

            <Section title="Bairros em destaque">
              {stats.places.length ? stats.places.map((p, i) => (
                <View key={p.name} style={[styles.place, i > 0 && styles.placeRule]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text>
                    <Text variant="caption" tone="muted">{p.total} {p.total === 1 ? 'denúncia' : 'denúncias'} · {p.resolved} resolvidas</Text>
                  </View>
                  <Text variant="label" style={{ color: RESOLVED, fontVariant: ['tabular-nums'] }}>{Math.round((p.resolved / p.total) * 100)}%</Text>
                </View>
              )) : <Text variant="body" tone="muted">Nenhuma denúncia neste período.</Text>}
              {stats.places.length > 0 && <Text variant="caption" tone="muted">% = parte das denúncias do bairro que já foi resolvida.</Text>}
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.figure}>
      <Text variant="number">{value}</Text>
      <Text variant="caption" tone="muted">{label}</Text>
    </View>
  );
}

function Legend({ color: c, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
      <Text variant="caption">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  figures: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.lg, rowGap: space.md },
  figure: { width: '50%', gap: 2, paddingRight: space.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: color.stone, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 4, paddingTop: space.xs },
  col: { flex: 1, height: '100%', alignItems: 'center' },
  bars: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  bar: { flex: 1, maxWidth: 12, minHeight: 2, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  heat: { height: 260, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.stone, marginTop: space.xs },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  heatScale: { flex: 1, height: 8, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row' },
  colLabel: { fontSize: 10, marginTop: 4, width: 44, flexShrink: 0, textAlign: 'center' },
  place: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  placeRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
});
