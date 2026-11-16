/** Push só existe no app instalado (iOS/Android). Na pré-visualização web, não há registro. */
export type PushResult = { token: string | null; reason?: string };

export async function registerForPushAsync(): Promise<PushResult> {
  return { token: null, reason: 'Disponível no app instalado.' };
}
