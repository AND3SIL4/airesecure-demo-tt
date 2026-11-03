import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type EasingFn = (t: number) => number;

/** interpolate con curva y clamp obligatorios. */
export const ez = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: EasingFn = theme.ease.out,
) => interpolate(frame, input, output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Progreso de un spring a partir de un retardo. */
export const useSpring = (delay: number, config: { damping: number; stiffness: number; mass: number } = theme.spring.smooth) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/** Entrada estilo keynote: opacidad + subida + escala + desenfoque que se aclara. */
export const Rise: React.FC<{
  delay?: number;
  y?: number;
  blur?: number;
  scaleFrom?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, y = 40, blur = 12, scaleFrom = 0.96, style, children }) => {
  const p = useSpring(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(p, [0, 1], [scaleFrom, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [blur, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Revelado palabra a palabra con desenfoque. `highlight` = índices de palabras con el degradado azul. */
export const Words: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  highlight?: number[];
  gradient?: string;
  align?: 'center' | 'flex-start';
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 4, highlight = [], gradient = theme.gradient.title, align = 'center', style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const size = typeof style?.fontSize === 'number' ? style.fontSize : 120;
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: align,
        columnGap: Math.round(size * 0.24), fontFamily: theme.fonts.display, ...theme.type.hero, ...style,
      }}
    >
      {text.split(' ').map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        const hi = highlight.includes(i);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [size * 0.32, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
              filter: `blur(${interpolate(p, [0, 1], [10, 0])}px)`,
              backgroundImage: hi ? theme.gradient.blue : gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              paddingBottom: Math.round(size * 0.1),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/** Envoltorio de escena: salida más rápida que la entrada (escala + desenfoque + fundido). */
export const SceneExit: React.FC<{ duration: number; length?: number; children: React.ReactNode }> = ({
  duration,
  length = 10,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = duration - length;
  const o = ez(frame, [a, duration], [1, 0], theme.ease.in);
  const s = ez(frame, [a, duration], [1, 1.05], theme.ease.in);
  const b = ez(frame, [a, duration], [0, 14], theme.ease.in);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, transform: `scale(${s})`, filter: `blur(${b}px)` }}>
      {children}
    </div>
  );
};

/** Micro-movimiento para elementos en reposo. */
export const useBreathe = (period = 30, amp = 4) => {
  const frame = useCurrentFrame();
  return { y: Math.sin(frame / period) * amp, s: 1 + Math.sin(frame / (period * 0.8)) * 0.006 };
};

/** Texto secundario (gris Apple). */
export const Sub: React.FC<{ delay?: number; size?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  delay = 0,
  size = 40,
  style,
  children,
}) => (
  <Rise delay={delay} y={24} blur={8}>
    <div style={{ fontFamily: theme.fonts.body, fontSize: size, color: theme.colors.textDim, ...theme.type.sub, ...style }}>
      {children}
    </div>
  </Rise>
);
