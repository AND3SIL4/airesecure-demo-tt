import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Sub, useSpring, Words } from '../components/Motion';
import { card } from '../components/Shot';

const ART = ['equipaje_abandonado.svg', 'acceso_restringido.svg', 'concentracion_personas.svg'];

const Art: React.FC<{ i: number; duration: number }> = ({ i, duration }) => {
  const frame = useCurrentFrame();
  const p = useSpring(BEAT * 1.6 + i * 5);
  const kb = ez(frame, [0, duration], i % 2 ? [1.08, 1] : [1, 1.08], theme.ease.soft);
  return (
    <div
      style={{
        ...card, width: 400, height: 250, borderRadius: 20, opacity: p * 0.9,
        transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [10, 0])}px)`,
      }}
    >
      <Img src={staticFile(`evidence/${ART[i]}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})` }} />
    </div>
  );
};

export const Privacy: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneExit duration={duration}>
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
      <Words text="Sin rostros. Sin datos personales." delay={2} per={3} style={{ fontSize: 92 }} />
      <Sub delay={BEAT} size={36}>
        La evidencia se muestra como ilustraciones. Privacidad desde el diseño.
      </Sub>
    </AbsoluteFill>
    <AbsoluteFill style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, top: 330, height: 700 }}>
      {ART.map((_, i) => (
        <Art key={i} i={i} duration={duration} />
      ))}
    </AbsoluteFill>
  </SceneExit>
);
