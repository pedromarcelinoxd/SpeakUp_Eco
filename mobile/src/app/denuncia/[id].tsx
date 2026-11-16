/**
 * Detalhe da denúncia (público): fotos, informações, validação comunitária,
 * histórico completo com a origem de cada mudança, local e ações.
 * Excluir fica isolado no fim.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EcoMap } from '@/components/map/EcoMap';
import { CommunityValidation, ReportSummary, useVote } from '@/components/ReportCard';
import { Banner, Button, IconButton, ReportDrop, Section, Skeleton } from '@/design/components';
import { Icon } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, radius, readable, space } from '@/design/tokens';
import { api } from '@/lib/api';
import { SEVERITIES, statusInfo } from '@/lib/catalog';
import { formatDateTime, openDirections } from '@/lib/format';
import { useApi } from '@/lib/useApi';

const HOUR = 3600000;

const ORIGIN = { autor: 'registro de quem denunciou', comunidade: 'validação da comunidade', equipe: 'equipe oficial' } as const;

const NEXT_STEP: Record<string, string> = {
  pendente: 'outras pessoas confirmarem que o problema existe',
  confirmada: 'análise da equipe ou solução do problema',
  em_analise: 'verificação no local pela equipe',
  verificada: 'solução pelo órgão responsável',
  possivelmente_resolvida: 'mais pessoas confirmarem a resolução',
};

/** Altura de cada trecho da linha do tempo proporcional ao tempo até o próximo evento. */
function segmentHeight(ms: number) {
  const hours = Math.max(0, ms / HOUR);
  return Math.round(18 + Math.min(1, Math.log10(1 + hours) / Math.log10(1 + 24 * 30)) * 70);
}

function duration(ms: number) {
  const h = ms / HOUR;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min depois`;
  if (h < 48) return `${Math.round(h)} h depois`;
  return `${Math.round(h / 24)} dias depois`;
}

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: r, setData, error, loading, reload } = useApi(() => api.report(id), id);
  const [photo, setPhoto] = useState(0);
  const { vote, voting, feedback } = useVote(r, (updated) => setData(updated));

  const back = (
    <View style={[styles.topButtons, { top: insets.top + space.xs }]}>
      <IconButton icon="arrow-left" label="Voltar" onPress={() => router.back()} />
      {r && <IconButton icon="share" label="Compartilhar" onPress={() => Share.share({ message: `Ocorrência ambiental no SpeakUp Eco: ${r.titulo ?? 'denúncia'} (protocolo #${r.id})` })} />}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.ground }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Skeleton height={width * 0.75} style={{ borderRadius: 0 }} />
        <View style={{ padding: space.lg, gap: space.sm }}><Skeleton width="80%" height={26} /><Skeleton width="50%" /></View>
        {back}
      </View>
    );
  }
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: color.ground, paddingTop: insets.top + 72, paddingHorizontal: space.lg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Banner text={error ?? 'Denúncia não encontrada.'} action="Tentar" onAction={reload} />
        {back}
      </View>
    );
  }

  const report = r;
  const history = report.historico ?? [];

  function remove() {
    Alert.alert('Excluir esta denúncia?', 'Ela será removida do app, do mapa e do painel web. Não é possível desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await api.remove(report.id); router.back(); } catch (e) { Alert.alert('Erro', e instanceof Error ? e.message : ''); }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={report.fotos.length ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: space.huge + insets.bottom }}>
        {report.fotos.length ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {report.fotos.map((uri, i) => (
                <Image key={uri} source={{ uri }} style={{ width, height: width * 0.78, backgroundColor: color.stone }} accessibilityLabel={`Foto ${i + 1} da ocorrência`} />
              ))}
            </ScrollView>
            {report.fotos.length > 1 && (
              <View style={styles.dots}>
                {report.fotos.map((u, i) => <View key={u} style={[styles.dot, i === photo && { backgroundColor: color.surface, width: 18 }]} />)}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noPhoto, { paddingTop: insets.top + 64 }]}>
            <ReportDrop category={report.categoria} size={56} muted={!statusInfo(report.status).open} />
          </View>
        )}

        <View style={[readable, { paddingHorizontal: space.lg, paddingTop: space.xl }]}>
          <ReportSummary r={report} />
          {report.criticidade !== 'alta' && (
            <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>
              Gravidade {SEVERITIES[report.criticidade]?.label.toLowerCase()} · {report.origem === 'app' ? 'enviada pelo app' : 'enviada pelo painel'}
            </Text>
          )}

          <View style={{ marginTop: space.xl }}>
            <CommunityValidation r={report} vote={vote} voting={voting} feedback={feedback} />
          </View>

          <Section title="Acompanhamento">
            <View accessibilityRole="list">
              {history.map((h, i) => {
                const st = statusInfo(h.status);
                const next = history[i + 1];
                const gap = next ? new Date(next.data).getTime() - new Date(h.data).getTime() : 0;
                const last = i === history.length - 1;
                return (
                  <View key={`${h.status}-${h.data}`} style={{ flexDirection: 'row', gap: space.sm }}>
                    <View style={{ alignItems: 'center', width: 18 }}>
                      <View style={[styles.node, { backgroundColor: st.dot }, last && styles.nodeNow]} />
                      {!last && <View style={[styles.axis, { height: segmentHeight(gap) }]} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: last ? 0 : space.xs }}>
                      <Text variant="bodyStrong">{st.label}</Text>
                      <Text variant="caption" tone="muted">
                        {formatDateTime(h.data)}{h.origem ? ` · ${ORIGIN[h.origem]}` : ''}
                      </Text>
                      {!!h.observacao && <Text variant="body" tone="secondary" style={{ marginTop: 2 }}>{h.observacao}</Text>}
                      {!last && <Text variant="caption" tone="faint" style={{ marginTop: 4 }}>{duration(gap)}</Text>}
                    </View>
                  </View>
                );
              })}
              {statusInfo(report.status).open && (
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                  <View style={{ width: 18, alignItems: 'center' }}><View style={styles.nodeNext} /></View>
                  <Text variant="caption" tone="muted" style={{ flex: 1 }}>Próximo passo: {NEXT_STEP[report.status] ?? 'solução pelo órgão responsável'}</Text>
                </View>
              )}
            </View>
          </Section>

          {report.latitude != null && (
            <Section title="Local">
              <View style={styles.map}>
                <EcoMap
                  markers={[{ id: 'r', kind: 'report', latitude: report.latitude, longitude: report.longitude!, category: report.categoria, closed: !statusInfo(report.status).open, selected: true }]}
                  initialCenter={{ latitude: report.latitude, longitude: report.longitude! }}
                  initialZoom="street"
                  interactive={false}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                <Icon name="pin" size={18} tint={color.muted} />
                <Text variant="body" style={{ flex: 1 }}>{report.endereco || `${report.latitude.toFixed(5)}, ${report.longitude!.toFixed(5)}`}</Text>
              </View>
              <Button label="Como chegar" icon="navigation" variant="secondary" onPress={() => openDirections(report.latitude!, report.longitude!, report.titulo ?? 'Ocorrência')} />
            </Section>
          )}

          <Text variant="caption" tone="faint" style={{ marginTop: space.xl }}>Protocolo #{report.id}</Text>

          {report.permissoes?.excluir && (
            <View style={{ marginTop: space.huge }}>
              <Button label="Excluir denúncia" icon="trash" variant="danger" onPress={remove} />
            </View>
          )}
        </View>
      </ScrollView>
      {back}
    </View>
  );
}

const styles = StyleSheet.create({
  topButtons: { position: 'absolute', left: space.md, right: space.md, flexDirection: 'row', justifyContent: 'space-between' },
  noPhoto: { backgroundColor: color.brandTint, alignItems: 'center', paddingBottom: space.xxl },
  dots: { position: 'absolute', bottom: space.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md, marginTop: space.md },
  urgent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: color.dangerTint },
  node: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  nodeNow: { width: 16, height: 16, borderRadius: 8, marginTop: 3, borderWidth: 3, borderColor: color.surface },
  nodeNext: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color.faint, borderStyle: 'dashed', marginTop: 2 },
  axis: { width: 2, backgroundColor: color.line, marginVertical: 4 },
  map: { height: 180, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.stone },
});
