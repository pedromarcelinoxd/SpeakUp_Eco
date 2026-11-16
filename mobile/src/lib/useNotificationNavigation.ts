import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Ao tocar numa notificação push, abre a denúncia correspondente. */
export function useNotificationNavigation() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const id = response?.notification.request.content.data?.denuncia_id;
    if (id) router.push(`/denuncia/${id}`);
  }, [response, router]);
}
