/**
 * Mapa — a experiência central do SpeakUp Eco e a tela inicial, aberta a qualquer
 * pessoa (com ou sem conta). Mapa em tela cheia; painel "Perto de você"; ao tocar
 * num marcador, o painel vira o cartão completo do item, com validação comunitária.
 * Os marcadores se atualizam ao voltar para a tela e a cada 45 s.
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EcoMap } from '@/components/map/EcoMap';
import type { EcoMapHandle, MapMarker } from '@/components/map/types';
import { CountBars } from '@/components/CountBars';
import { MapLegend } from '@/components/MapLegend';
import { MapSheet, type MapSheetHandle } from '@/components/MapSheet';
import { CommunityValidation, PhotoStrip, ReportSummary, useVote } from '@/components/ReportCard';
import {
  Banner, Button, Chip, Divider, IconButton, PointStone, ReportDrop, Row, Section, Segmented, Sheet, SkeletonRows,
} from '@/design/components';
import { Icon } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, float, floatSoft, font, radius, space } from '@/design/tokens';
import { api, type Point, type Report } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>(params.tipo === 'descarte' ? 'points' : 'all');
  const [hiddenCats, setHiddenCats] = useState<string[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  // "Ver no mapa" a partir de Pontos de descarte: ajusta o modo quando o parâmetro muda
  const [lastTipo, setLastTipo] = useState(params.tipo);
  if (params.tipo !== lastTipo) {
    setLastTipo(params.tipo);
    if (params.tipo === 'descarte') { setMode('points'); setSelected(null); }
  }

  const { data, setData, error, loading, reload } = useApi(async () => {
    const [reports, points, notif] = await Promise.all([
      api.reports(), api.points(), user ? api.notifications() : Promise.resolve(null),
    ]);
    return { reports, points, unread: notif?.nao_lidas ?? 0 };
  }, user?.id ?? 'visitante');

  // Novas denúncias de outras pessoas aparecem sem precisar recarregar
  useFocusEffect(useCallback(() => {
    const t = setInterval(() => { reload(); }, 45_000);
    return () => clearInterval(t);
  }, [reload]));

  // Selecionado sempre com os dados mais recentes (após votos ou atualização)
  const selectedReport = selected?.kind === 'report' ? data?.reports.find((r) => r.id === selected.item.id) ?? selected.item : null;
  const replaceReport = (updated: Report) => {
    setData((d) => d && { ...d, reports: d.reports.map((x) => (x.id === updated.id ? updated : x)) });
    setSelected((s) => (s?.kind === 'report' && s.item.id === updated.id ? { kind: 'report', item: updated } : s));
  };
  const { vote, voting, feedback } = useVote(selectedReport, replaceReport);

  const q = query.trim().toLowerCase();
  const reports = useMemo(() => (data?.reports ?? []).filter((r) => r.latitude != null
    && mode !== 'points' && !hiddenCats.includes(`r:${r.categoria}`)
    && (showClosed || statusInfo(r.status).open)
    && (!q || `${r.titulo} ${r.endereco} ${reportCategory(r.categoria).label}`.toLowerCase().includes(q))), [data, mode, hiddenCats, showClosed, q]);
  const points = useMemo(() => (data?.points ?? []).filter((p) => p.latitude != null
    && mode !== 'reports' && !hiddenCats.includes(`p:${p.categoria}`)
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
  // Ocorrências abertas por tipo, nas mesmas cores do mapa
  const openByCategory = useMemo(() => Object.entries(REPORT_CATEGORIES).map(([key, c]) => ({
    key, label: c.label, color: c.color, icon: c.icon,
    count: (data?.reports ?? []).filter((r) => r.categoria === key && statusInfo(r.status).open).length,
  })), [data]);

  /** Mostra no mapa só as ocorrências daquele tipo. */
  function showOnlyCategory(key: string) {
    setMode('reports');
    setHiddenCats(Object.keys(REPORT_CATEGORIES).filter((k) => k !== key).map((k) => `r:${k}`));
    setSelected(null);
    sheet.current?.collapse();
  }

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

  // Cartão do item: mostra título, status e ações sem precisar arrastar; arrastar revela o resto
  const peek = selected ? (selected.kind === 'report' ? 300 : 280) : searching && q ? 320 : 164;

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
          {user
            ? <IconButton icon="bell" label="Notificações" badge={data?.unread} onPress={() => router.push('/notificacoes')} size={50} />
            : <IconButton icon="user" label="Entrar ou criar conta" onPress={() => router.push('/login')} size={50} />}
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

      {/* Legenda e localização */}
      <View style={[styles.locate, { bottom: peek + space.sm }]} pointerEvents="box-none">
        <IconButton icon="layers" label="Legenda do mapa" onPress={() => setLegendOpen((v) => !v)} />
        <IconButton icon="locate" label="Minha localização" onPress={locate} />
      </View>
      {legendOpen && (
        <View style={[styles.legend, { bottom: peek + space.sm }]}>
          <MapLegend onClose={() => setLegendOpen(false)} />
        </View>
      )}

      <MapSheet ref={sheet} peek={peek}>
        {(expanded) => (
          <ScrollView
            scrollEnabled={expanded || (searching && !!q)}
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.huge }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {selectedReport && (
              <ReportPanel
                r={selectedReport}
                km={dist(selectedReport.latitude, selectedReport.longitude)}
                onClose={() => setSelected(null)}
                vote={vote}
                voting={voting}
                feedback={feedback}
                onDetails={() => router.push(`/denuncia/${selectedReport.id}`)}
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

                <Section title="Ocorrências abertas por tipo" action="Panorama" onAction={() => router.push('/panorama')}>
                  <CountBars items={openByCategory} empty="Nenhuma ocorrência aberta no momento." onPress={showOnlyCategory} />
                  {openByCategory.some((i) => i.count > 0) && (
                    <Text variant="caption" tone="muted">Toque num tipo para ver só ele no mapa.</Text>
                  )}
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
                <Chip key={k} label={c.label} icon={c.icon} selected={!hiddenCats.includes(`r:${k}`)} onPress={() => toggleCat(`r:${k}`)} />
              ))}
            </View>
          </View>
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="muted">Pontos de descarte</Text>
            <View style={styles.wrap}>
              {Object.entries(POINT_CATEGORIES).map(([k, c]) => (
                <Chip key={k} label={c.label} icon={c.icon} selected={!hiddenCats.includes(`p:${k}`)} onPress={() => toggleCat(`p:${k}`)} />
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

function ReportPanel({ r, km, onClose, vote, voting, feedback, onDetails }: {
  r: Report; km: number | null; onClose: () => void; onDetails: () => void;
  vote: Parameters<typeof CommunityValidation>[0]['vote']; voting: Parameters<typeof CommunityValidation>[0]['voting'];
  feedback: Parameters<typeof CommunityValidation>[0]['feedback'];
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.panelTop}>
        <ReportDrop category={r.categoria} size={34} muted={!statusInfo(r.status).open} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>Ocorrência #{r.id}{km != null ? ` · ${formatDistance(km)} de você` : ''}</Text>
        <IconButton icon="x" label="Fechar" variant="plain" size={40} onPress={onClose} />
      </View>
      <ReportSummary r={r} compact />
      <CommunityValidation r={r} vote={vote} voting={voting} feedback={feedback} />
      <PhotoStrip photos={r.fotos} />
      <Button label="Ver detalhes e histórico" icon="clock" variant="secondary" onPress={onDetails} />
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
          <Text variant="caption" tone="muted">{cat.label}{km != null ? ` · ${formatDistance(km)} de você` : ''}</Text>
        </View>
        <IconButton icon="x" label="Fechar" variant="plain" size={40} onPress={onClose} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Como chegar" icon="navigation" style={{ flex: 1 }} onPress={() => openDirections(p.latitude!, p.longitude!, p.nome)} />
        <Button label="Detalhes" variant="secondary" onPress={onDetails} />
      </View>
      <View style={{ gap: 6 }}>
        {!!p.endereco && <PointFact icon="pin" text={p.endereco} />}
        <PointFact icon="clock" text={p.horario || 'Horário de funcionamento não informado'} />
      </View>
      <View style={{ gap: space.xs }}>
        <Text variant="label" tone="muted">Materiais recebidos</Text>
        <View style={styles.wrap}>
          {p.residuos_aceitos.map((m) => (
            <View key={m} style={styles.material}><Icon name="check" size={13} tint={color.brand} /><Text variant="caption" tone="secondary">{m}</Text></View>
          ))}
        </View>
      </View>
      {!!p.descricao_local && <Text variant="body" tone="secondary">{p.descricao_local}</Text>}
    </View>
  );
}

function PointFact({ icon, text }: { icon: 'pin' | 'clock'; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
      <Icon name={icon} size={15} tint={color.muted} />
      <Text variant="caption" tone="secondary" style={{ flex: 1 }}>{text}</Text>
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
  locate: { position: 'absolute', right: space.md, gap: space.xs },
  legend: { position: 'absolute', right: space.md + 54, left: space.md, maxWidth: 340, alignSelf: 'flex-end' },
  panelTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xxs },
  material: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color.brandTint },
  sheetHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.xxs },
  figures: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space.md, gap: space.md },
  vrule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.line },
  panelHead: { flexDirection: 'row', gap: space.sm + 2, alignItems: 'flex-start', marginTop: space.xxs },
  sameSpot: { marginTop: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, gap: 2 },
  sameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
