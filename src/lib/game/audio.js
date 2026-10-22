// 用 WebAudio 合成的簡單音效，不需要音檔。之後要換成真的音效檔，只要改 play() 裡面。

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 瀏覽器規定要使用者操作過才能出聲
window.addEventListener('pointerdown', ac, { once: true });
window.addEventListener('keydown', ac, { once: true });

function tone({ freq = 440, to = freq, dur = 0.1, type = 'square', vol = 0.15, delay = 0 }) {
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.1, vol = 0.2, freq = 1200 }) {
  const a = ac();
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

const SOUNDS = {
  hit: () => tone({ freq: 520, to: 260, dur: 0.08, type: 'triangle', vol: 0.25 }),
  spike: () => {
    tone({ freq: 180, to: 60, dur: 0.18, type: 'square', vol: 0.2 });
    noise({ dur: 0.15, vol: 0.25, freq: 2500 });
  },
  net: () => tone({ freq: 140, to: 90, dur: 0.12, type: 'sine', vol: 0.3 }),
  wall: () => tone({ freq: 300, to: 200, dur: 0.05, type: 'triangle', vol: 0.12 }),
  ground: () => noise({ dur: 0.25, vol: 0.35, freq: 600 }),
  jump: () => tone({ freq: 300, to: 600, dur: 0.08, type: 'sine', vol: 0.06 }),
  dive: () => noise({ dur: 0.2, vol: 0.15, freq: 900 }),
  whistle: () => {
    tone({ freq: 2100, to: 2050, dur: 0.12, type: 'sine', vol: 0.1 });
    tone({ freq: 2100, to: 2000, dur: 0.25, type: 'sine', vol: 0.1, delay: 0.15 });
  },
  score: () => [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'square', vol: 0.06, delay: i * 0.07 })),
  over: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'square', vol: 0.07, delay: i * 0.12 })),
  select: () => tone({ freq: 880, to: 1320, dur: 0.06, type: 'square', vol: 0.05 }),
  move: () => tone({ freq: 660, dur: 0.03, type: 'square', vol: 0.03 }),
};

export function play(name) {
  if (muted) return;
  try {
    SOUNDS[name]?.();
  } catch {
    // 沒有音效裝置就算了
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
