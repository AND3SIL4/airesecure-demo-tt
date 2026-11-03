import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, Rise, SceneExit, Sub, useBreathe, useSpring, Words } from '../components/Motion';
import { card, CropShot, Region } from '../components/Shot';

// Evidencia ilustrativa de ALT-2248 (cámara CAM-T1-012) en alerta.png
const EVIDENCE: Region = { x: 528, y: 536, w: 1525, h: 988 };
const EVIDENCE_W = 800;
const K = EVIDENCE_W / EVIDENCE.w;
// Caja de detección dentro del recorte (píxeles originales relativos al recorte)
const BOX = { x: 869, y: 594, w: 230, h: 260 };

export const COUNT_START = BEAT * 3;
const COUNT_LEN = BEAT * 3;

const Factor: React.FC<{ delay: number; name: string; detail: string; value: string }> = ({ delay, name, detail, value }) => {
  const p = useSpring(delay, theme.spring.snappy);
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '14px 0', borderTop: `1px solid ${theme.colors.hairline}`,
        opacity: p, transform: `translateX(${interpolate(p, [0, 1], [40, 0])}px)`,
        filter: `blur(${interpolate(p, [0, 1], [8, 0])}px)`,
      }}
    >
      <div style={{ fontSize: 30, color: theme.colors.text, fontWeight: 600 }}>
        {name} <span style={{ color: theme.colors.textDim, fontWeight: 500 }}>· {detail}</span>
      </div>
      <div style={{ fontSize: 32, color: theme.colors.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
};

const ScorePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = spring({ frame: frame - COUNT_START, fps, config: theme.spring.counter, durationInFrames: COUNT_LEN });
  const value = Math.round(interpolate(c, [0, 1], [0, 94]));
  const glow = ez(frame, [COUNT_START + COUNT_LEN - 6, COUNT_START + COUNT_LEN + 10], [0, 1]);
  return (
    <div
      style={{
        width: 760, padding: '34px 44px 30px', borderRadius: 28, fontFamily: theme.fonts.body,
        background: 'linear-gradient(180deg, rgba(28,30,38,0.9), rgba(16,17,22,0.9))',
        border: `1px solid ${theme.colors.hairline}`, boxShadow: '0 60px 120px -30px rgba(0,0,0,0.85)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 30, color: theme.colors.textDim, fontWeight: 500, paddingBottom: 18 }}>Score de prioridad</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 132, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1,
              color: theme.colors.text, fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: 40, color: theme.colors.textDim, fontWeight: 600 }}>/100</span>
        </div>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.08)', marginTop: 14, overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`, height: '100%', borderRadius: 7, background: theme.gradient.blue,
            boxShadow: `0 0 ${30 * glow}px ${theme.colors.glow}`,
          }}
        />
      </div>
      <div style={{ marginTop: 26 }}>
        <Factor delay={COUNT_START + 8} name="Severidad" detail="Crítica" value="×1,00" />
        <Factor delay={COUNT_START + 13} name="Confianza" detail="modelo demostrativo" value="×0,94" />
        <Factor delay={COUNT_START + 18} name="Criticidad de zona" detail="nivel 3 de 3" value="×1,00" />
      </div>
      <Rise delay={COUNT_START + COUNT_LEN} y={14} blur={6}>
        <div style={{ marginTop: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 24, color: theme.colors.textDim }}>100 × 1,00 × 0,94 × 1,00 ≈ 94</span>
          <span
            style={{
              fontSize: 22, color: theme.colors.text, padding: '6px 14px', borderRadius: 999,
              border: `1px solid ${theme.colors.hairline}`, background: 'rgba(255,255,255,0.05)',
            }}
          >
            Basado en reglas
          </span>
        </div>
      </Rise>
    </div>
  );
};

/** Marco de detección que late sobre la evidencia. */
const DetectionBox: React.FC = () => {
  const frame = useCurrentFrame();
  const p = ez(frame, [BEAT * 2, BEAT * 2.6], [0, 1]);
  const pulse = 1 + Math.sin(frame / 5) * 0.04;
  return (
    <div
      style={{
        position: 'absolute', left: (BOX.x - 14) * K, top: (BOX.y - 14) * K,
        width: (BOX.w + 28) * K, height: (BOX.h + 28) * K, borderRadius: 10,
        border: `3px solid ${theme.colors.critical}`, opacity: p * 0.9,
        transform: `scale(${(1.3 - p * 0.3) * pulse})`,
        boxShadow: `0 0 24px ${theme.colors.critical}88`,
      }}
    />
  );
};

export const Priority: React.FC<{ duration: number }> = ({ duration }) => {
  const evidence = useSpring(BEAT * 1.2);
  const panel = useSpring(BEAT * 1.8);
  const b = useBreathe(32, 4);
  return (
    <SceneExit duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 80 }}>
        <Words text="La IA prioriza." delay={2} per={4} highlight={[1]} style={{ fontSize: 104 }} />
        <Sub delay={BEAT} size={38}>
          Cada alerta llega con un score que puedes explicar.
        </Sub>
      </AbsoluteFill>
      <AbsoluteFill style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60, top: 290, height: 760 }}>
        <div
          style={{
            ...card, opacity: evidence,
            transform: `translateX(${interpolate(evidence, [0, 1], [-80, 0])}px) translateY(${b.y}px) scale(${interpolate(evidence, [0, 1], [0.92, 1])})`,
            filter: `blur(${interpolate(evidence, [0, 1], [12, 0])}px)`,
          }}
        >
          <CropShot src="alerta.png" region={EVIDENCE} width={EVIDENCE_W} duration={duration} zoom={[1, 1.03]}>
            <DetectionBox />
          </CropShot>
        </div>
        <div
          style={{
            opacity: panel,
            transform: `translateX(${interpolate(panel, [0, 1], [80, 0])}px) translateY(${-b.y}px) scale(${interpolate(panel, [0, 1], [0.92, 1])})`,
            filter: `blur(${interpolate(panel, [0, 1], [12, 0])}px)`,
          }}
        >
          <ScorePanel />
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};
