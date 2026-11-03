import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

/** Fondo: negro con dos halos azules que derivan despacio (nunca plano). */
export const BgMesh: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 70) * 60;
  const d2 = Math.cos(frame / 90) * 50;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div
        style={{
          position: 'absolute', width: 1400, height: 1400, borderRadius: '50%', top: -760, left: 260 + d1,
          filter: 'blur(60px)', opacity: 0.55 * intensity,
          background: `radial-gradient(circle, ${theme.colors.primary}40, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute', width: 1100, height: 1100, borderRadius: '50%', bottom: -700, right: -200 - d2,
          filter: 'blur(80px)', opacity: 0.45 * intensity,
          background: `radial-gradient(circle, ${theme.colors.accent}30, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Gradación de color por encima del contenido. */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: 'soft-light', opacity: 0.12 }} />
    <AbsoluteFill
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25), transparent 22%, transparent 78%, rgba(0,0,0,0.35))' }}
    />
  </AbsoluteFill>
);

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none', backgroundImage: NOISE, backgroundSize: '220px',
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.07, mixBlendMode: 'overlay',
      }}
    />
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
  />
);
