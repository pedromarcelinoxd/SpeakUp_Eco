/**
 * Agrupamento de marcadores (clustering) por grade em pixels, no zoom atual.
 * Marcadores que cairiam a menos de ~CELL px uns dos outros viram um grupo com a
 * contagem; tocar no grupo aproxima o mapa. O marcador selecionado nunca é agrupado,
 * e a partir de MAX_ZOOM todos aparecem individualmente (posições reais, sem deslocar).
 */
import type { MapMarker } from './types';

export type ClusterItem =
  | { type: 'marker'; marker: MapMarker }
  | { type: 'cluster'; id: string; latitude: number; longitude: number; count: number; hasReports: boolean; ids: string[] };

const CELL = 58;
const MAX_ZOOM = 16;

function project(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const s = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale,
  };
}

export function clusterMarkers(markers: MapMarker[], zoom: number): ClusterItem[] {
  if (zoom >= MAX_ZOOM || markers.length < 2) return markers.map((marker) => ({ type: 'marker', marker }));

  const cells = new Map<string, MapMarker[]>();
  const out: ClusterItem[] = [];
  for (const m of markers) {
    if (m.selected) {
      out.push({ type: 'marker', marker: m });
      continue;
    }
    const p = project(m.latitude, m.longitude, Math.floor(zoom));
    const key = `${Math.floor(p.x / CELL)}:${Math.floor(p.y / CELL)}`;
    const list = cells.get(key);
    if (list) list.push(m);
    else cells.set(key, [m]);
  }

  for (const [key, list] of cells) {
    if (list.length === 1) {
      out.push({ type: 'marker', marker: list[0] });
      continue;
    }
    const latitude = list.reduce((a, m) => a + m.latitude, 0) / list.length;
    const longitude = list.reduce((a, m) => a + m.longitude, 0) / list.length;
    out.push({
      type: 'cluster',
      id: `c:${Math.floor(zoom)}:${key}`,
      latitude,
      longitude,
      count: list.length,
      hasReports: list.some((m) => m.kind === 'report'),
      ids: list.map((m) => m.id),
    });
  }
  return out;
}

/** Zoom ao tocar num grupo: aproxima o suficiente para separar os marcadores. */
export const clusterZoomStep = 2;
