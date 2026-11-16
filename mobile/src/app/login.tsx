import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Banner, Button, Field, Segmented } from '@/design/components';
import { Text } from '@/design/Text';
import { color, font, radius, space } from '@/design/tokens';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (mode === 'register' && name.trim().length < 2) return setError('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Informe um e-mail válido.');
    if (mode === 'register' && password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.');
    if (!password) return setError('Informe sua senha.');
    setLoading(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(name, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + space.xxxl }]}>
          <Logo size={48} />
          <Text style={styles.brand} accessibilityRole="header">EcoRadar</Text>
          <Text variant="headline" tone="muted" style={{ fontFamily: font.semibold }}>
            Identifique. Denuncie. <Text variant="headline" tone="brand">Transforme.</Text>
          </Text>
          <Text variant="body" tone="muted" style={{ marginTop: space.sm, maxWidth: 320 }}>
            Registre problemas ambientais no mapa da sua cidade e encontre onde descartar cada resíduo.
          </Text>
        </View>

        <View style={[styles.form, { paddingBottom: insets.bottom + space.xl }]}>
          <Segmented
            value={mode}
            onChange={(m) => { setMode(m); setError(null); }}
            options={[{ value: 'login', label: 'Entrar' }, { value: 'register', label: 'Criar conta' }]}
            style={{ alignSelf: 'stretch' }}
          />
          {mode === 'register' && (
            <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Como devemos te chamar?" />
          )}
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="voce@email.com" />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            placeholder={mode === 'register' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          {error && <Banner text={error} />}
          <Button label={mode === 'login' ? 'Entrar' : 'Criar conta'} onPress={submit} loading={loading} />
          <Text variant="caption" tone="muted" align="center">A mesma conta funciona no app e no painel web.</Text>
          {__DEV__ && <Text variant="caption" tone="faint" align="center" style={{ fontSize: 11 }}>Servidor: {API_URL}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.xs },
  brand: { fontFamily: font.heavy, fontSize: 40, lineHeight: 44, color: color.brand, letterSpacing: -1, marginTop: space.lg },
  form: { flex: 1, backgroundColor: color.surface, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, gap: space.md },
});
