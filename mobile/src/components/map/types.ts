export type LatLng = { latitude: number; longitude: number };

export type MapMarker = LatLng & {
  id: string;
  kind: 'report' | 'point';
  category: string;
  /** Denúncias encerradas (resolvida / não confirmada) aparecem esmaecidas. */
  closed?: boolean;
  selected?: boolean;
};

export type EcoMapHandle = {
  /** Centraliza num ponto; `offsetY` desloca o alvo para cima (abrir espaço para o painel). */
  focus: (target: LatLng, opts?: { zoom?: 'street' | 'neighborhood'; offsetY?: number }) => void;
};

export type EcoMapProps = {
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  onMapPress?: (coord: LatLng) => void;
  initialCenter?: LatLng;
  initialZoom?: 'city' | 'neighborhood' | 'street';
  userLocation?: LatLng | null;
  /** Pino arrastável (fluxo de denúncia). */
  pin?: LatLng | null;
  onPinMove?: (coord: LatLng) => void;
  interactive?: boolean;
  /** Espaço ocupado por painéis sobrepostos, para centralizações corretas. */
  bottomInset?: number;
};
