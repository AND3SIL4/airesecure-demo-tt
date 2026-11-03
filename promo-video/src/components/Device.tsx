import React from 'react';
import { theme } from '../theme';
import { KenBurnsShot } from './Shot';

/** Portátil minimalista: pantalla con bisel y base fina. `width` es el ancho de la pantalla. */
export const Laptop: React.FC<{
  src: string;
  width: number;
  duration: number;
  zoom?: [number, number];
  pan?: [number, number];
  origin?: string;
}> = ({ src, width, duration, zoom, pan, origin }) => {
  const bezel = Math.round(width * 0.016);
  const screenH = Math.round((width * 1800) / 2880);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          padding: bezel, borderRadius: bezel * 1.8, background: theme.colors.bezel,
          border: `2px solid ${theme.colors.bezelEdge}`,
          boxShadow: `0 80px 160px -40px rgba(0,0,0,0.9), 0 0 140px -30px ${theme.colors.glow}`,
        }}
      >
        <div style={{ width, height: screenH, borderRadius: bezel * 0.6, overflow: 'hidden', background: '#000' }}>
          <KenBurnsShot src={src} duration={duration} zoom={zoom} pan={pan} origin={origin} />
        </div>
      </div>
      <div
        style={{
          width: width * 1.16, height: Math.round(width * 0.022), marginTop: -2,
          borderRadius: `0 0 ${width * 0.03}px ${width * 0.03}px`,
          background: 'linear-gradient(180deg, #4A4B50 0%, #2A2B2F 60%, #18191C 100%)',
        }}
      />
    </div>
  );
};
