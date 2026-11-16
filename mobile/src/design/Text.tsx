import { Text as RNText, type TextProps } from 'react-native';
import { color, type, type TypeVariant } from './tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  tone?: keyof typeof TONES;
  align?: 'left' | 'center' | 'right';
};

const TONES = {
  default: color.ink,
  secondary: color.ink2,
  muted: color.muted,
  faint: color.faint,
  inverse: color.surface, // sobre petróleo ou fotos
  brand: color.brand,
  coral: color.coralInk,
  danger: color.dangerInk,
} as const;

/** Texto do design system: sempre uma variante da escala, nunca tamanho solto. */
export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={1.4}
      style={[type[variant], { color: TONES[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
