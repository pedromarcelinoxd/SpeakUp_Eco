import {
  Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold, useFonts,
} from '@expo-google-fonts/archivo';

/**
 * Archivo (Omnibus-Type, OFL) em proporção normal. Títulos e números usam os
 * pesos fortes (700/800) — sem o corte expandido, que deixava as letras achatadas.
 */
export function useEcoFonts() {
  const [loaded, error] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  // Em caso de erro, segue com a fonte do sistema em vez de travar o app.
  return loaded || !!error;
}
