/**
 * Mapa de calor (iOS e Android): concentração de denúncias com a camada
 * "heatmap" do MapLibre. Mesmo estilo claro do mapa principal.
 */
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { DEFAULT_CENTER } from '@/lib/catalog';
import { HEAT_STOPS, type HeatMapProps } from './heat';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export function HeatMap({ points, center = DEFAULT_CENTER }: HeatMapProps) {
  const data = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: points.map((p, i) => ({
      type: 'Feature',
      id: i,
      properties: { weight: p.weight },
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
    })),
  }), [points]);

  return (
    <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE} touchRotate={false} touchPitch={false} compass={false} logo={false} attribution>
      <Camera initialViewState={{ center: [center.longitude, center.latitude], zoom: 11.6 }} />
      <GeoJSONSource id="calor" data={data}>
        <Layer
          id="calor-camada"
          type="heatmap"
          paint={{
            'heatmap-weight': ['get', 'weight'],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 18, 15, 46],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 15, 1.6],
            'heatmap-opacity': 0.85,
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], ...HEAT_STOPS.flat()],
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}
