import type { LatLng } from './types';

export type HeatPoint = LatLng & { weight: number };
export type HeatMapProps = { points: HeatPoint[]; center?: LatLng };

/** Escala de calor (densidade 0–1 → cor): transparente → âmbar → coral → vermelho. */
export const HEAT_STOPS: [number, string][] = [
  [0, 'rgba(244,184,96,0)'],
  [0.2, 'rgba(244,184,96,0.55)'],
  [0.5, '#EE8A5A'],
  [0.8, '#D9472B'],
  [1, '#9F1D12'],
];
