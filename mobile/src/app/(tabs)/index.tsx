/**
 * Mapa — a experiência central do EcoRadar e a tela inicial.
 * Mapa em tela cheia; painel "Perto de você" com a leitura da região;
 * ao tocar num marcador, o painel vira o cartão do item.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EcoMap } from '@/components/map/EcoMap';
import type { EcoMapHandle, MapMarker } from '@/components/map/types';
import { MapSheet, type MapSheetHandle } from '@/components/MapSheet';
import {
  Banner, Button, Chip, Divider, IconButton, PointStone, ReportDrop, Row, Section, Segmented, Sheet, SkeletonRows, StatusTag,
} from '@/design/components';
import { Icon } from '@/design/Icon';
import { MosaicActivity } from '@/design/Mosaic';
import { Text } from '@/design/Text';
import { color, float, floatSoft, font, radius, space } from '@/design/tokens';
import { api, type Point, type Report } from '@/lib/api';
import { POINT_CATEGORIES, REPORT_CATEGORIES, pointCategory, reportCategory, statusInfo } from '@/lib/catalog';
import { formatDistance, openDirections, timeAgo } from '@/lib/format';
import { regionSummary, withDistance } from '@/lib/insights';
import { useMyLocation } from '@/lib/location';
import { useApi } from '@/lib/useApi';

type Mode = 'all' | 'reports' | 'points';
type Selected = { kind: 'report'; item: Report } | { kind: 'point'; item: Point } | null;

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tipo?: string }>();
  const insets = useSafeAreaInsets();
  const map = useRef<EcoMapHandle>(null);
  const sheet = useRef<MapSheetHandle>(null);
  const location = useMyLocation();

  const [mode, setMode] = useState<Mode>(params.tipo === 'descarte' ? 'points' : 'all');
  const [hiddenCats, setHiddenCats] = useState<string[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [confirming, setConfirming] = useState(false);

  // "Ver no mapa" a partir de Pontos de descarte: ajusta o modo quando o parâmetro muda
  const [lastTipo, setLastTipo] = useState(params.tipo);
  if (params.tipo !== lastTipo) {
    setLastTipo(params.tipo);
    if (params.tipo === 'descarte') { setMode('points'); setSelected(null); }
  }

  const { data, setData, error, loading, reload } = useApi(async () => {
    const [reports, points, notif] = await Promise.all([api.reports(), api.points(), api.notifications()]);
    return { reports, points, unread: notif.nao_lidas };
  });

  const q = query.trim().toLowerCase();
  const reports = useMemo(() => (data?.reports ?? []).filter((r) => r.latitude != null
    && mode !== 'points' && !hiddenCats.includes(r.categoria)
    && (showClosed || statusInfo(r.status).open)
    && (!q || `${r.titulo} ${r.endereco} ${reportCategory(r.categoria).label}`.toLowerCase().includes(q))), [data, mode, hiddenCats, showClosed, q]);
  const points = useMemo(() => (data?.points ?? []).filter((p) => p.latitude != null
    && mode !== 'reports' && !hiddenCats.includes(p.categoria)
    && (!q || `${p.nome} ${p.residuos_aceitos.join(' ')} ${pointCategory(p.categoria).label}`.toLowerCase().includes(q))), [data, mode, hiddenCats, q]);

  const markers: MapMarker[] = useMemo(() => [
    ...reports.map((r) => ({
      id: `r${r.id}`, kind: 'report' as const, latitude: r.latitude!, longitude: r.longitude!, category: r.categoria,
      closed: !statusInfo(r.status).open, selected: selected?.kind === 'report' && selected.item.id === r.id,
    })),
    ...points.map((p) => ({
      id: `p${p.id}`, kind: 'point' as const, latitude: p.latitude!, longitude: p.longitude!, category: p.categoria,
      selected: selected?.kind === 'point' && selected.item.id === p.id,
    })),
  ], [reports, points, selected]);

  const summary = useMemo(() => regionSummary(data?.reports ?? [], data?.points ?? [], location.coords), [data, location.coords]);
  const activityDates = useMemo(() => (data?.reports ?? []).map((r) => r.created_at), [data]);

  function select(id: string) {
    const isReport = id.startsWith('r');
    const num = Number(id.slice(1));
    const item = isReport ? data?.reports.find((r) => r.id === num) : data?.points.find((p) => p.id === num);
    if (!item || item.latitude == null) return;
    setSelected(isReport ? { kind: 'report', item: item as Report } : { kind: 'point', item: item as Point });
    setSearching(false);
    sheet.current?.collapse();
    map.current?.focus({ latitude: item.latitude, longitude: item.longitude! }, { zoom: 'street', offsetY: 260 });
  }

  async function locate() {
    const c = await location.request();
    if (!c) {
      Alert.alert('Localização desativada', 'Permita o acesso à localização nas configurações do aparelho para ver o que está perto de você.');
      return;
    }
    map.current?.focus(c, { zoom: 'neighborhood', offsetY: 200 });
  }

  async function confirm(r: Report) {
    setConfirming(true);
    try {
      const updated = await api.confirm(r.id);
      setSelected({ kind: 'report', item: updated });
      setData((d) => d && { ...d, reports: d.reports.map((x) => (x.id === updated.id ? updated : x)) });
    } catch (e) {
      Alert.alert('Não foi possível confirmar', e instanceof Error ? e.message : '');
    } finally {
      setConfirming(false);
    }
  }

  const toggleCat = (k: string) => setHiddenCats((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));
  const filterCount = hiddenCats.length + (showClosed ? 1 : 0);
  const dist = (lat: number | null, lng: number | null) => (lat == null ? null : withDistance([{ latitude: lat, longitude: lng }], location.coords)[0]?.km ?? null);

  // Marcadores no mesmo ponto (até 80 m): ficam acessíveis pelo painel, sem mover posições.
  const nearbySame = useMemo(() => {
    if (!selected) return [];
    const { latitude: lat, longitude: lng } = selected.item;
    if (lat == null || lng == null) return [];
    const selfId = `${selected.kind === 'report' ? 'r' : 'p'}${selected.item.id}`;
    const k = Math.cos((lat * Math.PI) / 180);
    return markers
      .filter((m) => m.id !== selfId && Math.hypot(m.latitude - lat, (m.longitude - lng) * k) * 111_000 <= 80)
      .map((m) => {
        const num = Number(m.id.slice(1));
        const name = m.kind === 'report'
          ? reports.find((r) => r.id === num)?.titulo ?? 'Denúncia'
          : points.find((x) => x.id === num)?.nome ?? 'Ponto de descarte';
        return { id: m.id, kind: m.kind, category: m.category, name };
      });
  }, [selected, markers, reports, points]);

  const peek = selected ? 262 + (nearbySame.length ? 30 + 38 * Math.min(nearbySame.length, 2) : 0) : searching && q ? 320 : 164;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <StatusBar style="dark" />
      <EcoMap
        ref={map}
        markers={markers}
        onMarkerPress={select}
        onMapPress={() => { setSelected(null); setSearching(false); }}
        userLocation={location.coords}
        initialCenter={location.coords ?? undefined}
        bottomInset={peek}
      />

      {/* Topo: busca, notificações, modo e filtros */}
      <View style={[styles.top, { paddingTop: insets.top + space.xs }]} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Icon name="search" size={18} tint={color.brand} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setSearching(true); setSelected(null); }}
              onFocus={() => setSearching(true)}
              placeholder="Buscar local ou material"
              placeholderTextColor={color.muted}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Buscar no mapa"
            />
            {!!query && (
              <Pressable onPress={() => { setQuery(''); setSearching(false); }} hitSlop={10} accessibilityLabel="Limpar busca">
                <Icon name="x" size={18} tint={color.muted} />
              </Pressable>
            )}
          </View>
          <IconButton icon="bell" label="Notificações" badge={data?.unread} onPress={() => router.push('/notificacoes')} size={50} />
        </View>
        <View style={styles.modeRow}>
          <Segmented
            value={mode}
            onChange={(m) => { setMode(m); setSelected(null); }}
            options={[{ value: 'all', label: 'Tudo' }, { value: 'reports', label: 'Denúncias' }, { value: 'points', label: 'Descarte' }]}
            style={[{ backgroundColor: color.surface }, floatSoft]}
          />
          <Pressable onPress={() => setFiltersOpen(true)} style={[styles.filterBtn, floatSoft]} accessibilityRole="button" accessibilityLabel="Filtros">
            <Icon name="sliders" size={17} />
            {filterCount > 0 && <View style={styles.filterDot}><Text variant="caption" tone="inverse" style={{ fontFamily: font.bold, fontSize: 11, lineHeight: 14 }}>{filterCount}</Text></View>}
          </Pressable>
        </View>
        {error && <View style={{ marginTop: space.xs }}><Banner text={error} action="Tentar" onAction={reload} /></View>}
      </View>

      {/* Localização */}
      <View style={[styles.locate, { bottom: peek + space.sm }]} pointerEvents="box-none">
        <IconButton icon="locate" label="Minha localização" onPress={locate} />
      </View>

      <MapSheet ref={sheet} peek={peek}>
        {(expanded) => (
          <ScrollView
            scrollEnabled={expanded || (searching && !!q)}
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.huge }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {selected?.kind === 'report' && (
              <ReportPanel
                r={selected.item}
                km={dist(selected.item.latitude, selected.item.longitude)}
                onClose={() => setSelected(null)}
                onConfirm={() => confirm(selected.item)}
                confirming={confirming}
                onDetails={() => router.push(`/denuncia/${selected.item.id}`)}
              />
            )}
            {selected?.kind === 'point' && (
              <PointPanel
                p={selected.item}
                km={dist(selected.item.latitude, selected.item.longitude)}
                onClose={() => setSelected(null)}
                onDetails={() => router.push(`/ponto/${selected.item.id}`)}
              />
            )}
            {selected && nearbySame.length > 0 && (
              <View style={styles.sameSpot}>
                <Text variant="caption" tone="muted">Também neste local</Text>
                {nearbySame.map((n) => (
                  <Pressable key={n.id} onPress={() => select(n.id)} style={styles.sameRow} accessibilityRole="button" accessibilityLabel={`Ver ${n.name}`}>
                    {n.kind === 'report' ? <ReportDrop category={n.category} size={22} /> : <PointStone category={n.category} size={22} />}
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{n.name}</Text>
                    <Icon name="chevron-right" size={16} tint={color.faint} />
                  </Pressable>
                ))}
              </View>
            )}

            {!selected && searching && !!q && (
              <View>
                <Text variant="headline">{reports.length + points.length} resultados</Text>
                <View style={{ marginTop: space.xs }}>
                  {[...withDistance(points, location.coords).slice(0, 6).map((p) => (
                    <Row key={`p${p.id}`} leading={<PointStone category={p.categoria} size={40} />} title={p.nome}
                      subtitle={pointCategory(p.categoria).label} value={formatDistance(p.km)} onPress={() => select(`p${p.id}`)} />
                  )), ...withDistance(reports, location.coords).slice(0, 6).map((r) => (
                    <Row key={`r${r.id}`} leading={<ReportDrop category={r.categoria} size={34} />} title={r.titulo ?? 'Denúncia'}
                      subtitle={`${reportCategory(r.categoria).label} · ${statusInfo(r.status).label}`} value={formatDistance(r.km)} onPress={() => select(`r${r.id}`)} />
                  ))]}
                  {!reports.length && !points.length && (
                    <Text variant="body" tone="muted" style={{ paddingVertical: space.lg }}>Nada encontrado para “{query}”. Tente um material, como “pilha” ou “óleo”.</Text>
                  )}
                </View>
              </View>
            )}

            {!selected && !(searching && q) && (
              <View>
                <View style={styles.sheetHead}>
                  <Text variant="title">Perto de você</Text>
                  <Text variant="caption" tone="muted">{location.coords ? 'raio de 2 km' : 'centro de Sorocaba'}</Text>
                </View>
                {loading ? <SkeletonRows count={1} /> : (
                  <View style={styles.figures}>
                    <Figure value={summary.openNear.length} label="abertas" accent={summary.openNear.length > 0 ? color.coralInk : undefined} />
                    <View style={styles.vrule} />
                    <Figure value={summary.resolved30.length} label="resolvidas em 30 dias" />
                    <View style={styles.vrule} />
                    <Figure value={summary.pointsNear.length} label="pontos de descarte" />
                  </View>
                )}

                <Section title="Atividade na região">
                  <MosaicActivity dates={activityDates} caption="Denúncias registradas" />
                </Section>

                <Section title="Abertas perto de você" action={summary.nearestReports.length ? 'Ver no mapa' : undefined} onAction={() => { setMode('reports'); sheet.current?.collapse(); }}>
                  {summary.nearestReports.length ? summary.nearestReports.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 && <Divider inset={52} />}
                      <Row leading={<ReportDrop category={r.categoria} size={36} />} title={r.titulo ?? 'Denúncia'}
                        subtitle={`${statusInfo(r.status).label} · ${timeAgo(r.created_at)}`} value={formatDistance(r.km)}
                        onPress={() => router.push(`/denuncia/${r.id}`)} />
                    </View>
                  )) : <Text variant="body" tone="muted">Nenhuma ocorrência aberta por perto. Viu algo? Use o botão Denunciar.</Text>}
                </Section>

                <Section title="Onde descartar" action="Ver todos" onAction={() => router.push('/descarte')}>
                  {summary.nearestPoints.length ? summary.nearestPoints.map((p, i) => (
                    <View key={p.id}>
                      {i > 0 && <Divider inset={52} />}
                      <Row leading={<PointStone category={p.categoria} size={38} />} title={p.nome}
                        subtitle={pointCategory(p.categoria).label} value={formatDistance(p.km)}
                        onPress={() => router.push(`/ponto/${p.id}`)} />
                    </View>
                  )) : <Text variant="body" tone="muted">Ainda não há pontos de descarte cadastrados.</Text>}
                </Section>

                {summary.recentlyResolved.length > 0 && (
                  <Section title="Resolvidas recentemente">
                    {summary.recentlyResolved.map((r) => (
                      <Row key={r.id} leading={<Icon name="circle-check" size={22} tint={color.brand} />} title={r.titulo ?? 'Denúncia'}
                        subtitle={`${reportCategory(r.categoria).label} · ${timeAgo(r.updated_at ?? r.created_at)}`}
                        onPress={() => router.push(`/denuncia/${r.id}`)} />
                    ))}
                  </Section>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </MapSheet>

      {/* Filtros */}
      <Sheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros do mapa">
        <ScrollView contentContainerStyle={{ gap: space.lg, paddingBottom: space.md }}>
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="muted">Problemas</Text>
            <View style={styles.wrap}>
              {Object.entries(REPORT_CATEGORIES).map(([k, c]) => (
                <Chip key={k} label={c.label} icon={c.icon} selected={!hiddenCats.includes(k)} onPress={() => toggleCat(k)} />
              ))}
            </View>
          </View>
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="muted">Pontos de descarte</Text>
            <View style={styles.wrap}>
              {Object.entries(POINT_CATEGORIES).map(([k, c]) => (
                <Chip key={k} label={c.label} icon={c.icon} selected={!hiddenCats.includes(k)} onPress={() => toggleCat(k)} />
              ))}
            </View>
          </View>
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="muted">Situação</Text>
            <View style={styles.wrap}>
              <Chip label="Mostrar resolvidas e não confirmadas" icon="circle-check" selected={showClosed} onPress={() => setShowClosed((v) => !v)} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Limpar" variant="secondary" onPress={() => { setHiddenCats([]); setShowClosed(false); }} />
            <Button label={`Mostrar ${reports.length + points.length} no mapa`} variant="primary" style={{ flex: 1 }} onPress={() => setFiltersOpen(false)} />
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}

function Figure({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="number" style={accent ? { color: accent } : null}>{value}</Text>
      <Text variant="caption" tone="muted" numberOfLines={2}>{label}</Text>
    </View>
  );
}

function ReportPanel({ r, km, onClose, onConfirm, confirming, onDetails }: {
  r: Report; km: number | null; onClose: () => void; onConfirm: () => void; confirming: boolean; onDetails: () => void;
}) {
  const cat = reportCategory(r.categoria);
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.panelHead}>
        <ReportDrop category={r.categoria} size={40} muted={!statusInfo(r.status).open} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="headline" numberOfLines={2}>{r.titulo ?? 'Denúncia'}</Text>
          <Text variant="caption" tone="muted">{cat.label} · {timeAgo(r.created_at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="numberSm">{formatDistance(km)}</Text>
          <Text variant="caption" tone="muted">de você</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <StatusTag status={r.status} />
        <Text variant="caption" tone="muted">
          {r.confirmacoes_count} {r.confirmacoes_count === 1 ? 'confirmação' : 'confirmações'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {r.permissoes?.confirmar
          ? <Button label="Também vi isso" icon="thumbs-up" onPress={onConfirm} loading={confirming} style={{ flex: 1 }} />
          : <Button label={r.confirmada_por_mim ? 'Você confirmou' : 'Ver detalhes'} icon={r.confirmada_por_mim ? 'check' : undefined}
              variant={r.confirmada_por_mim ? 'secondary' : 'primary'} onPress={onDetails} style={{ flex: 1 }} />}
        {r.permissoes?.confirmar || r.confirmada_por_mim ? <Button label="Detalhes" variant="secondary" onPress={onDetails} /> : null}
        <IconButton icon="x" label="Fechar" variant="plain" size={52} onPress={onClose} />
      </View>
    </View>
  );
}

function PointPanel({ p, km, onClose, onDetails }: { p: Point; km: number | null; onClose: () => void; onDetails: () => void }) {
  const cat = pointCategory(p.categoria);
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.panelHead}>
        <PointStone category={p.categoria} size={40} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="headline" numberOfLines={2}>{p.nome}</Text>
          <Text variant="caption" tone="muted">{cat.label} · {p.horario || 'horário não informado'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="numberSm">{formatDistance(km)}</Text>
          <Text variant="caption" tone="muted">de você</Text>
        </View>
      </View>
      <Text variant="body" tone="secondary" numberOfLines={2}>Aceita {p.residuos_aceitos.join(', ').toLowerCase()}.</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Como chegar" icon="navigation" style={{ flex: 1 }} onPress={() => openDirections(p.latitude!, p.longitude!, p.nome)} />
        <Button label="Detalhes" variant="secondary" onPress={onDetails} />
        <IconButton icon="x" label="Fechar" variant="plain" size={52} onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.md, gap: space.sm },
  searchRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  search: {
    flex: 1, height: 50, borderRadius: radius.lg, backgroundColor: color.surface, flexDirection: 'row',
    alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, ...float,
  },
  searchInput: { flex: 1, height: '100%', color: color.ink, fontFamily: font.regular, fontSize: 15.5 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterBtn: { width: 46, height: 40, borderRadius: radius.md, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  locate: { position: 'absolute', right: space.md },
  sheetHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.xxs },
  figures: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space.md, gap: space.md },
  vrule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.line },
  panelHead: { flexDirection: 'row', gap: space.sm + 2, alignItems: 'flex-start', marginTop: space.xxs },
  sameSpot: { marginTop: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, gap: 2 },
  sameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
