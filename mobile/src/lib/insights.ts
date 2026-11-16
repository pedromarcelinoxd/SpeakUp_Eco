/**
 * Leituras da região calculadas a partir dos dados reais da API.
 */
import type { Point, Report } from './api';
import { DEFAULT_CENTER, statusInfo } from './catalog';
import { distanceKm } from './format';
import type { LatLng } from '@/components/map/types';

const DAY = 86400000;
export const NEAR_KM = 2;

export function withDistance<T extends { latitude: number | null; longitude: number | null }>(items: T[], origin: LatLng | null) {
  const o = origin ?? DEFAULT_CENTER;
  return items
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({ ...i, km: distanceKm(o, { latitude: i.latitude!, longitude: i.longitude! }) }))
    .sort((a, b) => a.km - b.km);
}

export function regionSummary(reports: Report[], points: Point[], origin: LatLng | null) {
  const r = withDistance(reports, origin);
  const p = withDistance(points, origin);
  const since30 = Date.now() - 30 * DAY;
  const near = r.filter((x) => x.km <= NEAR_KM);
  return {
    openNear: near.filter((x) => statusInfo(x.status).open),
    resolved30: r.filter((x) => x.status === 'resolvida' && new Date(x.updated_at ?? x.created_at).getTime() >= since30),
    pointsNear: p.filter((x) => x.km <= NEAR_KM),
    nearestReports: r.filter((x) => statusInfo(x.status).open).slice(0, 5),
    nearestPoints: p.slice(0, 5),
    recentlyResolved: r.filter((x) => x.status === 'resolvida')
      .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
      .slice(0, 3),
  };
}

/** Registros por dia nas últimas `weeks` semanas (mais antigo → hoje). */
export function dailyActivity(reports: { created_at: string }[], weeks = 12) {
  const days = Array(weeks * 7).fill(0) as number[];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  reports.forEach((r) => {
    const age = Math.floor((today.getTime() - new Date(r.created_at).getTime()) / DAY);
    if (age >= 0 && age < days.length) days[days.length - 1 - age] += 1;
  });
  return days;
}
