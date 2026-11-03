import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';
import '@fontsource-variable/inter';
import { theme } from './theme';
import { BEAT, scenes, TOTAL } from './timing';
import { BgMesh, Grade, Grain, Vignette } from './components/Layers';
import { Hook } from './scenes/Hook';
import { Signals } from './scenes/Signals';
import { LogoReveal } from './scenes/LogoReveal';
import { Overview } from './scenes/Overview';
import { Priority, COUNT_START } from './scenes/Priority';
import { Human, CLICK_AT } from './scenes/Human';
import { MapScene } from './scenes/MapScene';
import { Trio } from './scenes/Trio';
import { Privacy } from './scenes/Privacy';
import { EndCard } from './scenes/EndCard';

const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.6 }) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);

const SCENES = [
  { id: 'hook', C: Hook },
  { id: 'signals', C: Signals },
  { id: 'logo', C: LogoReveal },
  { id: 'overview', C: Overview },
  { id: 'priority', C: Priority },
  { id: 'human', C: Human },
  { id: 'map', C: MapScene },
  { id: 'trio', C: Trio },
  { id: 'privacy', C: Privacy },
  { id: 'end', C: EndCard },
] as const;

export const Promo: React.FC = () => {
  const s = scenes;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg, fontFamily: theme.fonts.body }}>
      {/* 1. Fondo */}
      <BgMesh />
      {/* 2–3. Contenido por escena */}
      {SCENES.map(({ id, C }) => (
        <Sequence key={id} from={s[id].from} durationInFrames={s[id].duration} name={id}>
          <C duration={s[id].duration} />
        </Sequence>
      ))}
      {/* 4. Gradación  5. Grano + viñeta */}
      <Grade />
      <Grain />
      <Vignette />

      {/* Música: entra y sale con fundido */}
      <Audio
        src={staticFile('sfx/music.wav')}
        volume={(f) =>
          interpolate(f, [0, 20, TOTAL - 30, TOTAL], [0, 0.55, 0.55, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        }
      />
      {/* Efectos: 2–3 frames antes del golpe visual */}
      <Sfx at={1} src="whoosh.wav" volume={0.35} />
      <Sfx at={s.signals.from - 3} src="whoosh.wav" volume={0.4} />
      <Sfx at={s.logo.from - 36} src="riser.wav" volume={0.45} />
      <Sfx at={s.logo.from} src="hit.wav" volume={0.8} />
      <Sfx at={s.logo.from + 2} src="shimmer.wav" volume={0.5} />
      <Sfx at={s.overview.from + BEAT * 0.8 - 3} src="whoosh.wav" volume={0.5} />
      {[0, 5, 10].map((d) => (
        <Sfx key={d} at={s.overview.from + BEAT * 4 + d - 2} src="click.wav" volume={0.35} />
      ))}
      <Sfx at={s.priority.from - 3} src="whoosh.wav" volume={0.45} />
      {Array.from({ length: 14 }).map((_, i) => (
        <Sfx key={i} at={s.priority.from + COUNT_START + Math.round(i * i * 0.28)} src="tick.wav" volume={0.22} />
      ))}
      <Sfx at={s.human.from - 3} src="whoosh.wav" volume={0.45} />
      <Sfx at={s.human.from + CLICK_AT - 1} src="click.wav" volume={0.7} />
      <Sfx at={s.map.from - 3} src="whoosh.wav" volume={0.45} />
      <Sfx at={s.trio.from - 3} src="whoosh.wav" volume={0.45} />
      <Sfx at={s.privacy.from - 3} src="whoosh.wav" volume={0.4} />
      <Sfx at={s.end.from - 30} src="riser.wav" volume={0.35} />
      <Sfx at={s.end.from} src="hit.wav" volume={0.7} />
      <Sfx at={s.end.from + 2} src="shimmer.wav" volume={0.45} />
    </AbsoluteFill>
  );
};
