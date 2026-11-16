/**
 * Pré-visualização web do mapa (Leaflet + OpenStreetMap), com os mesmos
 * marcadores do app nativo. Usada só no navegador; o app usa EcoMap.tsx.
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as lucide from 'lucide';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { shouldAnimate } from '@/design/motion';
import { color } from '@/design/tokens';
import { DEFAULT_CENTER, pointCategory, reportCategory } from '@/lib/catalog';
import type { EcoMapHandle, EcoMapProps, MapMarker } from './types';

const ZOOM = { city: 13, neighborhood: 15, street: 17 } as const;

/** Nome do ícone do design system → ícone Lucide (mesmo desenho do app). */
const LUCIDE: Record<string, string> = {
  trash: 'Trash2', brick: 'BrickWall', flame: 'Flame', droplets: 'Droplets', axe: 'Axe', help: 'CircleHelp',
  warehouse: 'Warehouse', battery: 'BatteryCharging', phone: 'Smartphone', droplet: 'Droplet', pill: 'Pill',
  bulb: 'Lightbulb', recycle: 'Recycle', package: 'Package',
};

type Node = [string, Record<string, string | number>, Node[]?];
function svg(iconName: string, size: number, stroke: string) {
  const node = (lucide as unknown as Record<string, Node[] | Node>)[LUCIDE[iconName] ?? 'CircleHelp'];
  const children = (Array.isArray(node[0]) ? node : (node as Node)[2] ?? []) as Node[];
  const inner = children.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function markerIcon(m: MapMarker) {
  if (m.kind === 'report') {
    const s = m.selected ? 36 : 28;
    const bg = m.closed ? color.line : color.coral;
    const fg = m.closed ? color.ink2 : color.onCoral;
    return L.divIcon({
      className: '',
      iconSize: [s + 6, s + 6],
      iconAnchor: [(s + 6) / 2, s + 4],
      html: `<div style="padding:3px;border-radius:999px;${m.selected ? 'background:rgba(32,42,39,.12)' : ''}">
        <div style="width:${s}px;height:${s}px;border-radius:50% 50% 50% ${s * 0.16}px;transform:rotate(-45deg);background:${bg};display:grid;place-items:center;border:2px solid #fff;box-shadow:0 3px 8px rgba(32,42,39,.26)">
          <div style="transform:rotate(45deg);display:grid">${svg(reportCategory(m.category).icon, s * 0.46, fg)}</div></div></div>`,
    });
  }
  const s = m.selected ? 32 : 26;
  return L.divIcon({
    className: '',
    iconSize: [s + 6, s + 6],
    iconAnchor: [(s + 6) / 2, (s + 6) / 2],
    html: `<div style="padding:3px;border-radius:999px;${m.selected ? 'background:rgba(32,42,39,.12)' : ''}">
      <div style="width:${s}px;height:${s}px;border-radius:${s * 0.24}px;background:${color.brand};display:grid;place-items:center;border:2px solid #fff;box-shadow:0 3px 8px rgba(32,42,39,.26)">
      ${svg(pointCategory(m.category).icon, s * 0.48, color.surface)}</div></div>`,
  });
}

const userIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;border-radius:50%;background:${color.info};border:3px solid #fff;box-shadow:0 0 0 8px rgba(37,99,235,.18)"></div>`,
});

const pinIcon = L.divIcon({
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  html: `<svg width="36" height="44" viewBox="0 0 36 44"><path d="M18 43s15-14 15-25A15 15 0 0 0 3 18c0 11 15 25 15 25z" fill="${color.brand}" stroke="#fff" stroke-width="3"/><circle cx="18" cy="18" r="5.5" fill="${color.coral}"/></svg>`,
});

export const EcoMap = forwardRef<EcoMapHandle, EcoMapProps>(function EcoMap(
  { markers = [], onMarkerPress, onMapPress, initialCenter = DEFAULT_CENTER, initialZoom = 'city', userLocation, pin, onPinMove, interactive = true },
  ref,
) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const extra = useRef<L.LayerGroup | null>(null);
  const handlers = useRef({ onMarkerPress, onMapPress, onPinMove });
  handlers.current = { onMarkerPress, onMapPress, onPinMove };

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: [initialCenter.latitude, initialCenter.longitude],
      zoom: ZOOM[initialZoom],
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      // Sem movimento (acessibilidade / aba oculta): sem fade de tiles nem zoom animado
      fadeAnimation: shouldAnimate(),
      zoomAnimation: shouldAnimate(),
      markerZoomAnimation: shouldAnimate(),
    });
    m.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'eco-tiles',
      attribution: '© OpenStreetMap',
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => handlers.current.onMapPress?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    layer.current = L.layerGroup().addTo(m);
    extra.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.forEach((mk) => {
      L.marker([mk.latitude, mk.longitude], { icon: markerIcon(mk), zIndexOffset: mk.selected ? 1000 : mk.kind === 'report' ? 500 : 0, keyboard: false })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); handlers.current.onMarkerPress?.(mk.id); })
        .addTo(g);
    });
  }, [markers]);

  useEffect(() => {
    const g = extra.current;
    if (!g) return;
    g.clearLayers();
    if (userLocation) L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon, interactive: false }).addTo(g);
    if (pin) {
      const p = L.marker([pin.latitude, pin.longitude], { icon: pinIcon, draggable: !!onPinMove }).addTo(g);
      p.on('dragend', () => {
        const ll = p.getLatLng();
        handlers.current.onPinMove?.({ latitude: ll.lat, longitude: ll.lng });
      });
    }
  }, [userLocation, pin, onPinMove]);

  useImperativeHandle(ref, () => ({
    focus(target, opts) {
      const m = map.current;
      if (!m) return;
      const z = ZOOM[opts?.zoom ?? 'street'];
      const pt = m.project([target.latitude, target.longitude], z).add([0, (opts?.offsetY ?? 0) / 2]);
      if (shouldAnimate()) m.flyTo(m.unproject(pt, z), z, { duration: 0.5 });
      else m.setView(m.unproject(pt, z), z, { animate: false });
    },
  }), []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <style>{'.eco-tiles{filter:saturate(.55) brightness(1.04) contrast(.94)} .leaflet-container{background:#EEF0EB;font-family:inherit} .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.7)!important}'}</style>
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
});
