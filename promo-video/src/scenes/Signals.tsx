import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Words } from '../components/Motion';

const COLS = 32;
const ROWS = 16;
// Señales "calientes" (columna, fila, color): pocas, para que el ojo las encuentre.
const HOT: [number, number, string][] = [
  [6, 4, theme.colors.critical],
  [23, 11, theme.colors.critical],
  [14, 13, '#FF9F0A'],
  [27, 3, '#FF9F0A'],
  [3, 12, '#FF9F0A'],
];

/** Rejilla de puntos: cada punto es una cámara o sensor. Aparecen en onda desde el centro. */
const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dx = c - COLS / 2;
      const dy = (r - ROWS / 2) * 1.6;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const p = spring({ frame: frame - dist * 1.1, fps, config: theme.spring.snappy });
      const hot = HOT.find(([hc, hr]) => hc === c && hr === r);
      const hotP = hot ? ez(frame, [BEAT * 2.5, BEAT * 3.2], [0, 1]) : 0;
      const blink = hot ? 0.75 + 0.25 * Math.sin(frame / 4) : 1;
      const size = 6 + hotP * 10;
      dots.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: 'absolute', left: 120 + c * 54.5, top: 150 + r * 52,
            width: size, height: size, borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${p})`,
            opacity: p * (hot ? blink : 0.32),
            background: hot && hotP > 0 ? hot[2] : theme.colors.textDim,
            boxShadow: hot && hotP > 0 ? `0 0 ${24 * hotP}px ${hot[2]}` : 'none',
          }}
        />,
      );
    }
  }
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

export const Signals: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const drift = ez(frame, [0, duration], [1.0, 1.06], theme.ease.soft);
  return (
    <SceneExit duration={duration}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <Grid />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.2) 60%, transparent 80%)' }}
      />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Words text="Cientos de señales." delay={6} per={4} style={{ fontSize: 112 }} />
        <Words text="Una sola terminal." delay={BEAT * 2.5} per={4} style={{ fontSize: 112 }} />
      </AbsoluteFill>
    </SceneExit>
  );
};
