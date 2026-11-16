import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEcoFonts } from '@/design/fonts';
import { color, font } from '@/design/tokens';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useNotificationNavigation } from '@/lib/useNotificationNavigation';

function RootStack() {
  const { user, ready } = useAuth();
  useNotificationNavigation();

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.ground }} />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: color.ink,
        headerTitleStyle: { fontFamily: font.bold, fontSize: 17 },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: color.ground },
        contentStyle: { backgroundColor: color.ground },
        headerBackButtonDisplayMode: 'minimal',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="denuncia/[id]" options={{ title: '' , headerTransparent: true }} />
        <Stack.Screen name="ponto/[id]" options={{ title: '', headerTransparent: true }} />
        <Stack.Screen name="notificacoes" options={{ title: 'Notificações' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const fontsReady = useEcoFonts();
  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: color.ground }} />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
