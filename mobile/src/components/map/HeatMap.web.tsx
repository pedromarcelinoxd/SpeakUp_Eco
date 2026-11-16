/**
 * Mapa de calor na pré-visualização web (Leaflet): cada denúncia vira um
 * halo desfocado; onde há muitas juntas, as cores se somam e esquentam.
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { DEFAULT_CENTER } from '@/lib/catalog';
import { HEAT_STOPS, type HeatMapProps } from './heat';

export function HeatMap({ points, center = DEFAULT_CENTER }: HeatMapProps) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [center.latitude, center.longitude], zoom: 12, zoomControl: false, scrollWheelZoom: false });
    m.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'eco-tiles', attribution: '© OpenStreetMap' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
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
    const warm = HEAT_STOPS[3][1];
    points.forEach((p) => {
      L.circleMarker([p.latitude, p.longitude], {
        radius: 26, stroke: false, fillColor: warm, fillOpacity: 0.16 + 0.2 * p.weight, interactive: false, className: 'eco-heat',
      }).addTo(g);
    });
  }, [points]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <style>{'.eco-tiles{filter:saturate(.4) brightness(1.05) contrast(.92)} .eco-heat{filter:blur(10px)} .leaflet-container{background:#EEF0EB;font-family:inherit} .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.7)!important}'}</style>
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}
