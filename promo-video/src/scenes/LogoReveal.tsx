import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, Rise, SceneExit, useBreathe, useSpring } from '../components/Motion';
import { LogoMark } from '../components/Logo';

export const LogoReveal: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const mark = useSpring(0, theme.spring.bouncy);
  const rot = useSpring(0, theme.spring.smooth);
  const word = useSpring(BEAT * 1.2, theme.spring.smooth);
  const breathe = useBreathe(26, 3);
  // Barrido de luz sobre la marca
  const sweep = ez(frame, [BEAT * 2.2, BEAT * 4], [-40, 140], theme.ease.inOut);
  // Halo detrás de la marca
  const halo = ez(frame, [0, BEAT * 2], [0, 1]);
  return (
    <SceneExit duration={duration} length={12}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute', width: 900, height: 900, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.primary}55, transparent 60%)`,
            opacity: halo * 0.8, transform: `scale(${0.6 + halo * 0.4 + Math.sin(frame / 20) * 0.02})`, filter: 'blur(40px)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${breathe.y}px)` }}>
          <div
            style={{
              transform: `scale(${interpolate(mark, [0, 1], [0.3, 1])}) rotate(${interpolate(rot, [0, 1], [-90, 0])}deg)`,
              opacity: mark, filter: `blur(${interpolate(mark, [0, 1], [16, 0])}px)`,
            }}
          >
            <LogoMark size={190} />
          </div>
          <div
            style={{
              marginTop: 56, fontFamily: theme.fonts.display, fontSize: 150, ...theme.type.hero,
              opacity: word,
              transform: `translateY(${interpolate(word, [0, 1], [50, 0])}px) scale(${interpolate(word, [0, 1], [0.94, 1])})`,
              filter: `blur(${interpolate(word, [0, 1], [14, 0])}px)`,
              backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep - 18}%, rgba(255,255,255,0.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 18}%), ${theme.gradient.title}`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 12,
            }}
          >
            AeroSecure AI
          </div>
          <Rise delay={BEAT * 3} y={20} blur={8}>
            <div style={{ marginTop: 18, fontFamily: theme.fonts.body, fontSize: 44, color: theme.colors.textDim, ...theme.type.sub }}>
              Seguridad aeroportuaria inteligente.
            </div>
          </Rise>
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};
