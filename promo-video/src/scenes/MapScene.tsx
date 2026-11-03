import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT } from '../timing';
import { ez, SceneExit, Sub, useBreathe, useSpring, Words } from '../components/Motion';
import { card, CropShot, Region } from '../components/Shot';

// Lienzo 3D de la vista Mapa (map.png)
const MAP: Region = { x: 554, y: 443, w: 1668, h: 1256 };

export const MapScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const enter = useSpring(BEAT * 0.6, { damping: 24, stiffness: 70, mass: 1.1 });
  // Órbita lenta: la tarjeta gira despacio como si la cámara rodeara la terminal
  const orbitY = interpolate(enter, [0, 1], [-38, -16]) + ez(frame, [BEAT, duration], [0, 12], theme.ease.soft);
  const orbitX = interpolate(enter, [0, 1], [22, 8]);
  const b = useBreathe(36, 5);
  return (
    <SceneExit duration={duration}>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 140, gap: 40 }}>
        <div style={{ width: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Words text="Toda la terminal." delay={BEAT} per={4} align="flex-start" style={{ fontSize: 96 }} />
          <Words text="En 3D." delay={BEAT * 1.8} per={4} align="flex-start" highlight={[1]} style={{ fontSize: 96, marginTop: -26 }} />
          <Sub delay={BEAT * 2.6} size={34}>
            Zonas coloreadas por riesgo y alertas en vivo sobre un plano que puedes recorrer.
          </Sub>
        </div>
        <div style={{ perspective: 2000, flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              ...card, opacity: enter,
              transform: `translateY(${b.y}px) rotateY(${orbitY}deg) rotateX(${orbitX}deg) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
              filter: `blur(${interpolate(enter, [0, 1], [14, 0])}px)`,
              boxShadow: `0 80px 160px -40px rgba(0,0,0,0.9), 0 0 160px -40px ${theme.colors.glow}`,
            }}
          >
            <CropShot src="map.png" region={MAP} width={940} duration={duration} zoom={[1.02, 1.12]} />
          </div>
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};
