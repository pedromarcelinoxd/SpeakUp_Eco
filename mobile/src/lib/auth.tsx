import { secureStorage } from './storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { api, setToken, setUnauthorizedHandler, type User } from './api';
import { applyServerCategories } from './catalog';
import { registerForPushAsync } from './push';

const TOKEN_KEY = 'ecoradar.token';
const PUSH_KEY = 'ecoradar.pushToken';

type AuthState = {
  user: User | null;
  ready: boolean;
  pushStatus: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const clear = useCallback(async () => {
    setToken(null);
    setUser(null);
    await secureStorage.remove(TOKEN_KEY);
  }, []);

  /** Registra o dispositivo para receber push (não bloqueia o login). */
  const setupPush = useCallback(async () => {
    const { token, reason } = await registerForPushAsync();
    if (!token) {
      setPushStatus(reason ?? null);
      return;
    }
    try {
      await api.registerPushToken(token, Platform.OS);
      await secureStorage.set(PUSH_KEY, token);
      setPushStatus('ativo');
    } catch {
      setPushStatus('Não foi possível registrar o dispositivo no servidor.');
    }
  }, []);

  const startSession = useCallback(async (accessToken: string, u: User) => {
    setToken(accessToken);
    await secureStorage.set(TOKEN_KEY, accessToken);
    setUser(u);
    setupPush();
  }, [setupPush]);

  useEffect(() => {
    setUnauthorizedHandler(() => { clear(); });
    (async () => {
      // Categorias da equipe (nome e cor) antes da primeira tela; sem rede, segue com o catálogo local
      await Promise.race([
        api.categories().then(applyServerCategories).catch(() => {}),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
      const saved = await secureStorage.get(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        try {
          setUser(await api.me());
          setupPush();
        } catch {
          await clear();
        }
      }
      setReady(true);
    })();
  }, [clear, setupPush]);

  const value = useMemo<AuthState>(() => ({
    user,
    ready,
    pushStatus,
    async signIn(email, password) {
      const data = await api.login(email.trim(), password);
      await startSession(data.access_token, data.user);
    },
    async signUp(name, email, password) {
      const data = await api.register(name.trim(), email.trim(), password);
      await startSession(data.access_token, data.user);
    },
    async signOut() {
      const push = await secureStorage.get(PUSH_KEY);
      try {
        if (push) await api.removePushToken(push);
        await api.logout();
      } catch {
        // token já expirado: segue com a saída local
      }
      await secureStorage.remove(PUSH_KEY);
      await clear();
    },
    async refreshUser() {
      setUser(await api.me());
    },
  }), [user, ready, pushStatus, startSession, clear]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
