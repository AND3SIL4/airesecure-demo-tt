import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Sub, useBreathe, useSpring, Words } from '../components/Motion';
import { Laptop } from '../components/Device';

/** Chip de cristal con una cifra clave. */
const Chip: React.FC<{ delay: number; value: string; label: string; dot: string; style: React.CSSProperties }> = ({
  delay,
  value,
  label,
  dot,
  style,
}) => {
  const p = useSpring(delay, theme.spring.snappy);
  const b = useBreathe(24 + delay % 7, 5);
  return (
    <div
      style={{
        position: 'absolute', ...style,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [40, 0]) + b.y}px) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [10, 0])}px)`,
        padding: '22px 30px', borderRadius: 24,
        background: 'rgba(22,24,30,0.72)', backdropFilter: 'blur(24px)',
        border: `1px solid ${theme.colors.hairline}`,
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', gap: 18, fontFamily: theme.fonts.body,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, background: dot, boxShadow: `0 0 16px ${dot}` }} />
      <div>
        <div style={{ fontSize: 46, fontWeight: 700, color: theme.colors.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        <div style={{ fontSize: 22, color: theme.colors.textDim, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
};

export const Overview: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const enter = useSpring(BEAT * 0.8, { damping: 26, stiffness: 60, mass: 1.2 });
  const tilt = interpolate(enter, [0, 1], [38, 6]) - ez(frame, [BEAT * 3, duration], [0, 6], theme.ease.soft);
  const y = interpolate(enter, [0, 1], [520, 0]);
  const breathe = useBreathe(34, 4);
  return (
    <SceneExit duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 70 }}>
        <Words text="Todo el centro de operaciones." delay={2} per={3} style={{ fontSize: 76 }} />
        <Sub delay={BEAT * 1.2} size={38}>
          Alertas, incidentes y riesgo de la terminal, en una sola vista.
        </Sub>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', top: 300, perspective: 2200 }}>
        <div
          style={{
            transform: `translateY(${y + breathe.y}px) rotateX(${tilt}deg)`,
            transformOrigin: '50% 100%', opacity: ez(frame, [BEAT * 0.8, BEAT * 1.6], [0, 1]),
          }}
        >
          <Laptop src="resumen.png" width={1100} duration={duration} zoom={[1.0, 1.06]} pan={[0, -12]} origin="40% 30%" />
        </div>
      </AbsoluteFill>
      <Chip delay={BEAT * 4} value="13" label="alertas activas" dot={theme.colors.textDim} style={{ left: 130, top: 470 }} />
      <Chip delay={BEAT * 4 + 5} value="3" label="críticas ahora" dot={theme.colors.critical} style={{ right: 140, top: 420 }} />
      <Chip delay={BEAT * 4 + 10} value="3,4 min" label="respuesta media hoy" dot={theme.colors.primary} style={{ right: 110, top: 720 }} />
    </SceneExit>
  );
};
