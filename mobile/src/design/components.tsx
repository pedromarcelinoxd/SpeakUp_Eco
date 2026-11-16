/**
 * Componentes do design system EcoRadar.
 * Regras: hierarquia por escala e espaço; sombras só no que flutua;
 * verde-petróleo nos botões principais e na navegação ativa; coral só na ação
 * de denunciar e nas ocorrências; ícones sem caixas atrás.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, Easing, Image, Modal, Pressable, StyleSheet, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pointCategory, reportCategory, statusInfo } from '@/lib/catalog';
import { initials } from '@/lib/format';
import { Icon, type IconName } from './Icon';
import { shouldAnimate } from './motion';
import { Text } from './Text';
import { color, float, floatSoft, font, motion, radius, readable, space } from './tokens';

/* ---------------------------------------------------------------- Pressable com escala */
export function PressableScale({ children, onPress, disabled, style, accessibilityLabel, accessibilityRole = 'button', hitSlop }: {
  children: ReactNode; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string; accessibilityRole?: 'button' | 'link' | 'tab' | 'radio' | 'checkbox'; hitSlop?: number;
}) {
  const scale = useState(() => new Animated.Value(1))[0];
  const to = (v: number) => Animated.timing(scale, { toValue: v, duration: motion.fast, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.45 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ---------------------------------------------------------------- Botões */
type ButtonVariant = 'primary' | 'report' | 'secondary' | 'quiet' | 'danger';

const BUTTON: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: color.brand, fg: color.surface, border: color.brand },
  // Ação de denunciar: coral queimado com conteúdo em carvão (contraste 5,2:1)
  report: { bg: color.coral, fg: color.onCoral, border: color.coral },
  secondary: { bg: color.surface, fg: color.brand, border: color.line },
  quiet: { bg: 'transparent', fg: color.brand, border: 'transparent' },
  danger: { bg: 'transparent', fg: color.dangerInk, border: 'transparent' },
};

export function Button({ label, onPress, variant = 'primary', icon, iconRight, loading, disabled, size = 'md', style }: {
  label: string; onPress?: () => void; variant?: ButtonVariant; icon?: IconName; iconRight?: IconName;
  loading?: boolean; disabled?: boolean; size?: 'md' | 'sm'; style?: StyleProp<ViewStyle>;
}) {
  const v = BUTTON[variant];
  const h = size === 'md' ? 52 : 40;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      style={[s.button, { height: h, backgroundColor: v.bg, borderColor: v.border, paddingHorizontal: size === 'md' ? space.lg : space.md }, style]}
    >
      {loading
        ? <ActivityIndicator color={v.fg} />
        : icon ? <Icon name={icon} size={size === 'md' ? 19 : 17} tint={v.fg} /> : null}
      <Text variant="label" style={{ color: v.fg, fontSize: size === 'md' ? 15.5 : 14 }}>{label}</Text>
      {iconRight && !loading ? <Icon name={iconRight} size={18} tint={v.fg} /> : null}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, label, variant = 'float', size = 46, badge }: {
  icon: IconName; onPress?: () => void; label: string; variant?: 'float' | 'plain' | 'tint'; size?: number; badge?: number;
}) {
  const styles = {
    float: { bg: color.surface, fg: color.ink, extra: float },
    plain: { bg: 'transparent', fg: color.ink, extra: {} },
    // Em cabeçalhos claros: fundo verde-claro com ícone petróleo
    tint: { bg: color.brandTint, fg: color.brand, extra: {} },
  }[variant];
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[{ width: size, height: size, borderRadius: radius.md + 2, alignItems: 'center', justifyContent: 'center', backgroundColor: styles.bg }, styles.extra]}
    >
      <Icon name={icon} size={20} tint={styles.fg} />
      {!!badge && (
        <View style={s.badge}>
          <Text variant="caption" tone="inverse" style={{ fontFamily: font.bold, fontSize: 10.5, lineHeight: 13 }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </PressableScale>
  );
}

/* ---------------------------------------------------------------- Segmentado e chips */
export function Segmented<T extends string>({ options, value, onChange, style }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.segment, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[s.segItem, active && { backgroundColor: color.brand }]}
          >
            <Text variant="label" style={{ color: active ? color.surface : color.ink2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, icon, selected, onPress }: {
  label: string; icon?: IconName; selected?: boolean; onPress?: () => void;
}) {
  // Selecionado: realce verde-claro com borda e texto petróleo (sem bloco escuro)
  const fg = selected ? color.brand : color.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      style={[
        s.chip,
        selected && { backgroundColor: color.brandTint, borderColor: color.brand },
      ]}
    >
      {icon ? <Icon name={icon} size={15} tint={fg} /> : null}
      <Text variant="label" style={{ color: fg, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Campo de texto */
export function Field({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="label">{label}</Text>
      <TextInput
        placeholderTextColor={color.muted}
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[
          s.input,
          props.multiline && { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
          focused && { borderColor: color.brand },
          error ? { borderColor: color.danger } : null,
          props.style,
        ]}
      />
      {error ? <Text variant="caption" tone="danger">{error}</Text> : hint ? <Text variant="caption" tone="muted">{hint}</Text> : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Status, marcadores e avatar */
/** No mapa, contorno branco e sombra suave separam o marcador da base e dos vizinhos. */
const mapMarkerEdge = { borderWidth: 2, borderColor: color.surface, ...floatSoft };

export function StatusTag({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const st = statusInfo(status);
  return (
    <View style={[s.tag, { backgroundColor: st.bg }, size === 'sm' && { paddingVertical: 2, paddingHorizontal: 8 }]}>
      <View style={[s.tagDot, { backgroundColor: st.dot }]} />
      <Text variant="caption" style={{ color: st.fg, fontFamily: font.semibold }}>{st.label}</Text>
    </View>
  );
}

/**
 * Gota da denúncia — a mesma forma do mapa, na cor da categoria (ícone branco,
 * contraste ≥ 4,5:1). Encerradas ficam em cinza.
 */
export function ReportDrop({ category, size = 40, muted, onMap }: { category?: string; size?: number; muted?: boolean; onMap?: boolean }) {
  const cat = reportCategory(category);
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2, borderBottomLeftRadius: size * 0.16,
      transform: [{ rotate: '-45deg' }], backgroundColor: muted ? color.line : cat.color,
      alignItems: 'center', justifyContent: 'center',
    }, onMap && mapMarkerEdge]}>
      <View style={{ transform: [{ rotate: '45deg' }] }}>
        <Icon name={cat.icon} size={size * 0.46} tint={muted ? color.ink2 : color.surface} />
      </View>
    </View>
  );
}

/** Pedra verde-petróleo do ponto de descarte — a mesma forma do mapa. */
export function PointStone({ category, size = 40, onMap }: { category?: string; size?: number; onMap?: boolean }) {
  const cat = pointCategory(category);
  return (
    <View style={[{ width: size, height: size, borderRadius: size * 0.24, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' }, onMap && mapMarkerEdge]}>
      <Icon name={cat.icon} size={size * 0.48} tint={color.surface} />
    </View>
  );
}

/** Foto de perfil, ou as iniciais quando a pessoa não tem foto. */
export function Avatar({ name, size = 44, tone = 'brand', uri }: { name: string; size?: number; tone?: 'brand' | 'tint' | 'stone'; uri?: string | null }) {
  const bg = { brand: color.brand, tint: color.brandTint, stone: color.stone }[tone];
  const fg = tone === 'brand' ? color.surface : tone === 'tint' ? color.brand : color.ink;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Text style={{ fontFamily: font.bold, fontSize: size * 0.36, lineHeight: size * 0.44, color: fg }}>{initials(name)}</Text>
      {!!uri && (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} accessibilityLabel={`Foto de ${name}`} accessibilityIgnoresInvertColors />
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Estrutura */
export function Section({ title, action, onAction, children, style }: {
  title: string; action?: string; onAction?: () => void; children: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginTop: space.xxl, gap: space.sm }, style]}>
      <View style={s.sectionHead}>
        <Text variant="headline" accessibilityRole="header">{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
            <Text variant="label" tone="brand">{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginLeft: inset }} />;
}

/** Linha de lista: sem cartão; o valor importante fica à direita, em algarismos tabulares. */
export function Row({ leading, title, subtitle, meta, value, valueLabel, onPress, chevron = true }: {
  leading?: ReactNode; title: string; subtitle?: string; meta?: ReactNode; value?: string; valueLabel?: string;
  onPress?: () => void; chevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: color.stone }]} accessibilityRole={onPress ? 'button' : undefined}>
      {leading}
      <View style={{ flex: 1, gap: 3 }}>
        <Text variant="bodyStrong" numberOfLines={2}>{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted" numberOfLines={1}>{subtitle}</Text> : null}
        {meta}
      </View>
      {value ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="numberSm">{value}</Text>
          {valueLabel ? <Text variant="caption" tone="muted">{valueLabel}</Text> : null}
        </View>
      ) : chevron && onPress ? <Icon name="chevron-right" size={18} tint={color.faint} /> : null}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Estados */
export function EmptyState({ icon, title, text, action, onAction }: {
  icon: IconName; title: string; text?: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={s.empty}>
      <Icon name={icon} size={30} tint={color.faint} strokeWidth={1.6} />
      <Text variant="subhead" align="center" style={{ marginTop: space.sm }}>{title}</Text>
      {text ? <Text variant="body" tone="muted" align="center">{text}</Text> : null}
      {action ? <Button label={action} variant="secondary" size="sm" onPress={onAction} style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

export function Banner({ text, tone = 'error', action, onAction }: { text: string; tone?: 'error' | 'info'; action?: string; onAction?: () => void }) {
  const err = tone === 'error';
  return (
    <View style={[s.banner, { backgroundColor: err ? color.dangerTint : color.infoTint }]} accessibilityRole="alert">
      <Icon name={err ? 'offline' : 'info'} size={18} tint={err ? color.dangerInk : color.infoInk} />
      <Text variant="caption" style={{ flex: 1, color: err ? color.dangerInk : color.infoInk }}>{text}</Text>
      {action ? <Text variant="label" onPress={onAction} style={{ color: err ? color.dangerInk : color.infoInk }}>{action}</Text> : null}
    </View>
  );
}

export function Skeleton({ width = '100%', height = 16, style }: { width?: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle> }) {
  const op = useState(() => new Animated.Value(0.5))[0];
  useEffect(() => {
    if (!shouldAnimate()) { op.setValue(0.75); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width, height, borderRadius: 6, backgroundColor: color.stone, opacity: op }, style]} />;
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: space.lg, paddingVertical: space.sm }} accessibilityLabel="Carregando">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Skeleton width={44} height={44} style={{ borderRadius: 12 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- Cabeçalho claro (marfim) com título carvão e realces petróleo */
export function ScreenHeader({ title, subtitle, right, left, children }: {
  title: string; subtitle?: string; right?: ReactNode; left?: ReactNode; children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: color.ground, paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line }}>
      <View style={[readable, { gap: space.md }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 }}>
        {left}
        <View style={{ flex: 1 }}>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- Folha inferior modal */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const y = useState(() => new Animated.Value(400))[0];
  useEffect(() => {
    if (visible && !shouldAnimate()) y.setValue(0);
    else if (visible) Animated.timing(y, { toValue: 0, duration: motion.slow, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
    else y.setValue(400);
  }, [visible, y]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + space.lg, transform: [{ translateY: y }] }]}>
        <View style={s.grab} />
        <View style={[s.sectionHead, { marginBottom: space.md }]}>
          <Text variant="headline" accessibilityRole="header">{title}</Text>
          <IconButton icon="x" label="Fechar" variant="plain" size={40} onPress={onClose} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  button: { borderRadius: radius.md + 2, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  badge: { position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.surface },
  segment: { flexDirection: 'row', backgroundColor: color.stone, borderRadius: radius.md, padding: 3, alignSelf: 'flex-start' },
  segItem: { paddingHorizontal: 14, height: 34, borderRadius: radius.md - 3, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface },
  input: { minHeight: 52, borderRadius: radius.md + 2, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface, paddingHorizontal: space.md, fontFamily: font.regular, fontSize: 16, color: color.ink },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, paddingVertical: space.sm, minHeight: 64, borderRadius: radius.sm },
  empty: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.xxs },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm + 2, borderRadius: radius.md },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(32,42,39,0.42)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: color.ground, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: space.lg, paddingTop: space.xs, maxHeight: '88%' },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: color.line, marginBottom: space.sm },
});
