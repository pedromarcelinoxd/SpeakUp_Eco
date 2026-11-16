import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { LatLng } from '@/components/map/types';

type Status = 'unknown' | 'granted' | 'denied';

/** Localização do usuário (GPS). Pergunta a permissão só quando chamada explicitamente. */
export function useMyLocation({ ask = false }: { ask?: boolean } = {}) {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Status>('unknown');
  const [loading, setLoading] = useState(false);

  const read = useCallback(async (precise: boolean) => {
    const last = precise ? null : await Location.getLastKnownPositionAsync().catch(() => null);
    const pos = last ?? await Location.getCurrentPositionAsync({ accuracy: precise ? Location.Accuracy.High : Location.Accuracy.Balanced });
    const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    setCoords(c);
    return c;
  }, []);

  /** Pede permissão (se preciso) e obtém a posição atual com precisão. */
  const request = useCallback(async (): Promise<LatLng | null> => {
    setLoading(true);
    try {
      const { status: st } = await Location.requestForegroundPermissionsAsync();
      setStatus(st === 'granted' ? 'granted' : 'denied');
      if (st !== 'granted') return null;
      return await read(true);
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [read]);

  useEffect(() => {
    (async () => {
      try {
        const { status: st } = ask ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
        setStatus(st === 'granted' ? 'granted' : st === 'denied' ? 'denied' : 'unknown');
        if (st === 'granted') await read(false);
      } catch {
        /* GPS indisponível: segue com o centro da cidade */
      }
    })();
  }, [ask, read]);

  return { coords, status, loading, request };
}
