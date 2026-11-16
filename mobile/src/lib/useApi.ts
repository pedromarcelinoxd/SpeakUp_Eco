import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Carrega dados da API sempre que a tela recebe foco (mantém app e painel
 * sincronizados sem recarregar o app) e expõe estado de carregamento/erro.
 *
 * `key` identifica o recurso (ex.: id da denúncia, período do ranking):
 * quando muda, os dados são recarregados.
 */
export function useApi<T>(loader: () => Promise<T>, key: string | number | null = null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sempre a versão mais recente do loader, atualizada fora da renderização.
  const loaderRef = useRef(loader);
  const keyRef = useRef(key);
  useLayoutEffect(() => {
    loaderRef.current = loader;
    keyRef.current = key;
  });

  const run = useCallback(async (mode: 'load' | 'refresh', requestKey: typeof key) => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const result = await loaderRef.current();
      // Ignora respostas antigas: o recurso mudou enquanto a requisição viajava.
      if (requestKey !== keyRef.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (requestKey !== keyRef.current) return;
      setError(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    run('load', key);
  }, [run, key]));

  const reload = useCallback(() => run('refresh', keyRef.current), [run]);

  return { data, setData, error, loading, refreshing, reload };
}
