/**
 * Mapa nativo (iOS e Android) com MapLibre e mapas abertos do OpenFreeMap
 * (dados OpenStreetMap). Não exige chave de API nem conta no Google.
 *
 * Todos os marcadores aparecem individualmente, já na visão da cidade (sem
 * agrupamento). Itens no mesmo ponto ficam acessíveis pela lista "Também neste
 * local" do cartão.
 */
import { Camera, Map, Marker, NativeUserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PointStone, ReportDrop } from '@/design/components';
import { shouldAnimate } from '@/design/motion';
import { color } from '@/design/tokens';
import { DEFAULT_CENTER } from '@/lib/catalog';
import type { EcoMapHandle, EcoMapProps } from './types';

/** Estilo claro e discreto, para os marcadores se destacarem (mesma intenção do mapa do painel). */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const ZOOM = { city: 12, neighborhood: 13.6, street: 15.2 } as const;

/** Toques no mapa logo após tocar num marcador são ignorados (o mesmo toque chega aos dois). */
const MARKER_TAP_GUARD_MS = 600;

export const EcoMap = forwardRef<EcoMapHandle, EcoMapProps>(function EcoMap(
  { markers = [], onMarkerPress, onMapPress, initialCenter = DEFAULT_CENTER, initialZoom = 'city', userLocation, pin, onPinMove, interactive = true, bottomInset = 0 },
  ref,
) {
  const camera = useRef<CameraRef>(null);
  const lastMarkerTap = useRef(0);

  useImperativeHandle(ref, () => ({
    focus(target, opts) {
      camera.current?.easeTo({
        center: [target.longitude, target.latitude],
        zoom: ZOOM[opts?.zoom ?? 'street'],
        // Abre espaço para o painel inferior: o ponto fica acima do centro
        padding: { top: 0, left: 0, right: 0, bottom: (opts?.offsetY ?? 0) + bottomInset * 0.4 },
        duration: shouldAnimate() ? 450 : 0,
      });
    },
  }), [bottomInset]);

  // O pino da denúncia se move tocando no mapa (onMapPress) ou é solto onde o usuário tocou.
  const pick = onPinMove ?? onMapPress;

  const tapMarker = (id: string) => {
    lastMarkerTap.current = Date.now();
    onMarkerPress?.(id);
  };

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE}
      dragPan={interactive}
      touchZoom={interactive}
      doubleTapZoom={interactive}
      touchRotate={false}
      touchPitch={false}
      compass={false}
      logo={false}
      attribution
      attributionPosition={{ bottom: bottomInset + 4, right: 8 }}
      onPress={(e) => {
        if (Date.now() - lastMarkerTap.current < MARKER_TAP_GUARD_MS) return;
        const [longitude, latitude] = e.nativeEvent.lngLat;
        if (pin && pick) pick({ latitude, longitude });
        else onMapPress?.({ latitude, longitude });
      }}
    >
      <Camera
        ref={camera}
        initialViewState={{ center: [initialCenter.longitude, initialCenter.latitude], zoom: ZOOM[initialZoom] }}
      />

      {!!userLocation && <NativeUserLocation />}

      {markers.map((m) => (
        <Marker
          key={m.id}
          id={m.id}
          lngLat={[m.longitude, m.latitude]}
          anchor={m.kind === 'report' ? 'bottom' : 'center'}
          onPress={() => tapMarker(m.id)}
        >
          <Pressable
            onPress={() => tapMarker(m.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={m.kind === 'report' ? 'Abrir ocorrência' : 'Abrir ponto de descarte'}
            style={[styles.marker, m.selected && styles.selected]}
            collapsable={false}
          >
            {m.kind === 'report'
              ? <ReportDrop category={m.category} size={m.selected ? 36 : 28} muted={m.closed} onMap />
              : <PointStone category={m.category} size={m.selected ? 32 : 26} onMap />}
          </Pressable>
        </Marker>
      ))}

      {pin && (
        <Marker id="pin" lngLat={[pin.longitude, pin.latitude]} anchor="bottom">
          <View style={styles.pin} collapsable={false}>
            <View style={styles.pinHead}><View style={styles.pinDot} /></View>
            <View style={styles.pinTip} />
          </View>
        </Marker>
      )}
    </Map>
  );
});

const styles = StyleSheet.create({
  marker: { padding: 3, borderRadius: 999 },
  selected: { backgroundColor: 'rgba(32,42,39,0.12)' },
  pin: { alignItems: 'center' },
  pinHead: { width: 34, height: 34, borderRadius: 17, backgroundColor: color.brand, borderWidth: 3, borderColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  pinDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: color.coral },
  pinTip: { width: 3, height: 10, backgroundColor: color.brand, marginTop: -2, borderRadius: 2 },
});
