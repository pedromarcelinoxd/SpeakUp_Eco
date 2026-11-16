import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color } from '@/design/tokens';

/** Marca SpeakUp Eco: radar com folha — o mesmo desenho do painel web. */
export function Logo({ size = 40, tone = 'brand' }: { size?: number; tone?: 'brand' | 'light' }) {
  const bg = tone === 'brand' ? color.brand : color.surface;
  const fg = tone === 'brand' ? color.surface : color.brand;
  const leaf = color.brandSoft;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityLabel="SpeakUp Eco">
      <Rect width={32} height={32} rx={9} fill={bg} />
      <Circle cx={15} cy={17} r={9.5} stroke={fg} strokeOpacity={0.3} strokeWidth={1.6} fill="none" />
      <Circle cx={15} cy={17} r={5} stroke={fg} strokeOpacity={0.6} strokeWidth={1.6} fill="none" />
      <Path d="M15 17V7.5a9.5 9.5 0 0 1 8.6 5.4L15 17Z" fill={fg} fillOpacity={0.22} />
      <Circle cx={15} cy={17} r={1.9} fill={fg} />
      <Path d="M19.2 12.6c-.2-3.3 2.2-5.6 6.3-5.6.2 3.9-2.1 6.2-6.3 5.6Z" fill={leaf} />
    </Svg>
  );
}
