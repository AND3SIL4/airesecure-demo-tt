import React from 'react';
import { theme } from '../theme';

/** Marca de AeroSecure AI: escudo con check sobre un cuadrado azul (como en la app). */
export const LogoMark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 1 }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: `linear-gradient(145deg, #4D8DFF 0%, ${theme.colors.primary} 55%, #1A56D6 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 ${size * 0.7 * glow}px ${theme.colors.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
    }}
  >
    <svg
      width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none"
      stroke={theme.colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  </div>
);
