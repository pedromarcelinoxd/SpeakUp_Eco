/**
 * Cartão de ocorrência e bloco de validação comunitária, usados no mapa e no
 * detalhe da denúncia. A validação da comunidade é sempre identificada como tal
 * e separada da confirmação oficial da equipe/prefeitura.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, StatusTag } from '@/design/components';
import { Icon, type IconName } from '@/design/Icon';
import { shouldAnimate } from '@/design/motion';
import { Text } from '@/design/Text';
import { color, font, radius, space } from '@/design/tokens';
import { api, ApiError, type Report, type Vote } from '@/lib/api';
import { COMMUNITY_DISCLAIMER, reportCategory } from '@/lib/catalog';
import { formatDateTime, timeAgo } from '@/lib/format';

/** Etiqueta da categoria, na cor da categoria. */
export function CategoryTag({ category }: { category: string }) {
  const cat = reportCategory(category);
  return (
    <View style={[styles.cat, { backgroundColor: `${cat.color}1A` }]}>
      <Icon name={cat.icon} size={13} tint={cat.color} strokeWidth={2.4} />
      <Text variant="caption" style={{ color: cat.color, fontFamily: font.semibold }}>{cat.label}</Text>
    </View>
  );
}

/** Fotos anexadas, em faixa horizontal. */
export function PhotoStrip({ photos, height = 132 }: { photos: string[]; height?: number }) {
  if (!photos.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
      {photos.map((uri, i) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: photos.length === 1 ? 260 : 200, height, borderRadius: radius.md, backgroundColor: color.stone }}
          accessibilityLabel={`Foto ${i + 1} de ${photos.length}`}
          accessibilityIgnoresInvertColors
        />
      ))}
    </ScrollView>
  );
}

function Fact({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={15} tint={color.muted} />
      <Text variant="caption" tone="secondary" style={{ flex: 1 }}>{children}</Text>
    </View>
  );
}

/** Informações da ocorrência: categoria, status, título, descrição, local, data e autor. */
export function ReportSummary({ r, km, compact }: { r: Report; km?: string | null; compact?: boolean }) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' }}>
        <CategoryTag category={r.categoria} />
        <StatusTag status={r.status} size="sm" />
        {r.criticidade === 'alta' && (
          <View style={[styles.cat, { backgroundColor: color.dangerTint }]}>
            <Text variant="caption" style={{ color: color.dangerInk, fontFamily: font.semibold }}>Urgente</Text>
          </View>
        )}
      </View>
      <Text variant={compact ? 'headline' : 'title'} numberOfLines={compact ? 2 : undefined}>{r.titulo ?? 'Denúncia'}</Text>
      {!!r.descricao && <Text variant="body" tone="secondary" numberOfLines={compact ? 3 : undefined}>{r.descricao}</Text>}
      <View style={{ gap: 6 }}>
        {!!r.endereco && <Fact icon="pin">{km ? `${r.endereco} · ${km} de você` : r.endereco}</Fact>}
        <Fact icon="calendar">{`${formatDateTime(r.created_at)} · ${timeAgo(r.created_at)}`}</Fact>
        {r.autor?.foto_url ? (
          <View style={styles.fact}>
            <Avatar name={r.autor.nome} size={18} tone="tint" uri={r.autor.foto_url} />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>{`Enviada por ${r.autor.nome}`}</Text>
          </View>
        ) : (
          <Fact icon="user">{r.autor?.anonimo ? 'Enviada por um cidadão (sem conta)' : `Enviada por ${r.autor?.nome ?? 'morador'}`}</Fact>
        )}
      </View>
    </View>
  );
}

/** Estado e ação de votar, com feedback de carregamento, sucesso e erro. */
export function useVote(r: Report | null, onUpdated: (r: Report) => void) {
  const [voting, setVoting] = useState<Vote | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function vote(tipo: Vote) {
    if (!r) return;
    setVoting(tipo);
    setFeedback(null);
    try {
      const res = await api.vote(r.id, tipo);
      onUpdated(res.denuncia);
      const text = !res.voto_registrado && r.meu_voto === tipo
        ? 'Você já tinha registrado essa informação.'
        : res.status_mudou
          ? `Obrigado! A ocorrência agora está como “${statusLabel(res.denuncia.status)}”.`
          : tipo === 'existe' ? 'Obrigado! Sua confirmação foi registrada.' : 'Obrigado! Seu aviso de resolução foi registrado.';
      setFeedback({ ok: true, text });
    } catch (e) {
      setFeedback({ ok: false, text: e instanceof ApiError ? e.message : 'Não foi possível registrar agora. Tente de novo.' });
    } finally {
      setVoting(null);
    }
  }
  return { vote, voting, feedback };
}

function statusLabel(s: string) {
  return {
    pendente: 'Aguardando validação', confirmada: 'Confirmada pela comunidade', possivelmente_resolvida: 'Possivelmente resolvida',
    resolvida: 'Resolvida', em_analise: 'Em análise pela equipe', verificada: 'Verificada pela equipe', nao_confirmada: 'Não confirmada',
  }[s] ?? s;
}

/** "Esse problema ainda existe" / "Foi resolvido", com contagens e aviso de que não é oficial. */
export function CommunityValidation({ r, vote, voting, feedback }: {
  r: Report; vote: (t: Vote) => void; voting: Vote | null; feedback: { ok: boolean; text: string } | null;
}) {
  const router = useRouter();
  const closed = !r.pode_validar && !!r.motivo_bloqueio;
  return (
    <View style={styles.box} accessibilityLabel="Validação da comunidade">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Icon name="users" size={16} tint={color.brand} />
        <Text variant="label" style={{ flex: 1 }}>Validação da comunidade</Text>
      </View>
      <View style={styles.counts}>
        <Count value={r.validacoes.existe} label={r.validacoes.existe === 1 ? 'confirmou que existe' : 'confirmaram que existe'} />
        <View style={styles.vrule} />
        <Count value={r.validacoes.resolvida} label={r.validacoes.resolvida === 1 ? 'informou resolução' : 'informaram resolução'} />
      </View>

      {r.precisa_login ? (
        <View style={{ gap: space.xs }}>
          <Text variant="caption" tone="muted">Para validar, entre com sua conta. Assim cada pessoa conta uma vez só.</Text>
          <Pressable onPress={() => router.push('/login')} accessibilityRole="button" style={({ pressed }) => [styles.vote, { flex: 0 }, pressed && { opacity: 0.8 }]}>
            <Icon name="user" size={17} tint={color.brand} />
            <Text variant="label" style={{ color: color.brand }}>Entrar para validar</Text>
          </Pressable>
        </View>
      ) : r.pode_validar ? (
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          <VoteButton icon="thumbs-up" label="Ainda existe" active={r.meu_voto === 'existe'} loading={voting === 'existe'} disabled={!!voting} onPress={() => vote('existe')} />
          <VoteButton icon="circle-check" label="Foi resolvido" active={r.meu_voto === 'resolvida'} loading={voting === 'resolvida'} disabled={!!voting} onPress={() => vote('resolvida')} />
        </View>
      ) : (
        <Text variant="caption" tone="muted">{r.motivo_bloqueio}</Text>
      )}
      {!closed && r.meu_voto && !feedback && (
        <Text variant="caption" tone="muted">Você informou: {r.meu_voto === 'existe' ? 'o problema ainda existe' : 'o problema foi resolvido'}. Pode mudar se a situação mudar.</Text>
      )}
      {feedback && (
        <View style={[styles.feedback, { backgroundColor: feedback.ok ? color.successTint : color.dangerTint }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Icon name={feedback.ok ? 'check' : 'alert'} size={15} tint={feedback.ok ? color.successInk : color.dangerInk} />
          <Text variant="caption" style={{ flex: 1, color: feedback.ok ? color.successInk : color.dangerInk }}>{feedback.text}</Text>
        </View>
      )}
      <Text variant="caption" tone="faint" style={{ fontSize: 11.5 }}>{COMMUNITY_DISCLAIMER}</Text>
    </View>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, gap: 1 }}>
      <Text variant="numberSm">{value}</Text>
      <Text variant="caption" tone="muted">{label}</Text>
    </View>
  );
}

function VoteButton({ icon, label, active, loading, disabled, onPress }: {
  icon: IconName; label: string; active: boolean; loading: boolean; disabled: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.vote,
        active && { backgroundColor: color.brandTint, borderColor: color.brand },
        pressed && shouldAnimate() && { transform: [{ scale: 0.98 }] },
        disabled && !loading && { opacity: 0.6 },
      ]}
    >
      {loading ? <ActivityIndicator color={color.brand} /> : <Icon name={active ? 'check' : icon} size={17} tint={color.brand} />}
      <Text variant="label" style={{ color: color.brand }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  box: { gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  counts: { flexDirection: 'row', gap: space.sm },
  vrule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.line },
  vote: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, height: 48,
    borderRadius: radius.md + 2, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface,
  },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.sm, borderRadius: radius.md },
});
