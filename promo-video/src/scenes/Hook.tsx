import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Words } from '../components/Motion';

/** Anillos que se expanden desde el centro (pulso de radar). */
const Pulse: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const size = ez(t, [0, BEAT * 4], [80, 1500]);
  const o = ez(t, [0, BEAT * 4], [0.5, 0], theme.ease.soft);
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: '50%', width: size, height: size,
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        border: `1.5px solid ${theme.colors.accent}`, opacity: t < 0 ? 0 : o,
      }}
    />
  );
};

export const Hook: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneExit duration={duration}>
    <AbsoluteFill>
      <Pulse delay={2} />
      <Pulse delay={2 + BEAT} />
      <Pulse delay={2 + BEAT * 2} />
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Words text="Cada segundo" delay={4} per={5} style={{ fontSize: 150 }} />
      <Words text="cuenta." delay={BEAT * 2} highlight={[0]} style={{ fontSize: 150 }} />
    </AbsoluteFill>
  </SceneExit>
);
