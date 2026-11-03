// theme.ts — fuente única de colores, curvas, springs y tipografía del vídeo.
import { Easing } from 'remotion';

export const theme = {
  colors: {
    bg: '#000000',
    bgAlt: '#0B0D12',
    primary: '#2F7BFF', // azul AeroSecure: protagonista, máx. un elemento por frame
    accent: '#5AC8FA',
    critical: '#FF453A',
    text: '#F5F5F7',
    textDim: '#86868B',
    hairline: 'rgba(255,255,255,0.10)',
    glow: 'rgba(47,123,255,0.45)',
    bezel: '#1C1D21',
    bezelEdge: '#3A3B40',
  },
  gradient: {
    // Texto con degradado (estilo keynote)
    title: 'linear-gradient(180deg, #FFFFFF 0%, #C9D6F2 55%, #8EA6D8 100%)',
    blue: 'linear-gradient(90deg, #5AC8FA 0%, #2F7BFF 50%, #7A5CFF 100%)',
  },
  fonts: {
    display: "'Inter Variable', 'Segoe UI', sans-serif",
    body: "'Inter Variable', 'Segoe UI', sans-serif",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // entradas
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // movimientos, Ken Burns
    in: Easing.bezier(0.7, 0, 0.84, 0), // salidas
    soft: Easing.bezier(0.45, 0, 0.55, 1), // derivas lentas
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    counter: { damping: 30, stiffness: 50, mass: 1 },
  },
  type: {
    hero: { fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.04 },
    sub: { fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.3 },
  },
} as const;
