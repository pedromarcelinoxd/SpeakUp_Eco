import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Banner, Divider, EmptyState, SkeletonRows } from '@/design/components';
import { Icon, type IconName } from '@/design/Icon';
import { Text } from '@/design/Text';
import { color, space } from '@/design/tokens';
import { api, type AppNotification } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/useApi';

function iconFor(n: AppNotification): { name: IconName; tint: string } {
  if (n.titulo.toLowerCase().includes('pode ter sido resolvida')) return { name: 'circle-check', tint: '#4D7C0F' };
  if (n.titulo.toLowerCase().includes('resolvida')) return { name: 'circle-check', tint: color.success };
  if (n.titulo.toLowerCase().includes('comunidade')) return { name: 'users', tint: '#0F766E' };
  if (n.tipo === 'confirmacao') return { name: 'thumbs-up', tint: color.info };
  if (n.tipo === 'recebida') return { name: 'inbox', tint: color.info };
  if (n.titulo.toLowerCase().includes('verificada')) return { name: 'badge-check', tint: color.verified };
  if (n.titulo.toLowerCase().includes('não foi possível')) return { name: 'circle-x', tint: color.muted };
  return { name: 'hourglass', tint: color.warning };
}

/** As mesmas notificações aparecem no painel web (tabela `notifications`). */
export default function NotificationsScreen() {
  const router = useRouter();
  const { data, setData, error, loading, refreshing, reload } = useApi(() => api.notifications());

  function open(n: AppNotification) {
    if (!n.lida) {
      api.markRead(n.id).catch(() => {});
      setData((d) => d && { ...d, nao_lidas: Math.max(0, d.nao_lidas - 1), notificacoes: d.notificacoes.map((x) => (x.id === n.id ? { ...x, lida: true } : x)) });
    }
    if (n.denuncia_id) router.push(`/denuncia/${n.denuncia_id}`);
  }

  async function readAll() {
    await api.markAllRead();
    setData((d) => d && { nao_lidas: 0, notificacoes: d.notificacoes.map((x) => ({ ...x, lida: true })) });
  }

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (data?.nao_lidas
          ? <Pressable onPress={readAll} hitSlop={10} accessibilityRole="button"><Text variant="label" tone="brand">Marcar todas como lidas</Text></Pressable>
          : null),
      }} />
      <FlatList
        data={data?.notificacoes ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={color.brand} />}
        ItemSeparatorComponent={() => <Divider inset={36} />}
        ListHeaderComponent={
          <View style={{ gap: space.sm, paddingTop: space.xs, paddingBottom: space.xs }}>
            {error && <Banner text={error} action="Tentar" onAction={reload} />}
            {loading && <SkeletonRows count={4} />}
          </View>
        }
        ListEmptyComponent={loading ? undefined : (
          <EmptyState icon="bell-off" title="Tudo em dia" text="Avisamos aqui, e por push no celular, quando suas denúncias mudarem de situação." />
        )}
        renderItem={({ item: n }) => {
          const ic = iconFor(n);
          return (
            <Pressable onPress={() => open(n)} style={({ pressed }) => [styles.item, pressed && { backgroundColor: color.stone }]} accessibilityRole="button" accessibilityLabel={`${n.lida ? '' : 'Não lida. '}${n.titulo}`}>
              <View style={{ paddingTop: 2 }}><Icon name={ic.name} size={22} tint={ic.tint} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant={n.lida ? 'body' : 'bodyStrong'}>{n.titulo}</Text>
                <Text variant="caption" tone="muted">{n.mensagem}</Text>
                <Text variant="caption" tone="faint">{timeAgo(n.data)}</Text>
              </View>
              {!n.lida && <View style={styles.unread} accessibilityElementsHidden />}
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space.sm + 2, paddingVertical: space.md, borderRadius: 8 },
  unread: { width: 9, height: 9, borderRadius: 5, backgroundColor: color.brand, marginTop: 7 },
});
