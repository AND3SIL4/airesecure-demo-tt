// Toda la línea de tiempo se expresa en pulsos (100 BPM a 30 fps = 18 frames por pulso).
export const FPS = 30;
export const BPM = 100;
export const BEAT = (FPS * 60) / BPM; // 18
export const beats = (n: number) => Math.round(n * BEAT);

const lengths = {
  hook: 6,
  signals: 6,
  logo: 8,
  overview: 10,
  priority: 11,
  human: 9,
  map: 9,
  trio: 9,
  privacy: 5,
  end: 10,
} as const;

export type SceneId = keyof typeof lengths;

let cursor = 0;
export const scenes = Object.fromEntries(
  (Object.keys(lengths) as SceneId[]).map((id) => {
    const from = cursor;
    const duration = beats(lengths[id]);
    cursor += duration;
    return [id, { from, duration }];
  }),
) as Record<SceneId, { from: number; duration: number }>;

export const TOTAL = cursor; // 1494
