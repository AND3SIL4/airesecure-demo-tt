import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { SceneExit, useSpring, Words } from '../components/Motion';
import { card, KenBurnsShot } from '../components/Shot';

const ITEMS = [
  { src: 'alertas.png', title: 'Alertas en tiempo real', sub: 'Priorizadas al instante', rot: 9, zoom: [1.0, 1.08] as [number, number] },
  { src: 'incidente.png', title: 'Incidentes trazables', sub: 'Cada paso en el historial', rot: 0, zoom: [1.08, 1.0] as [number, number] },
  { src: 'analisis.png', title: 'Análisis y reportes', sub: 'Tendencias y anomalías', rot: -9, zoom: [1.0, 1.08] as [number, number] },
];

const W = 520;
const H = Math.round((W * 1800) / 2880);

const Panel: React.FC<{ i: number; duration: number }> = ({ i, duration }) => {
  const frame = useCurrentFrame();
  const it = ITEMS[i];
  const p = useSpring(BEAT * 1.4 + i * 6);
  const float = Math.sin((frame + i * 20) / 28) * 5;
  const z = i === 1 ? 80 : 0;
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [120, 0]) + float}px) translateZ(${z}px) rotateY(${it.rot}deg) scale(${interpolate(p, [0, 1], [0.86, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [14, 0])}px)`,
      }}
    >
      <div style={{ ...card, width: W, height: H, borderRadius: 20 }}>
        <KenBurnsShot src={it.src} duration={duration} zoom={it.zoom} pan={[0, i === 1 ? 10 : -10]} origin="45% 35%" />
      </div>
      <div style={{ textAlign: 'center', fontFamily: theme.fonts.body }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: theme.colors.text, letterSpacing: '-0.02em' }}>{it.title}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: theme.colors.textDim, marginTop: 6 }}>{it.sub}</div>
      </div>
    </div>
  );
};

export const Trio: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneExit duration={duration}>
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 110 }}>
      <Words text="Todo, conectado." delay={2} per={4} highlight={[1]} style={{ fontSize: 100 }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 50, top: 230, height: 850, perspective: 2400 }}>
      {ITEMS.map((_, i) => (
        <Panel key={i} i={i} duration={duration} />
      ))}
    </AbsoluteFill>
  </SceneExit>
);
