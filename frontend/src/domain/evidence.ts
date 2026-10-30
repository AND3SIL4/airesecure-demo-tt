// Evidencia ilustrativa por tipo de alerta (research R9).
// El recuadro de detección se expresa en % del lienzo 16:9 (viewBox 320 × 180 de cada SVG en
// public/evidence/) y siempre enmarca el objeto o patrón, nunca a personas.

export interface DetectionBox {
  /** Esquina superior izquierda y tamaño, en % del ancho (x, w) y del alto (y, h). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EvidenceMeta {
  box: DetectionBox;
  /** Texto alternativo de la ilustración (sin afirmar certeza). */
  alt: string;
  /** Etiqueta corta del recuadro. */
  boxLabel: string;
}

export const EVIDENCE_META: Record<string, EvidenceMeta> = {
  equipaje_abandonado: {
    box: { x: 57, y: 62, w: 15, h: 30 },
    alt: 'Ilustración de una sala con bancos y una maleta sin acompañante junto a ellos.',
    boxLabel: 'Posible equipaje sin supervisión',
  },
  objeto_inusual: {
    box: { x: 35, y: 66, w: 17, h: 24 },
    alt: 'Ilustración de un pasillo con una caja sin identificar en el suelo, junto a una columna.',
    boxLabel: 'Posible objeto inusual',
  },
  acceso_restringido: {
    box: { x: 60, y: 24, w: 22, h: 62 },
    alt: 'Ilustración de una puerta de acceso restringido entreabierta, con el lector de acceso encendido.',
    boxLabel: 'Posible acceso no autorizado',
  },
  comportamiento_anomalo: {
    box: { x: 30, y: 58, w: 44, h: 38 },
    alt: 'Ilustración de un vestíbulo con una trayectoria de movimiento irregular marcada en el suelo.',
    boxLabel: 'Posible patrón de movimiento irregular',
  },
  concentracion_personas: {
    box: { x: 40, y: 52, w: 36, h: 42 },
    alt: 'Ilustración de una sala de embarque con un mapa de calor de densidad elevada cerca de la puerta.',
    boxLabel: 'Posible concentración inusual',
  },
  permanencia_inusual: {
    box: { x: 22, y: 56, w: 22, h: 36 },
    alt: 'Ilustración de una zona comercial con un área de permanencia prolongada marcada en el suelo.',
    boxLabel: 'Posible permanencia prolongada',
  },
  reporte_operador: {
    box: { x: 46, y: 30, w: 16, h: 30 },
    alt: 'Ilustración de un plano de la terminal con un marcador en el punto reportado por el operador.',
    boxLabel: 'Posible evento en el punto reportado',
  },
};

const FALLBACK_EVIDENCE: EvidenceMeta = {
  box: { x: 35, y: 35, w: 30, h: 40 },
  alt: 'Ilustración genérica de una zona de la terminal.',
  boxLabel: 'Posible zona de interés',
};

export function evidenceMeta(typeCode: string): EvidenceMeta {
  return EVIDENCE_META[typeCode] ?? FALLBACK_EVIDENCE;
}

export const EVIDENCE_LEGEND = 'Imagen ilustrativa · sin datos personales';
