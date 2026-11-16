/**
 * Prepara a foto para envio: câmeras atuais geram fotos de 12 a 200 MP
 * (até 16000 px e vários MB), acima do que o servidor aceita. Aqui a foto é
 * reduzida para no máximo 1600 px no lado maior e salva como JPEG — fica com
 * algumas centenas de KB, sobe rápido em 4G e continua nítida no cartão.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_SIDE = 1600;

export type PreparedPhoto = { uri: string; mimeType: string; fileName: string };

export async function preparePhoto(asset: { uri: string; width?: number; height?: number }, index: number): Promise<PreparedPhoto> {
  const w = asset.width ?? 0;
  const h = asset.height ?? 0;
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (w > MAX_SIDE || h > MAX_SIDE || !w || !h) {
    // Sem dimensões conhecidas, limita pela largura (o lado maior costuma ser ela ou a altura; ambas ficam ≤ 1600)
    ctx.resize(w >= h ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await ctx.renderAsync();
  // Garante o limite também quando as dimensões vieram erradas do seletor
  let final = image;
  if (image.width > MAX_SIDE || image.height > MAX_SIDE) {
    const again = ImageManipulator.manipulate(asset.uri);
    again.resize(image.width >= image.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
    final = await again.renderAsync();
  }
  const saved = await final.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return { uri: saved.uri, mimeType: 'image/jpeg', fileName: `foto-${Date.now()}-${index}.jpg` };
}
