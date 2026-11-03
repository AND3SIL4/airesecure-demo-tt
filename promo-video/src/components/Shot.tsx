import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { ez } from './Motion';

// Las capturas son 2880×1800 (1440×900 a 2x).
export const SHOT_W = 2880;
export const SHOT_H = 1800;

export type Region = { x: number; y: number; w: number; h: number };

/** Captura completa con Ken Burns (zoom + paneo lentos). */
export const KenBurnsShot: React.FC<{
  src: string;
  duration: number;
  zoom?: [number, number];
  pan?: [number, number];
  origin?: string;
}> = ({ src, duration, zoom = [1, 1.08], pan = [0, -20], origin = '50% 40%' }) => {
  const frame = useCurrentFrame();
  const s = ez(frame, [0, duration], zoom, theme.ease.soft);
  const x = ez(frame, [0, duration], pan, theme.ease.soft);
  return (
    <Img
      src={staticFile(`shots/${src}`)}
      style={{
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        transform: `scale(${s}) translateX(${x}px)`, transformOrigin: origin,
      }}
    />
  );
};

/** Recorte de una región de la captura (píxeles originales), con Ken Burns suave. */
export const CropShot: React.FC<{
  src: string;
  region: Region;
  width: number;
  duration: number;
  zoom?: [number, number];
  children?: React.ReactNode;
}> = ({ src, region, width, duration, zoom = [1, 1.05], children }) => {
  const frame = useCurrentFrame();
  const k = width / region.w;
  const height = region.h * k;
  const s = ez(frame, [0, duration], zoom, theme.ease.soft);
  return (
    <div style={{ width, height, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: '50% 50%' }}>
        <Img
          src={staticFile(`shots/${src}`)}
          style={{
            position: 'absolute', width: SHOT_W * k, height: SHOT_H * k,
            left: -region.x * k, top: -region.y * k, maxWidth: 'none',
          }}
        />
        {children}
      </div>
    </div>
  );
};

/** Tarjeta flotante (bordes finos y sombra profunda). */
export const card: React.CSSProperties = {
  borderRadius: 28,
  overflow: 'hidden',
  border: `1px solid ${theme.colors.hairline}`,
  boxShadow: '0 60px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
};
