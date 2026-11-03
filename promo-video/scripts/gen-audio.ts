// Genera la banda sonora y los efectos (WAV 16-bit estéreo, 48 kHz) de forma determinista.
// Uso: bun scripts/gen-audio.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SR = 48000;
const OUT = join(import.meta.dir, '..', 'public', 'sfx');
mkdirSync(OUT, { recursive: true });

// Debe coincidir con src/timing.ts
const BPM = 100;
const BEAT = 60 / BPM; // 0.6 s
const TOTAL_SEC = 1494 / 30;
const DROP_SEC = 216 / 30; // entra el pulso con el logo
const OUTRO_SEC = 1314 / 30; // el pulso se retira en la tarjeta final

let seed = 2048;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

function writeWav(name: string, L: Float32Array, R: Float32Array = L) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, name), buf);
  console.log('ok', name, (n / SR).toFixed(2) + 's');
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const smooth = (x: number) => x * x * (3 - 2 * x);

// ---------- Música ----------
function music() {
  const n = Math.ceil(TOTAL_SEC * SR) + SR;
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  // Progresión Am – F – C – G, un compás (4 pulsos) por acorde
  const chords = [
    [57, 60, 64, 69],
    [53, 57, 60, 65],
    [48, 55, 60, 64],
    [55, 59, 62, 67],
  ];
  const bass = [45, 41, 36, 43];
  const bar = BEAT * 4;
  let lpL = 0;
  let lpR = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ci = Math.floor(t / bar) % 4;
    const chord = chords[ci];
    // Pad: senos desafinados con un poco de 2º armónico, entra suave
    const padIn = smooth(Math.min(1, t / 3));
    const padOut = t > TOTAL_SEC - 3 ? smooth(Math.max(0, (TOTAL_SEC - t) / 3)) : 1;
    let pl = 0;
    let pr = 0;
    for (let k = 0; k < chord.length; k++) {
      const f = midi(chord[k]);
      pl += Math.sin(2 * Math.PI * f * 0.997 * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t);
      pr += Math.sin(2 * Math.PI * f * 1.003 * t) + 0.25 * Math.sin(2 * Math.PI * f * 2.004 * t);
    }
    const tremolo = 0.85 + 0.15 * Math.sin(2 * Math.PI * t / (BEAT * 2));
    pl *= 0.055 * padIn * padOut * tremolo;
    pr *= 0.055 * padIn * padOut * tremolo;
    // Filtro paso bajo de un polo que se abre con el drop
    const open = t < DROP_SEC ? 0.04 + 0.08 * (t / DROP_SEC) : t > OUTRO_SEC ? 0.08 : 0.16;
    lpL += open * (pl - lpL);
    lpR += open * (pr - lpR);
    let l = lpL;
    let r = lpR;

    const beatT = t % BEAT;
    const inGroove = t >= DROP_SEC && t < OUTRO_SEC;
    if (inGroove) {
      // Kick: seno con caída de tono
      const kf = 48 + 90 * Math.exp(-beatT * 30);
      const kick = Math.sin(2 * Math.PI * kf * beatT) * Math.exp(-beatT * 9) * 0.55;
      // Bajo sincopado en la corchea
      const off = (t + BEAT / 2) % BEAT;
      const bf = midi(bass[ci]);
      const bassNote = Math.sin(2 * Math.PI * bf * off) * Math.exp(-off * 5) * 0.22;
      // Hi-hat en el contratiempo
      const hat = off < 0.05 ? (rand() * 2 - 1) * Math.exp(-off * 90) * 0.06 : 0;
      l += kick + bassNote + hat * 0.7;
      r += kick + bassNote + hat;
    }
    // Sub largo en la tarjeta final
    if (t >= OUTRO_SEC) {
      const s = t - OUTRO_SEC;
      const sub = Math.sin(2 * Math.PI * 41.2 * s) * Math.exp(-s * 0.6) * 0.35;
      l += sub;
      r += sub;
    }
    L[i] = l;
    R[i] = r;
  }
  writeWav('music.wav', L, R);
}

// ---------- Efectos ----------
function whoosh() {
  const d = 0.55;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let bp = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / d;
    const env = Math.sin(Math.PI * Math.pow(x, 0.7)) ** 2;
    const cutoff = 0.02 + 0.25 * Math.sin(Math.PI * x);
    const noise = rand() * 2 - 1;
    lp += cutoff * (noise - lp);
    bp += 0.5 * (lp - bp);
    const v = (lp - bp * 0.5) * env * 0.9;
    L[i] = v * (1 - x * 0.6);
    R[i] = v * (0.4 + x * 0.6);
  }
  writeWav('whoosh.wav', L, R);
}

function hit() {
  const d = 1.6;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 38 + 70 * Math.exp(-t * 18);
    const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.4);
    const click = (rand() * 2 - 1) * Math.exp(-t * 120) * 0.35;
    L[i] = (body + click) * 0.9;
  }
  writeWav('hit.wav', L);
}

function tick() {
  const d = 0.06;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    L[i] = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 110) * 0.5;
  }
  writeWav('tick.wav', L);
}

function shimmer() {
  const d = 2.4;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const notes = [81, 84, 88, 93, 96];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    notes.forEach((m, k) => {
      const start = k * 0.06;
      if (t < start) return;
      const s = t - start;
      const env = Math.exp(-s * 2.2) * Math.min(1, s * 200);
      l += Math.sin(2 * Math.PI * midi(m) * s) * env * (k % 2 ? 0.6 : 1);
      r += Math.sin(2 * Math.PI * midi(m) * 1.002 * s) * env * (k % 2 ? 1 : 0.6);
    });
    L[i] = l * 0.16;
    R[i] = r * 0.16;
  }
  writeWav('shimmer.wav', L, R);
}

function riser() {
  const d = 1.2;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / d;
    const noise = rand() * 2 - 1;
    lp += (0.01 + 0.3 * x * x) * (noise - lp);
    const tone = Math.sin(2 * Math.PI * (200 + 900 * x * x) * t) * 0.15;
    L[i] = (lp * 1.4 + tone) * x * x * (x < 0.97 ? 1 : (1 - x) / 0.03);
  }
  writeWav('riser.wav', L);
}

function click() {
  const d = 0.12;
  const n = Math.floor(d * SR);
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 900 * Math.exp(-t * 25);
    L[i] = (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 45) + (rand() * 2 - 1) * Math.exp(-t * 400) * 0.3) * 0.7;
  }
  writeWav('click.wav', L);
}

music();
whoosh();
hit();
tick();
shimmer();
riser();
click();
