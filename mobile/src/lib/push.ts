/**
 * Notificações push (Expo). O token do dispositivo é enviado para
 * POST /api/push-tokens; o backend dispara o push quando o status de uma
 * denúncia muda, quando ela é recebida ou confirmada.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { color } from '@/design/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushResult = { token: string | null; reason?: string };

export async function registerForPushAsync(): Promise<PushResult> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Atualizações das denúncias',
      // eslint-disable-next-line import/namespace -- enum reexportado nos .d.ts; o plugin não segue o reexport
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: color.brand,
    });
  }

  if (!Device.isDevice) return { token: null, reason: 'Push exige um dispositivo físico.' };

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return { token: null, reason: 'Permissão de notificações negada.' };

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return { token: null, reason: 'Configure o projeto no Expo (npx eas-cli init) para habilitar o push.' };
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: data };
  } catch (e) {
    return { token: null, reason: e instanceof Error ? e.message : 'Falha ao obter token de push.' };
  }
}
