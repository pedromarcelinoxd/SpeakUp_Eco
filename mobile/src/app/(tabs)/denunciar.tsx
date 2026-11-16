/**
 * Denunciar — 4 etapas: o que é · foto e local · detalhes · revisão.
 * A categoria avança sozinha, o GPS é pedido ao chegar no local e o
 * título vem sugerido: o caminho até "Enviar" é o mais curto do app.
 */
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EcoMap } from '@/components/map/EcoMap';
import type { EcoMapHandle, LatLng } from '@/components/map/types';
import { Banner, Button, Field, IconButton, ReportDrop, Segmented } from '@/design/components';
import { Icon } from '@/design/Icon';
import { shouldAnimate } from '@/design/motion';
import { Text } from '@/design/Text';
import { color, font, motion, radius, readable, space } from '@/design/tokens';
import { api, ApiError, type PhotoAsset, type Report } from '@/lib/api';
import { DEFAULT_CENTER, REPORT_CATEGORIES, SEVERITIES, type ReportCategory, type Severity } from '@/lib/catalog';
import { useAuth } from '@/lib/auth';
import { useMyLocation } from '@/lib/location';

const STEPS = ['O que é', 'Foto e local', 'Detalhes', 'Revisão'];
const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024; // limite do backend

type Photo = PhotoAsset & { fileSize?: number };

/** Denunciar exige conta (o servidor também recusa envios sem login). */
export default function ReportScreen() {
  const { user } = useAuth();
  return user ? <ReportFlow /> : <LoginGate />;
}

function LoginGate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.gate, { paddingTop: insets.top + space.huge }]}>
      <StatusBar style="dark" />
      <View style={styles.gateIcon}><Icon name="flag" size={30} tint={color.brand} /></View>
      <Text variant="title" align="center">Entre para fazer uma denúncia</Text>
      <Text variant="body" tone="muted" align="center">
        Para evitar abusos, só pessoas cadastradas podem denunciar e validar ocorrências. Ver o mapa e as denúncias continua livre.
      </Text>
      <View style={{ gap: space.sm, alignSelf: 'stretch', marginTop: space.md }}>
        <Button label="Entrar ou criar conta" icon="user" onPress={() => router.push('/login')} />
        <Button label="Ver o mapa" variant="secondary" onPress={() => router.navigate('/')} />
      </View>
    </View>
  );
}

function ReportFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useMyLocation();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('media');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Report | null>(null);
  // Denúncia parecida já registrada por perto (o servidor avisa antes de duplicar)
  const [duplicate, setDuplicate] = useState<Report | null>(null);
  const fade = useState(() => new Animated.Value(1))[0];
  const mapRef = useRef<EcoMapHandle>(null);

  // Transição entre etapas: o conteúdo entra deslizando levemente
  useEffect(() => {
    if (!shouldAnimate()) { fade.setValue(1); return; }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: motion.base, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
  }, [step, fade]);

  // Título sugerido a partir da categoria e do bairro, até a pessoa editar
  const suggestedTitle = category ? (district ? `${REPORT_CATEGORIES[category].label} no ${district}` : REPORT_CATEGORIES[category].label) : '';
  const finalTitle = titleTouched ? title : suggestedTitle;

  async function addPhotos(source: 'camera' | 'library') {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', source === 'camera' ? 'Permita o uso da câmera nas configurações do aparelho.' : 'Permita o acesso às fotos nas configurações do aparelho.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.6, // comprime para respeitar o limite de 5 MB do servidor
      allowsMultipleSelection: source === 'library',
      selectionLimit: MAX_PHOTOS - photos.length,
      exif: false,
    };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const valid = result.assets.filter((a) => !a.fileSize || a.fileSize <= MAX_BYTES);
    if (valid.length < result.assets.length) Alert.alert('Foto muito grande', 'Fotos acima de 5 MB foram ignoradas.');
    setPhotos((prev) => [...prev, ...valid.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg', fileName: a.fileName, fileSize: a.fileSize }))].slice(0, MAX_PHOTOS));
    setErrors({});
  }

  async function pick(c: LatLng) {
    setCoords(c);
    setErrors({});
    try {
      const [place] = await Location.reverseGeocodeAsync(c);
      if (place) {
        const street = [place.street, place.streetNumber].filter(Boolean).join(', ');
        setDistrict(place.district ?? '');
        setAddress([street, place.district, place.city || place.subregion].filter(Boolean).join(' · '));
      }
    } catch {
      setAddress('');
    }
  }

  async function requestGps() {
    const c = await location.request();
    if (c) {
      mapRef.current?.focus(c, { zoom: 'street' });
      await pick(c);
    }
    else Alert.alert('Localização indisponível', 'Toque no mapa para marcar o local da ocorrência.');
  }

  function validate(i: number) {
    const e: Record<string, string> = {};
    if (i === 0 && !category) e.category = 'Escolha o tipo de problema.';
    if (i === 1 && !photos.length) e.photos = 'Adicione pelo menos uma foto do local.';
    if (i === 1 && !coords) e.coords = 'Marque onde fica a ocorrência.';
    if (i === 2 && finalTitle.trim().length < 5) e.title = 'Use pelo menos 5 caracteres no título.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function goTo(i: number) {
    for (let k = 0; k < i; k++) if (!validate(k)) { setStep(k); return; }
    setErrors({});
    setStep(i);
    if (i === 1 && !coords) requestGps();
  }

  function chooseCategory(k: ReportCategory) {
    setCategory(k);
    setErrors({});
    // Avança sem revalidar: a categoria acabou de ser escolhida (o estado ainda não atualizou).
    setTimeout(() => {
      setStep(1);
      if (!coords) requestGps();
    }, 160);
  }

  async function submit(ignorarDuplicata = false) {
    for (let i = 0; i < 3; i++) if (!validate(i)) { setStep(i); return; }
    setSending(true);
    setDuplicate(null);
    setErrors({});
    try {
      setSent(await api.createReport({
        photos, categoria: category!, titulo: finalTitle.trim(), descricao: description.trim(), criticidade: severity,
        latitude: coords!.latitude, longitude: coords!.longitude, endereco: address, ignorarDuplicata,
      }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.data?.duplicata) {
        setDuplicate(e.data.duplicata as Report);
      } else {
        setErrors({ submit: e instanceof Error ? e.message : 'Não foi possível enviar.' });
      }
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setStep(0); setCategory(null); setPhotos([]); setCoords(null); setAddress(''); setDistrict('');
    setTitle(''); setTitleTouched(false); setDescription(''); setSeverity('media'); setErrors({}); setSent(null); setDuplicate(null);
  }

  if (sent) return <Success report={sent} onTrack={() => { const id = sent.id; reset(); router.push(`/denuncia/${id}`); }} onAnother={reset} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      {/* Topo: progresso */}
      <View style={[styles.top, readable, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.topRow}>
          <Text variant="label" tone="muted">Etapa {step + 1} de {STEPS.length}</Text>
          {(step > 0 || category) && (
            <Pressable onPress={() => Alert.alert('Descartar denúncia?', 'As informações preenchidas serão apagadas.', [
              { text: 'Continuar editando', style: 'cancel' },
              { text: 'Descartar', style: 'destructive', onPress: reset },
            ])} hitSlop={10} accessibilityRole="button">
              <Text variant="label" tone="muted">Cancelar</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.progress}>
          {STEPS.map((sName, i) => (
            <Pressable key={sName} style={{ flex: 1, gap: 6 }} onPress={() => (i < step ? goTo(i) : undefined)} accessibilityLabel={`Etapa ${i + 1}: ${sName}`}>
              <View style={[styles.bar, i <= step && { backgroundColor: color.brand }]} />
              <Text variant="caption" tone={i === step ? 'default' : 'faint'} numberOfLines={1}>{sName}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}
        contentContainerStyle={[readable, { padding: space.lg, paddingBottom: 140, gap: space.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <View style={{ gap: space.xs }}>
              <Text variant="title">O que você encontrou?</Text>
              <Text variant="body" tone="muted">Escolha o tipo de problema. Você revisa tudo antes de enviar.</Text>
            </View>
            {/* Lista com divisórias finas (mesma gramática das outras listas), não cartões */}
            <View accessibilityRole="radiogroup">
              {(Object.keys(REPORT_CATEGORIES) as ReportCategory[]).filter((k) => !REPORT_CATEGORIES[k].inactive).map((k, i) => {
                const c = REPORT_CATEGORIES[k];
                const active = category === k;
                return (
                  <View key={k}>
                    {i > 0 && <View style={styles.rule} />}
                    <Pressable
                      onPress={() => chooseCategory(k)}
                      style={({ pressed }) => [styles.catRow, pressed && { backgroundColor: color.stone }]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${c.label}. ${c.description}`}
                    >
                      <ReportDrop category={k} size={36} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="subhead">{c.label}</Text>
                        <Text variant="caption" tone="muted">{c.description}</Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioOn]}>
                        {active && <Icon name="check" size={14} tint={color.surface} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            {errors.category && <Text variant="caption" tone="danger">{errors.category}</Text>}
          </>
        )}

        {step === 1 && (
          <>
            <View style={{ gap: space.xs }}>
              <Text variant="title">Foto e local</Text>
              <Text variant="body" tone="muted">Fotografe o problema. Evite mostrar rostos e placas de veículos.</Text>
            </View>

            {photos.length === 0 ? (
              <Pressable onPress={() => addPhotos('camera')} style={({ pressed }) => [styles.camera, pressed && { backgroundColor: color.stone }]} accessibilityRole="button" accessibilityLabel="Tirar foto">
                <Icon name="camera" size={30} tint={color.ink} strokeWidth={1.8} />
                <Text variant="subhead">Tirar foto</Text>
                <Text variant="caption" tone="muted">JPG ou PNG · até 5 fotos</Text>
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
                {photos.map((p, i) => (
                  <View key={p.uri} style={styles.thumb}>
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} accessibilityLabel={`Foto ${i + 1}`} />
                    {i === 0 && <View style={styles.cover}><Text variant="caption" tone="inverse" style={{ fontFamily: font.semibold }}>Capa</Text></View>}
                    <Pressable style={styles.remove} onPress={() => setPhotos((ps) => ps.filter((x) => x.uri !== p.uri))} accessibilityLabel={`Remover foto ${i + 1}`} hitSlop={6}>
                      <Icon name="x" size={14} tint={color.surface} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <Pressable style={[styles.thumb, styles.addThumb]} onPress={() => addPhotos('camera')} accessibilityLabel="Tirar outra foto">
                    <Icon name="camera" size={22} />
                  </Pressable>
                )}
              </ScrollView>
            )}
            <Pressable onPress={() => addPhotos('library')} style={styles.inlineLink} accessibilityRole="button" disabled={photos.length >= MAX_PHOTOS}>
              <Icon name="image-plus" size={18} tint={color.brand} />
              <Text variant="label" tone="brand">Escolher da galeria</Text>
            </Pressable>
            {errors.photos && <Text variant="caption" tone="danger">{errors.photos}</Text>}

            <View style={styles.mapBox}>
              <EcoMap
                ref={mapRef}
                initialCenter={coords ?? location.coords ?? DEFAULT_CENTER}
                initialZoom={coords ? 'street' : 'neighborhood'}
                pin={coords}
                onPinMove={pick}
                onMapPress={pick}
                userLocation={location.coords}
              />
              {!coords && (
                <View style={styles.mapHint} pointerEvents="none">
                  <Text variant="caption" tone="inverse" style={{ fontFamily: font.semibold }}>Toque no mapa para marcar o local</Text>
                </View>
              )}
            </View>
            <View style={styles.addressRow}>
              <Icon name="pin" size={20} tint={coords ? color.ink : color.faint} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{coords ? (address || 'Local marcado no mapa') : 'Local ainda não marcado'}</Text>
                {coords && <Text variant="caption" tone="muted">{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} · arraste o pino para ajustar</Text>}
              </View>
            </View>
            <Button label={location.loading ? 'Obtendo localização…' : 'Usar minha localização'} icon="locate" variant="secondary" loading={location.loading} onPress={requestGps} />
            {errors.coords && <Text variant="caption" tone="danger">{errors.coords}</Text>}
          </>
        )}

        {step === 2 && (
          <>
            <Text variant="title">Detalhes</Text>
            <Field label="Título" value={finalTitle} onChangeText={(t) => { setTitle(t); setTitleTouched(true); }} maxLength={120} error={errors.title} />
            <Field
              label="Descrição"
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
              placeholder="O que você viu? Há quanto tempo está assim?"
              hint="Opcional, mas ajuda a equipe a validar mais rápido."
            />
            <View style={{ gap: space.xs }}>
              <Text variant="label">Gravidade</Text>
              <Segmented
                value={severity}
                onChange={setSeverity}
                options={(Object.keys(SEVERITIES) as Severity[]).map((k) => ({ value: k, label: SEVERITIES[k].label }))}
                style={{ alignSelf: 'stretch' }}
              />
              <Text variant="caption" tone="muted">{SEVERITIES[severity].hint}</Text>
            </View>
          </>
        )}

        {step === 3 && category && coords && (
          <>
            <Text variant="title">Revise e envie</Text>
            <Image source={{ uri: photos[0].uri }} style={styles.reviewPhoto} accessibilityLabel="Foto de capa" />
            <View style={{ gap: space.xxs }}>
              <Text variant="headline">{finalTitle}</Text>
              {!!description && <Text variant="body" tone="secondary">{description}</Text>}
            </View>
            <View>
              {[
                { label: 'Tipo', value: REPORT_CATEGORIES[category].label, step: 0 },
                { label: 'Fotos', value: `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}`, step: 1 },
                { label: 'Local', value: address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`, step: 1 },
                { label: 'Gravidade', value: SEVERITIES[severity].label, step: 2 },
              ].map((r) => (
                <Pressable key={r.label} onPress={() => setStep(r.step)} style={styles.reviewRow} accessibilityRole="button" accessibilityLabel={`Editar ${r.label}`}>
                  <Text variant="label" tone="muted" style={{ width: 84 }}>{r.label}</Text>
                  <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>{r.value}</Text>
                  <Icon name="pencil" size={16} tint={color.faint} />
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Icon name="shield" size={18} tint={color.muted} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                Evite incluir informações pessoais ou confrontar pessoas envolvidas. A denúncia aparece no mapa e no painel da equipe.
              </Text>
            </View>
            {errors.submit && <Banner text={errors.submit} />}
            {duplicate && (
              <View style={styles.duplicate} accessibilityRole="alert">
                <Text variant="bodyStrong">Já existe uma denúncia parecida bem perto daqui</Text>
                <Text variant="caption" tone="secondary">“{duplicate.titulo ?? 'Denúncia'}” · {duplicate.validacoes.existe} {duplicate.validacoes.existe === 1 ? 'confirmação' : 'confirmações'}. Confirmar a existente ajuda mais do que criar outra.</Text>
                <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' }}>
                  <Button label="Ver e confirmar a existente" size="sm" onPress={() => { const id = duplicate.id; reset(); router.push(`/denuncia/${id}`); }} />
                  <Button label="É outro problema, enviar" size="sm" variant="secondary" onPress={() => submit(true)} />
                </View>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>

      {/* Ação principal ao alcance do polegar */}
      {step > 0 && (
        <View style={styles.actions}>
          <IconButton icon="arrow-left" label="Voltar" variant="plain" size={52} onPress={() => { setErrors({}); setStep(step - 1); }} />
          {step < 3
            ? <Button label="Continuar" variant="primary" iconRight="arrow-right" style={{ flex: 1 }} onPress={() => goTo(step + 1)} />
            : <Button label="Enviar denúncia" icon="send" variant="report" style={{ flex: 1 }} loading={sending} onPress={() => submit()} />}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/** Confirmação: a casca verde ocupa a tela, com a pedra assentando. */
function Success({ report, onTrack, onAnother }: { report: Report; onTrack: () => void; onAnother: () => void }) {
  const insets = useSafeAreaInsets();
  const a = useState(() => new Animated.Value(shouldAnimate() ? 0 : 1))[0];
  useEffect(() => {
    if (!shouldAnimate()) return;
    Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();
  }, [a]);
  return (
    <View style={[styles.success, { paddingTop: insets.top + space.huge, paddingBottom: space.xl }]}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.successStone, { opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
        <Icon name="check" size={40} tint={color.brand} strokeWidth={2.6} />
      </Animated.View>
      <View style={{ gap: space.sm, marginTop: space.xl }}>
        <Text variant="display">Denúncia enviada</Text>
        <Text variant="body" tone="muted">
          Ela já aparece no mapa para todos. Agora outras pessoas podem confirmar se o problema existe; o status muda conforme a validação da comunidade e da equipe.
        </Text>
        <Text variant="label" tone="brand" style={{ marginTop: space.xs }}>Protocolo #{report.id}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: space.sm }}>
        <Button label="Acompanhar denúncia" onPress={onTrack} />
        <Button label="Registrar outra" variant="secondary" onPress={onAnother} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm, backgroundColor: color.ground },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { flexDirection: 'row', gap: space.xs },
  bar: { height: 4, borderRadius: 2, backgroundColor: color.line },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 72, paddingVertical: space.sm, borderRadius: radius.sm },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.line, marginLeft: 52 },
  gate: { flex: 1, backgroundColor: color.ground, alignItems: 'center', paddingHorizontal: space.xl, gap: space.sm, ...readable },
  gateIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: color.brandTint, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  duplicate: { gap: space.xs, padding: space.md, borderRadius: radius.lg, backgroundColor: color.warningTint, borderWidth: 1, borderColor: '#F3D9A4' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: color.brand, borderColor: color.brand },
  camera: { height: 168, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.faint, alignItems: 'center', justifyContent: 'center', gap: 4 },
  thumb: { width: 112, height: 112, borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.stone },
  addThumb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.faint, backgroundColor: 'transparent' },
  cover: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(32,42,39,0.78)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  remove: { position: 'absolute', right: 6, top: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(32,42,39,0.78)', alignItems: 'center', justifyContent: 'center' },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start', paddingVertical: space.xxs },
  mapBox: { height: 230, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.stone, marginTop: space.xs },
  mapHint: { position: 'absolute', top: space.sm, alignSelf: 'center', backgroundColor: 'rgba(32,42,39,0.82)', paddingHorizontal: space.sm, paddingVertical: 6, borderRadius: radius.pill },
  addressRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  reviewPhoto: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.lg, backgroundColor: color.stone },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: color.ground, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  success: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  successStone: { width: 84, height: 84, borderRadius: 22, backgroundColor: color.brandTint, alignItems: 'center', justifyContent: 'center' },
});
