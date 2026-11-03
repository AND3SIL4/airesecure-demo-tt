import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, Rise, useBreathe, useSpring, Words } from '../components/Motion';
import { LogoMark } from '../components/Logo';

export const EndCard: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const mark = useSpring(0, theme.spring.bouncy);
  const b = useBreathe(28, 3);
  // Fundido final a negro (más corto que las entradas)
  const out = ez(frame, [duration - 14, duration], [1, 0], theme.ease.in);
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${b.y}px) scale(${b.s})` }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 34, opacity: mark,
            transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})`, filter: `blur(${interpolate(mark, [0, 1], [12, 0])}px)`,
          }}
        >
          <LogoMark size={120} glow={0.5} />
          <div
            style={{
              fontFamily: theme.fonts.display, fontSize: 104, ...theme.type.hero,
              backgroundImage: theme.gradient.title, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 10,
            }}
          >
            AeroSecure AI
          </div>
        </div>
        <div style={{ marginTop: 50 }}>
          <Words text="La IA prioriza. Tú decides." delay={BEAT * 1.5} per={4} highlight={[3, 4]} style={{ fontSize: 72 }} />
        </div>
        <Rise delay={BEAT * 4} y={14} blur={6}>
          <div
            style={{
              marginTop: 60, fontFamily: theme.fonts.body, fontSize: 24, color: theme.colors.textDim, fontWeight: 500,
              padding: '10px 22px', borderRadius: 999, border: `1px solid ${theme.colors.hairline}`,
            }}
          >
            Demo MVP · detecciones simuladas · aeropuerto ficticio
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
