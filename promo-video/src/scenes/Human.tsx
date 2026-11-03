import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Sub, useBreathe, useSpring, Words } from '../components/Motion';
import { card, CropShot, Region } from '../components/Shot';

// Panel "Acciones" del detalle de alerta (alerta.png)
const ACTIONS: Region = { x: 2088, y: 537, w: 743, h: 562 };
const W = 760;
const K = W / ACTIONS.w;
// Centro del botón "Confirmar incidente" dentro del recorte
const BTN = { x: 371 * K, y: 209 * K, w: 676 * K, h: 78 * K };

export const CLICK_AT = Math.round(BEAT * 4.5);

const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const move = ez(frame, [BEAT * 2.6, CLICK_AT - 4], [0, 1], theme.ease.inOut);
  const x = interpolate(move, [0, 1], [W + 120, BTN.x + 60]);
  const y = interpolate(move, [0, 1], [ACTIONS.h * K + 140, BTN.y + 8]);
  const press = frame >= CLICK_AT && frame < CLICK_AT + 5 ? 0.85 : 1;
  const o = ez(frame, [BEAT * 2.6, BEAT * 3], [0, 1]);
  return (
    <svg
      width={44} height={44} viewBox="0 0 24 24"
      style={{ position: 'absolute', left: x, top: y, opacity: o, transform: `scale(${press})`, transformOrigin: '0 0', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' }}
    >
      <path d="M4 2.5 L4 19 L8.6 14.8 L11.6 21.5 L14.4 20.3 L11.4 13.8 L17.5 13.6 Z" fill={theme.colors.text} stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
};

const Ripple: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - CLICK_AT;
  const s = ez(t, [0, 16], [0.2, 1.6]);
  const o = t < 0 ? 0 : ez(t, [0, 16], [0.7, 0], theme.ease.soft);
  return (
    <div
      style={{
        position: 'absolute', left: BTN.x - 60, top: BTN.y - 60, width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.colors.text}aa, transparent 70%)`,
        opacity: o, transform: `scale(${s})`,
      }}
    />
  );
};

const Toast: React.FC = () => {
  const p = useSpring(CLICK_AT + 6, theme.spring.snappy);
  return (
    <div
      style={{
        marginTop: 34, display: 'flex', alignItems: 'center', gap: 18, padding: '22px 30px', borderRadius: 22,
        background: 'rgba(22,24,30,0.85)', border: `1px solid ${theme.colors.hairline}`,
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8)', fontFamily: theme.fonts.body,
        opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [8, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 22, background: '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#04210E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5 9-10" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.text }}>Incidente creado</div>
        <div style={{ fontSize: 22, color: theme.colors.textDim, fontWeight: 500 }}>Registrado con tu perfil y hora exacta</div>
      </div>
    </div>
  );
};

export const Human: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const panel = useSpring(BEAT * 1.2);
  const b = useBreathe(30, 4);
  const press = frame >= CLICK_AT && frame < CLICK_AT + 5 ? 0.98 : 1;
  return (
    <SceneExit duration={duration}>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 130px', gap: 90 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <Words text="La decisión," delay={2} per={4} align="flex-start" style={{ fontSize: 100, flexWrap: 'nowrap' }} />
          <Words text="siempre humana." delay={BEAT} per={4} align="flex-start" highlight={[1]} style={{ fontSize: 100, marginTop: -30, flexWrap: 'nowrap' }} />
          <Sub delay={BEAT * 2} size={36} style={{ maxWidth: 680 }}>
            Confirmar, descartar o escalar. Cada acción pide confirmación y queda en el historial.
          </Sub>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative', opacity: panel,
              transform: `translateY(${interpolate(panel, [0, 1], [80, 0]) + b.y}px) scale(${interpolate(panel, [0, 1], [0.92, 1]) * press})`,
              filter: `blur(${interpolate(panel, [0, 1], [12, 0])}px)`,
            }}
          >
            <div style={card}>
              <CropShot src="alerta.png" region={ACTIONS} width={W} duration={duration} zoom={[1, 1]} />
            </div>
            <Ripple />
            <Cursor />
          </div>
          <Toast />
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};
