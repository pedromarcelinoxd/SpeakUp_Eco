/**
 * Ranking — gamificação sóbria: classificação por período, sua posição,
 * como pontuar e os níveis. Tudo calculado pelo servidor.
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Banner, Button, Divider, EmptyState, ScreenHeader, Section, Segmented, SkeletonRows } from '@/design/components';
import { Icon } from '@/design/Icon';
import { MosaicProgress } from '@/design/Mosaic';
import { Text } from '@/design/Text';
import { color, font, readable, space } from '@/design/tokens';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LEVELS, SCORE_RULES } from '@/lib/catalog';
import { useApi } from '@/lib/useApi';

type Period = 'semanal' | 'mensal' | 'geral';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'semanal', label: 'Semana' },
  { value: 'mensal', label: 'Mês' },
  { value: 'geral', label: 'Geral' },
];

export default function RankingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('semanal');
  const { data, error, loading, refreshing, reload } = useApi(async () => {
    const [ranking, summary] = await Promise.all([api.ranking(period), user ? api.summary() : Promise.resolve(null)]);
    return { ...ranking, summary };
  }, `${period}:${user?.id ?? 'visitante'}`);

  const level = data?.summary?.nivel;
  const pts = data?.summary?.pontos ?? 0;
  const progress = level?.proximo ? (pts - level.minimo) / (level.proximo.minimo - level.minimo) : 1;
  const myPos = data?.eu?.posicao;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <StatusBar style="dark" />
      <ScreenHeader title="Ranking" subtitle="Quem mais cuida da cidade">
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />
        {user ? <View style={styles.me}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="muted">Sua posição</Text>
            <Text style={styles.bigPos}>{myPos ? `${myPos}º` : '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" tone="muted">Pontos no período</Text>
            <Text variant="number">{data?.eu?.pontos ?? 0}</Text>
          </View>
        </View> : (
          <View style={{ gap: space.sm }}>
            <Text variant="body" tone="muted">Você pode denunciar e validar sem conta. Para pontuar e aparecer no ranking, entre com uma conta.</Text>
            <Button label="Entrar ou criar conta" icon="user" variant="secondary" onPress={() => router.push('/login')} style={{ alignSelf: 'flex-start' }} size="sm" />
          </View>
        )}
        {user && !myPos && !loading && (
          <Text variant="caption" tone="muted">Você entra no ranking quando uma denúncia sua for confirmada pela comunidade ou pela equipe.</Text>
        )}
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={[readable, { paddingHorizontal: space.lg, paddingBottom: space.xxxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={color.brand} />}
      >
        {error && <View style={{ marginTop: space.md }}><Banner text={error} action="Tentar" onAction={reload} /></View>}

        <Section title="Classificação" style={{ marginTop: space.xl }}>
          {loading ? <SkeletonRows count={5} /> : data?.ranking.length ? data.ranking.map((r, i) => {
            const mine = r.user_id === user?.id;
            const podium = r.posicao <= 3;
            return (
              <View key={r.user_id}>
                {i > 0 && <Divider />}
                <View style={[styles.row, mine && styles.mine]}>
                  <Text style={[styles.pos, podium && styles.posTop]}>{r.posicao}</Text>
                  <Avatar name={r.nome} size={podium ? 44 : 38} tone={mine || podium ? 'brand' : 'stone'} />
                  <View style={{ flex: 1 }}>
                    <Text variant={podium ? 'subhead' : 'bodyStrong'} numberOfLines={1}>{r.nome}{mine ? ' · você' : ''}</Text>
                    <Text variant="caption" tone="muted">{r.nivel}{r.bairro ? ` · ${r.bairro}` : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant={podium ? 'number' : 'numberSm'} style={podium ? { fontSize: 24, lineHeight: 28 } : null}>{r.pontos}</Text>
                    <Text variant="caption" tone="muted">pts</Text>
                  </View>
                </View>
              </View>
            );
          }) : (
            <EmptyState icon="trophy" title="Ninguém pontuou neste período" text="Os pontos aparecem quando a equipe valida as denúncias. Registre uma ocorrência para começar." />
          )}
        </Section>

        {user && <Section title="Seu nível">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="subhead">{level?.nome ?? 'Semente'}</Text>
            <Text variant="caption" tone="muted">{level?.proximo ? `faltam ${level.faltam} pts para ${level.proximo.nome}` : 'nível máximo'}</Text>
          </View>
          <MosaicProgress value={progress} />
          <View style={{ marginTop: space.sm }}>
            {LEVELS.map((l, i) => {
              const reached = pts >= l.min;
              const current = level?.nome === l.name;
              return (
                <View key={l.name} style={styles.level}>
                  <Icon name={reached ? 'circle-check' : 'sprout'} size={20} tint={reached ? color.brand : color.faint} />
                  <Text variant={current ? 'bodyStrong' : 'body'} tone={reached ? 'default' : 'muted'} style={{ flex: 1 }}>{l.name}</Text>
                  <Text variant="label" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>{i === 0 ? 'início' : `${l.min} pts`}</Text>
                </View>
              );
            })}
          </View>
        </Section>}

        <Section title="Como ganhar pontos">
          {SCORE_RULES.map((r) => (
            <View key={r.label} style={styles.level}>
              <Icon name={r.icon} size={20} tint={color.ink} />
              <Text variant="body" style={{ flex: 1 }}>{r.label}</Text>
              <Text variant="numberSm" tone="brand">+{r.points}</Text>
            </View>
          ))}
          <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>
            Pontos só contam depois que a equipe valida a ocorrência. Denúncias falsas ou repetidas não pontuam.
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space.xs },
  bigPos: { fontFamily: font.heavy, fontSize: 44, lineHeight: 48, color: color.brand, letterSpacing: -1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm + 2, paddingHorizontal: space.xxs, borderRadius: 12 },
  mine: { backgroundColor: color.brandTint, paddingHorizontal: space.sm },
  pos: { width: 28, fontFamily: font.bold, fontSize: 15, color: color.faint, fontVariant: ['tabular-nums'] },
  posTop: { fontFamily: font.heavy, fontSize: 22, color: color.ink },
  level: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
});
