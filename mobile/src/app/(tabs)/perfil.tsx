/**
 * Perfil — progresso, estatísticas, conquistas (derivadas só de dados reais),
 * histórico de denúncias e configurações. "Sair" fica isolado no fim.
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Banner, Button, Divider, EmptyState, ScreenHeader, IconButton, Section, SkeletonRows, StatusTag } from '@/design/components';
import { Icon, type IconName } from '@/design/Icon';
import { MosaicActivity, MosaicProgress } from '@/design/Mosaic';
import { Text } from '@/design/Text';
import { color, radius, readable, space } from '@/design/tokens';
import { API_URL, api, type Summary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { reportCategory } from '@/lib/catalog';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/useApi';

type Achievement = { icon: IconName; title: string; rule: string; current: number; goal: number };

/** Conquistas calculadas a partir das estatísticas do servidor — nada inventado. */
function achievements(s: Summary): Achievement[] {
  const e = s.estatisticas;
  return [
    { icon: 'flag', title: 'Primeiro registro', rule: 'Envie sua primeira denúncia', current: e.enviadas, goal: 1 },
    { icon: 'badge-check', title: 'Denúncia validada', rule: 'Tenha uma denúncia confirmada pela equipe', current: e.validadas, goal: 1 },
    { icon: 'circle-check', title: 'Problema resolvido', rule: 'Uma denúncia sua foi solucionada', current: e.resolvidas, goal: 1 },
    { icon: 'search', title: 'Olhar atento', rule: 'Envie 5 denúncias', current: e.enviadas, goal: 5 },
    { icon: 'users', title: 'Vizinho presente', rule: 'Confirme 5 ocorrências de outras pessoas', current: e.confirmacoes, goal: 5 },
    { icon: 'shield', title: 'Guardião Ambiental', rule: 'Chegue a 600 pontos', current: s.pontos, goal: 600 },
  ];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, pushStatus } = useAuth();
  const { data, error, loading, refreshing, reload } = useApi(async () => {
    const [summary, mine, notif] = await Promise.all([api.summary(), api.reports({ minhas: true }), api.notifications()]);
    return { summary, mine, unread: notif.nao_lidas };
  });

  const s = data?.summary;
  const level = s?.nivel;
  const progress = level?.proximo && s ? (s.pontos - level.minimo) / (level.proximo.minimo - level.minimo) : s ? 1 : 0;
  const activityDates = useMemo(() => (data?.mine ?? []).map((r) => r.created_at), [data]);
  const ach = s ? achievements(s) : [];
  const earned = ach.filter((a) => a.current >= a.goal).length;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={color.brand} />}
      >
        <ScreenHeader
          title={user?.name ?? ''}
          subtitle={user?.email}
          left={<Avatar name={user?.name ?? ''} size={52} tone="brand" />}
          right={<IconButton icon="bell" label="Notificações" variant="tint" badge={data?.unread} onPress={() => router.push('/notificacoes')} />}
        >
          <View style={{ gap: space.sm, marginTop: space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="headline" tone="brand">{level?.nome ?? '—'}</Text>
              <Text variant="numberSm">{s?.pontos ?? 0} pts</Text>
            </View>
            <MosaicProgress value={progress} />
            <Text variant="caption" tone="muted">
              {level?.proximo ? `Faltam ${level.faltam} pontos para ${level.proximo.nome}` : s ? 'Você alcançou o nível máximo' : ' '}
            </Text>
          </View>
        </ScreenHeader>

        <View style={[readable, { paddingHorizontal: space.lg }]}>
          {error && <View style={{ marginTop: space.md }}><Banner text={error} action="Tentar" onAction={reload} /></View>}

          <View style={styles.stats}>
            {[
              { v: s?.estatisticas.enviadas, l: 'enviadas' },
              { v: s?.estatisticas.validadas, l: 'validadas' },
              { v: s?.estatisticas.resolvidas, l: 'resolvidas' },
              { v: s?.estatisticas.confirmacoes, l: 'confirmações' },
            ].map((x, i) => (
              <View key={x.l} style={[styles.stat, i > 0 && styles.statRule]}>
                <Text variant="number" style={{ fontSize: 24, lineHeight: 28 }}>{x.v ?? '–'}</Text>
                <Text variant="caption" tone="muted">{x.l}</Text>
              </View>
            ))}
          </View>

          <Section title="Sua atividade">
            <MosaicActivity dates={activityDates} caption="Suas denúncias" />
          </Section>

          <Section title="Conquistas" action={s ? `${earned} de ${ach.length}` : undefined}>
            {ach.map((a, i) => {
              const done = a.current >= a.goal;
              return (
                <View key={a.title}>
                  {i > 0 && <Divider inset={44} />}
                  <View style={styles.ach}>
                    {/* Ícone sem caixa: a conquista se mostra pela cor e pelo peso do traço */}
                    <View style={styles.achMark}>
                      <Icon name={a.icon} size={22} tint={done ? color.brand : color.faint} strokeWidth={done ? 2.4 : 1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" tone={done ? 'default' : 'muted'}>{a.title}</Text>
                      <Text variant="caption" tone="muted">{a.rule}</Text>
                    </View>
                    {done
                      ? <Icon name="check" size={18} tint={color.brand} />
                      : <Text variant="label" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>{Math.min(a.current, a.goal)}/{a.goal}</Text>}
                  </View>
                </View>
              );
            })}
          </Section>

          <Section title="Minhas denúncias" action={data?.mine.length ? `${data.mine.length}` : undefined}>
            {loading ? <SkeletonRows count={3} /> : data?.mine.length ? data.mine.map((r, i) => (
              <View key={r.id}>
                {i > 0 && <Divider inset={68} />}
                <Pressable onPress={() => router.push(`/denuncia/${r.id}`)} style={({ pressed }) => [styles.report, pressed && { backgroundColor: color.stone }]} accessibilityRole="button">
                  {r.foto_url
                    ? <Image source={{ uri: r.foto_url }} style={styles.thumb} accessibilityIgnoresInvertColors />
                    : <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}><Icon name={reportCategory(r.categoria).icon} tint={color.muted} /></View>}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="bodyStrong" numberOfLines={2}>{r.titulo ?? 'Denúncia'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                      <StatusTag status={r.status} size="sm" />
                      <Text variant="caption" tone="muted">{timeAgo(r.created_at)}</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={18} tint={color.faint} />
                </Pressable>
              </View>
            )) : (
              <EmptyState icon="flag" title="Nenhuma denúncia ainda" text="Quando você registrar uma ocorrência, acompanha o andamento por aqui." action="Fazer uma denúncia" onAction={() => router.push('/denunciar')} />
            )}
          </Section>

          <Section title="Configurações">
            <Pressable onPress={() => router.push('/notificacoes')} style={styles.setting} accessibilityRole="button">
              <Icon name="bell" size={20} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Notificações</Text>
                <Text variant="caption" tone="muted">Push: {pushStatus === 'ativo' ? 'ativo neste aparelho' : pushStatus ?? 'verificando…'}</Text>
              </View>
              <Icon name="chevron-right" size={18} tint={color.faint} />
            </Pressable>
            {/* Endereço do servidor: só em builds de desenvolvimento */}
            {__DEV__ && (
              <>
                <Divider inset={32} />
                <View style={styles.setting}>
                  <Icon name="server" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">Servidor (desenvolvimento)</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>{API_URL}</Text>
                  </View>
                </View>
              </>
            )}
            <Divider inset={32} />
            <View style={styles.setting}>
              <Icon name="info" size={20} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Mesma conta no painel web</Text>
                <Text variant="caption" tone="muted">Suas denúncias e pontos aparecem nos dois lugares.</Text>
              </View>
            </View>
          </Section>

          {/* Ação destrutiva isolada por espaço deliberado */}
          <View style={{ marginTop: space.huge }}>
            <Button
              label="Sair da conta"
              icon="log-out"
              variant="danger"
              onPress={() => Alert.alert('Sair da conta?', 'Você deixa de receber notificações neste aparelho.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => signOut() },
              ])}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', marginTop: space.xl },
  stat: { flex: 1, gap: 2 },
  statRule: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.line, paddingLeft: space.sm },
  ach: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  achMark: { width: 32, alignItems: 'center', justifyContent: 'center' },
  report: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderRadius: radius.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: color.stone },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
});
