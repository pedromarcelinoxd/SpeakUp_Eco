/**
 * Identificador anônimo deste aparelho, para denunciar e validar sem conta.
 *
 * É um UUID aleatório gerado na primeira abertura e guardado no armazenamento
 * seguro. Não contém dados pessoais; o servidor guarda apenas um hash dele, o
 * suficiente para impedir votos repetidos na mesma ocorrência.
 */
import * as Crypto from 'expo-crypto';
import { secureStorage } from './storage';

const KEY = 'ecoradar.dispositivo';
let cached: string | null = null;
let pending: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  pending ??= (async () => {
    let id = await secureStorage.get(KEY);
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = Crypto.randomUUID();
      await secureStorage.set(KEY, id);
    }
    cached = id;
    return id;
  })();
  return pending;
}
