import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/design/Icon';
import { color, font } from '@/design/tokens';

/**
 * Barra de abas clara: superfície branca, aba ativa em verde-petróleo.
 * Prioridade do usuário: Mapa · Denunciar · Descarte · Ranking · Perfil —
 * Denunciar fica no centro, em coral queimado, ao alcance do polegar.
 */
function TabIcon({ name, color: tint }: { name: IconName; color: string }) {
  return <Icon name={name} size={23} tint={tint} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Rótulo sempre abaixo do ícone (em tablets o padrão é ao lado, o que cortava "Denunciar")
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.sage,
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11.5, lineHeight: 15 },
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopWidth: 1,
          borderTopColor: color.line,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        sceneStyle: { backgroundColor: color.ground },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: ({ color: c }) => <TabIcon name="map" color={c as string} /> }} />
      <Tabs.Screen name="descarte" options={{ title: 'Descarte', tabBarIcon: ({ color: c }) => <TabIcon name="recycle" color={c as string} /> }} />
      <Tabs.Screen
        name="denunciar"
        options={{
          title: 'Denunciar',
          tabBarLabelStyle: { fontFamily: font.bold, fontSize: 11.5, lineHeight: 15, color: color.coralInk },
          tabBarIcon: () => (
            <View style={{ width: 52, height: 34, borderRadius: 12, backgroundColor: color.coral, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={24} tint={color.onCoral} strokeWidth={2.4} />
            </View>
          ),
          tabBarAccessibilityLabel: 'Nova denúncia',
        }}
      />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', tabBarIcon: ({ color: c }) => <TabIcon name="trophy" color={c as string} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color: c }) => <TabIcon name="user" color={c as string} /> }} />
    </Tabs>
  );
}
