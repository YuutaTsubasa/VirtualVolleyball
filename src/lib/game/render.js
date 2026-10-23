// 畫面：背景、角色、球、特效、計分板。只讀取比賽狀態，不改它。

import { W, H, GROUND, NET, BALL_R, PLAYER_HALF_W } from './constants.js';
import { EXPRESSIONS, pickLine } from './characters.js';
import { asset, currentConfig } from '../art-style.svelte.js';

// 內部解析度：一般風格 2 倍（1920×1080）比較銳利；像素風格用較低的倍數再放大（見 style-assets.js）
let SCALE = 2;

// 圖素：依目前畫風取圖（docs/art/<風格>-v1），沒有的退回 90 年代版；載入失敗時退回程式畫的版本。
const ART_PATHS = {
  court: 'game/court.webp',
  net: 'game/net.webp',
  ball: 'game/ball.webp',
  spark: 'effects/hit-spark.webp',
  sand: 'effects/sand-puff.webp',
  burst: 'effects/score-burst.webp',
  trail: 'effects/spike-trail.webp',
  scorePanel: 'ui/score-panel.webp',
};
const art = (key) => loadImage(asset(ART_PATHS[key]));
// 球網圖的座標、比分底板的數字位置、角色腳底錨點：每種風格可以不同（style-assets.js 的 styleConfig）
let cfg = currentConfig();

// 比賽畫面上的字、計分板、對話泡泡的顏色：跟介面用同一組 CSS 變數，限色風格（Game Boy）也一致
const pal = { text: '#fff', ink: '#142a63', flash: '#ffe066', portrait: '#5aa9ec', paper: '#fff', accent: '#ff5d8f' };
let palStyle = null;
function updatePalette() {
  const style = document.documentElement.dataset.style ?? 'anime90';
  if (style === palStyle) return;
  palStyle = style;
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  pal.text = v('--on-dark', '#fff');
  pal.ink = v('--navy', '#142a63');
  pal.flash = style === 'anime90' ? '#ffe066' : v('--gold', '#ffe066');
  pal.portrait = v('--hud-portrait', '#5aa9ec');
  pal.paper = v('--paper-white', '#fff');
  pal.accent = v('--accent', '#ff5d8f');
}

// ---------- 圖片 ----------

const images = new Map();
function loadImage(src) {
  if (images.has(src)) return images.get(src);
  const img = new Image();
  img.src = src;
  images.set(src, img);
  return img;
}
const ready = (img) => img && img.complete && img.naturalWidth > 0;

// 從胸像裁出頭部（含頭髮），當作 Q 版身體上的大頭
const HEAD_CROP = { x: 0.08, y: 0, w: 0.84, h: 0.63 };
const heads = new Map();
function headFor(character, expression) {
  const src = character.portraits[expression] ?? character.portraits.normal;
  const key = src;
  if (heads.has(key)) return heads.get(key);
  const img = loadImage(src);
  if (!ready(img)) return null;
  const sw = img.naturalWidth * HEAD_CROP.w;
  const sh = img.naturalHeight * HEAD_CROP.h;
  const c = document.createElement('canvas');
  c.width = Math.round(sw);
  c.height = Math.round(sh);
  c.getContext('2d').drawImage(img, img.naturalWidth * HEAD_CROP.x, img.naturalHeight * HEAD_CROP.y, sw, sh, 0, 0, sw, sh);
  heads.set(key, c);
  return c;
}

export function preload(characters) {
  for (const c of characters) {
    for (const e of EXPRESSIONS) loadImage(c.portraits[e]);
    if (c.sprite) loadImage(c.spriteSrc);
  }
  for (const key of Object.keys(ART_PATHS)) art(key);
}

// ---------- 背景（畫一次存起來） ----------

let bgCanvas = null;
function buildBackground() {
  const c = document.createElement('canvas');
  c.width = W * SCALE;
  c.height = H * SCALE;
  const g = c.getContext('2d');
  g.scale(SCALE, SCALE);

  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#5fb8ff');
  sky.addColorStop(0.65, '#b9e6ff');
  sky.addColorStop(1, '#fff3d6');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, GROUND);

  // 太陽
  g.fillStyle = 'rgba(255,240,170,0.5)';
  g.beginPath();
  g.arc(820, 90, 70, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff6c8';
  g.beginPath();
  g.arc(820, 90, 46, 0, Math.PI * 2);
  g.fill();

  // 遠山
  g.fillStyle = '#8fb9c9';
  g.beginPath();
  g.moveTo(0, 360);
  for (let x = 0; x <= W; x += 40) g.lineTo(x, 330 - Math.sin(x * 0.011) * 40 - Math.sin(x * 0.031) * 14);
  g.lineTo(W, 380);
  g.lineTo(0, 380);
  g.fill();

  // 台北 101 剪影
  g.fillStyle = '#6f98ab';
  const tx = 150;
  g.fillRect(tx - 2, 175, 4, 30);
  for (let i = 0; i < 8; i++) {
    const y = 205 + i * 18;
    g.beginPath();
    g.moveTo(tx - 12, y);
    g.lineTo(tx + 12, y);
    g.lineTo(tx + 15, y + 18);
    g.lineTo(tx - 15, y + 18);
    g.fill();
  }
  g.fillRect(tx - 20, 349, 40, 30);

  // 海
  const sea = g.createLinearGradient(0, 370, 0, 410);
  sea.addColorStop(0, '#2e9fd6');
  sea.addColorStop(1, '#7fd3ef');
  g.fillStyle = sea;
  g.fillRect(0, 370, W, 45);
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const x = (i * 137) % W;
    const y = 378 + ((i * 53) % 30);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 26, y);
    g.stroke();
  }

  // 沙灘
  const sand = g.createLinearGradient(0, 405, 0, H);
  sand.addColorStop(0, '#f8e3a8');
  sand.addColorStop(1, '#e9c47a');
  g.fillStyle = sand;
  g.beginPath();
  g.moveTo(0, 415);
  for (let x = 0; x <= W; x += 30) g.lineTo(x, 410 + Math.sin(x * 0.02) * 4);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.fill();
  g.fillStyle = 'rgba(160,110,40,0.18)';
  for (let i = 0; i < 260; i++) {
    const x = (i * 9301 + 49297) % 233280 / 233280 * W;
    const y = 420 + ((i * 7919) % 1000) / 1000 * (H - 420);
    g.fillRect(x, y, 2, 2);
  }
  // 場地線
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(24, GROUND + 2);
  g.lineTo(W - 24, GROUND + 2);
  g.stroke();

  return c;
}

// 程式畫的球網（沒有球網圖時）
function drawNetShape(g) {
  const left = NET.x - NET.w / 2;
  g.fillStyle = '#7a5230';
  g.fillRect(NET.x - 4, NET.top - 6, 8, GROUND - NET.top + 6);
  g.fillStyle = 'rgba(30,30,40,0.18)';
  g.fillRect(left, NET.top + 6, NET.w, (GROUND - NET.top) * 0.55);
  g.strokeStyle = 'rgba(20,20,30,0.55)';
  g.lineWidth = 1;
  for (let y = NET.top + 6; y < NET.top + 6 + (GROUND - NET.top) * 0.55; y += 7) {
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(left + NET.w, y);
    g.stroke();
  }
  g.fillStyle = '#ffffff';
  g.fillRect(left - 2, NET.top, NET.w + 4, 7);
  g.fillStyle = '#d62828';
  g.beginPath();
  g.arc(NET.x, NET.top - 4, 5, 0, Math.PI * 2);
  g.fill();
}

function drawNet(g) {
  const img = art('net');
  if (!ready(img)) return drawNetShape(g);
  const NET_IMG = cfg.net;
  const scale = (GROUND + 4 - NET.top) / (NET_IMG.bottom - NET_IMG.tape);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  // 網面在網柱右邊：讓「網柱＋網面」整體置中在物理的網上
  const cx = ((NET_IMG.left + NET_IMG.right) / 2) * scale;
  g.drawImage(img, NET.x - cx, NET.top - NET_IMG.tape * scale, w, h);
}

// ---------- 特效 ----------

const particles = [];
const effects = []; // 圖片特效：火花、沙塵、得分閃光
const bubbles = [];

function effect(key, x, y, w, life, { rot = 0, grow = 0.3, alpha = 1, flip = false } = {}) {
  effects.push({ key, x, y, w, life, max: life, rot, grow, alpha, flip });
}
let shake = 0;

function burst(x, y, color, n, speed, life = 30, gravity = 0.25) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.6);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life, max: life, color, gravity, size: 2 + Math.random() * 3 });
  }
}

// 每個角色目前的表情與持續時間
const mood = [
  { expression: 'normal', timer: 0 },
  { expression: 'normal', timer: 0 },
];
function setMood(side, expression, frames) {
  mood[side] = { expression, timer: frames };
}

function say(side, text, frames = 110) {
  if (!text) return;
  bubbles.splice(0, bubbles.length, ...bubbles.filter((b) => b.side !== side));
  bubbles.push({ side, text, timer: frames, max: frames });
}

export function resetEffects() {
  particles.length = 0;
  effects.length = 0;
  bubbles.length = 0;
  shake = 0;
  setMood(0, 'normal', 0);
  setMood(1, 'normal', 0);
  lastFacing[0] = 1;
  lastFacing[1] = -1;
}

// 依比賽事件產生特效與台詞
export function handleEvents(match) {
  for (const e of match.events) {
    switch (e.type) {
      case 'spike':
        effect('spark', e.x, e.y, 130, 16, { rot: Math.random() * Math.PI });
        burst(e.x, e.y, '#fff3a0', 8, 7, 18, 0);
        shake = Math.max(shake, 6);
        break;
      case 'hit':
        effect('spark', e.x, e.y, 64, 11, { rot: Math.random() * Math.PI, alpha: 0.85 });
        break;
      case 'ground':
        effect('sand', e.x, GROUND - 22, 240, 40, { grow: 0.4 });
        burst(e.x, GROUND - 4, '#e4c27a', 12, 5, 36);
        shake = Math.max(shake, 10);
        break;
      case 'land':
      case 'dive': {
        const x = e.x ?? match.players[e.side].x;
        effect('sand', x, GROUND - 12, e.type === 'dive' ? 150 : 100, 22, { alpha: 0.75, flip: Math.random() < 0.5 });
        break;
      }
      case 'score': {
        effect('burst', match.ball.x, Math.min(match.ball.y, GROUND - 60), 220, 45, { grow: 0.5 });
        const loser = 1 - e.side;
        setMood(e.side, 'happy', 120);
        setMood(loser, Math.random() < 0.5 ? 'sad' : 'surprised', 120);
        if (Math.random() < 0.7) say(e.side, pickLine(match.players[e.side].character, 'score'));
        else say(loser, pickLine(match.players[loser].character, 'miss'));
        break;
      }
      case 'over':
        setMood(e.side, 'win', 1e9);
        setMood(1 - e.side, 'sad', 1e9);
        bubbles.length = 0;
        break;
    }
  }
}

// ---------- 角色 ----------

// 角色面向：移動或飛撲時看速度方向，飛撲後起身時維持飛撲的方向，站著不動時面向球網
const lastFacing = [1, -1];
function facingOf(p) {
  if (p.state !== 'recover' && Math.abs(p.vx) > 0.1) lastFacing[p.side] = Math.sign(p.vx);
  else if (p.state === 'normal') lastFacing[p.side] = p.toward;
  return lastFacing[p.side];
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

// 沒有正式 sprite 時：頭像大頭 + 程式畫的 Q 版身體
function drawChibi(g, p, expression, celebrate) {
  const ch = p.character;
  const t = p.anim;
  const running = p.onGround && Math.abs(p.vx) > 0.1 && p.state === 'normal';
  const airborne = !p.onGround;
  const facing = facingOf(p);

  g.save();
  g.translate(p.x, p.y);

  if (p.state === 'dive') {
    g.translate(0, -18);
    // 往飛撲的方向倒下去
    g.rotate((Math.sign(p.vx) || p.toward) * 1.25);
  }

  // 落地壓扁、起跳拉長
  let sx = 1;
  let sy = 1;
  if (airborne) {
    sy = 1 + Math.min(0.1, Math.abs(p.vy) * 0.006);
    sx = 1 / sy;
  } else if (p.state === 'recover') {
    sy = 0.88;
    sx = 1.1;
  }
  const bob = celebrate ? -Math.abs(Math.sin(t * 0.15)) * 18 : running ? -Math.abs(Math.sin(t * 0.35)) * 4 : Math.sin(t * 0.08) * 1.2;
  g.translate(0, bob);
  g.scale(sx, sy);

  const outline = 'rgba(40,30,30,0.85)';
  g.lineWidth = 2.5;
  g.strokeStyle = outline;

  // 腿
  const legSwing = running ? Math.sin(t * 0.35) * 9 : 0;
  const legY = airborne ? -26 : -24;
  g.fillStyle = ch.skin;
  for (const s of [-1, 1]) {
    const lx = s * 9 + (s === 1 ? legSwing : -legSwing) * facing;
    rr(g, lx - 6, legY, 12, airborne ? 18 : 24, 6);
    g.fill();
    g.stroke();
    g.fillStyle = '#ffffff';
    rr(g, lx - 8 + facing * 2, (airborne ? -10 : -2) - 4, 16, 8, 4);
    g.fill();
    g.stroke();
    g.fillStyle = ch.skin;
  }

  // 短褲
  g.fillStyle = ch.shorts;
  rr(g, -19, -36, 38, 16, 6);
  g.fill();
  g.stroke();

  // 身體
  g.fillStyle = ch.clothes;
  rr(g, -21, -64, 42, 34, 12);
  g.fill();
  g.stroke();

  // 手：放下時畫在頭後面，舉起來時畫在頭前面（不然會被大頭擋住）
  const swinging = p.lastHit < 12 || p.spikeTimer > 0;
  const armUp = swinging || celebrate || airborne || p.state === 'dive';
  const drawArms = () => {
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const shoulderX = s * 19;
      let hx;
      let hy;
      if (p.state === 'dive') {
        hx = shoulderX + p.toward * 30;
        hy = -66;
      } else if (armUp) {
        const strong = swinging && s === facing;
        hx = s * (strong ? 50 : 42) + (swinging ? facing * 8 : 0);
        hy = strong ? -112 : -96;
      } else {
        const swing = running ? Math.sin(t * 0.35 + (s > 0 ? Math.PI : 0)) * 8 : 0;
        hx = shoulderX + s * 6 + swing;
        hy = -36;
      }
      g.lineWidth = 11;
      g.strokeStyle = outline;
      g.beginPath();
      g.moveTo(shoulderX, -56);
      g.lineTo(hx, hy);
      g.stroke();
      g.lineWidth = 7;
      g.strokeStyle = ch.skin;
      g.stroke();
    }
  };
  if (!armUp) drawArms();

  // 頭
  const head = headFor(ch, expression) ?? headFor(ch, 'normal');
  const headW = 118;
  if (head) {
    const headH = headW * (head.height / head.width);
    g.save();
    if (p.state !== 'dive') g.rotate(Math.max(-0.12, Math.min(0.12, p.vx * 0.012)));
    g.drawImage(head, -headW / 2, -58 - headH, headW, headH);
    g.restore();
  } else {
    g.fillStyle = ch.hair;
    g.beginPath();
    g.arc(0, -98, 40, 0, Math.PI * 2);
    g.fill();
  }

  // 領口蓋住頭像的切邊
  g.fillStyle = ch.collar;
  g.lineWidth = 2.5;
  g.strokeStyle = outline;
  g.beginPath();
  g.moveTo(-21, -62);
  g.quadraticCurveTo(0, -48, 21, -62);
  g.lineTo(21, -66);
  g.quadraticCurveTo(0, -56, -21, -66);
  g.closePath();
  g.fill();
  g.stroke();

  if (armUp) drawArms();

  g.restore();
}

// 角色圖集：8 格橫排，順序同下（docs/art/anime90-v1）
const SPRITE_FRAMES = ['idle', 'run1', 'run2', 'jump', 'spike', 'dive', 'win', 'lose'];
function drawSprite(g, p, img, celebrate, sad) {
  const fw = img.naturalWidth / SPRITE_FRAMES.length;
  const fh = img.naturalHeight;
  let frame = 'idle';
  if (celebrate) frame = 'win';
  else if (sad) frame = 'lose';
  else if (p.state === 'dive' || p.state === 'recover') frame = 'dive';
  else if (!p.onGround) frame = p.spikeTimer > 0 || p.lastHit < 10 ? 'spike' : 'jump';
  else if (Math.abs(p.vx) > 0.1) frame = Math.floor(p.anim / 8) % 2 ? 'run1' : 'run2';
  const i = SPRITE_FRAMES.indexOf(frame);
  const drawH = cfg.spriteSize;
  const drawW = drawH * (fw / fh);
  const facing = facingOf(p);
  // 起身時壓扁一點、等待時微微呼吸
  const breathe = frame === 'idle' ? 1 + Math.sin(p.anim * 0.08) * 0.012 : 1;
  const squash = p.state === 'recover' ? 0.94 : 1;
  g.save();
  g.translate(p.x, p.y);
  if (facing < 0) g.scale(-1, 1);
  g.scale(1 / squash, breathe * squash);
  g.drawImage(img, i * fw, 0, fw, fh, -drawW / 2, -drawH * cfg.spriteAnchorY, drawW, drawH);
  g.restore();
}

function drawPlayer(g, match, p) {
  const m = mood[p.side];
  const over = match.phase === 'over';
  const celebrate = over && match.winner === p.side;
  const sad = over && match.winner !== p.side;
  // 地上的影子
  const lift = Math.max(0, GROUND - p.y);
  g.fillStyle = `rgba(80,50,20,${0.25 - Math.min(0.15, lift / 1500)})`;
  g.beginPath();
  g.ellipse(p.x, GROUND + 3, PLAYER_HALF_W * (1 - lift / 600), 7, 0, 0, Math.PI * 2);
  g.fill();

  const ch = p.character;
  const sprite = ch.sprite ? loadImage(ch.spriteSrc) : null;
  if (ready(sprite)) drawSprite(g, p, sprite, celebrate, sad);
  else drawChibi(g, p, m.timer > 0 ? m.expression : 'normal', celebrate);
}

// ---------- 球 ----------

function drawBall(g, b) {
  const trail = art('trail');
  if (b.power && ready(trail) && b.y > -BALL_R) {
    // 扣殺的光尾：頭在球的位置，往速度的反方向拖
    g.save();
    g.translate(b.x, b.y);
    g.rotate(Math.atan2(b.vy, b.vx));
    g.globalAlpha = 0.9;
    g.drawImage(trail, -170, -30, 180, 60);
    g.restore();
  } else if (b.power) {
    b.trail.forEach((t, i) => {
      g.fillStyle = `rgba(255,${120 + i * 15},40,${0.5 - i * 0.06})`;
      g.beginPath();
      g.arc(t.x, t.y, BALL_R * (1 - i * 0.08), 0, Math.PI * 2);
      g.fill();
    });
  }
  // 影子
  const lift = Math.max(0, GROUND - b.y);
  g.fillStyle = `rgba(80,50,20,${Math.max(0.05, 0.25 - lift / 1600)})`;
  g.beginPath();
  g.ellipse(b.x, GROUND + 3, BALL_R * Math.max(0.4, 1 - lift / 700), 5, 0, 0, Math.PI * 2);
  g.fill();

  if (b.y < -BALL_R) {
    // 球飛出畫面上方：畫個箭頭提示
    g.fillStyle = '#ff5d5d';
    g.beginPath();
    g.moveTo(b.x, 6);
    g.lineTo(b.x - 10, 22);
    g.lineTo(b.x + 10, 22);
    g.fill();
    return;
  }

  const img = art('ball');
  if (ready(img)) {
    // 球的圖在 256 裡占 240（四周有透明邊）
    const size = BALL_R * 2 * (256 / 240);
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.angle);
    g.drawImage(img, -size / 2, -size / 2, size, size);
    g.restore();
    return;
  }

  g.save();
  g.translate(b.x, b.y);
  g.rotate(b.angle);
  g.fillStyle = '#ffd23f';
  g.beginPath();
  g.arc(0, 0, BALL_R, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.clip();
  g.lineWidth = 9;
  g.strokeStyle = '#1f5fbf';
  for (let i = 0; i < 3; i++) {
    g.rotate((Math.PI * 2) / 3);
    g.beginPath();
    g.arc(BALL_R * 0.9, 0, BALL_R * 0.8, Math.PI * 0.55, Math.PI * 1.45);
    g.stroke();
  }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath();
  g.arc(-7, -8, 7, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 2.5;
  g.strokeStyle = 'rgba(40,30,30,0.85)';
  g.beginPath();
  g.arc(0, 0, BALL_R, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

// ---------- 計分板與文字 ----------

function outlinedText(g, text, x, y, size, fill = pal.text, align = 'center') {
  g.font = `900 ${size}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size / 5;
  g.strokeStyle = pal.ink;
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

// 頭像都朝右畫；右邊的玩家左右翻過來，兩個人都面向中間
function drawFacing(g, img, x, y, w, h, side) {
  if (side === 0) return g.drawImage(img, x, y, w, h);
  g.save();
  g.translate(x + w, y);
  g.scale(-1, 1);
  g.drawImage(img, 0, 0, w, h);
  g.restore();
}

function drawHud(g, match, names) {
  const panel = art('scorePanel');
  if (ready(panel)) return drawScoreboard(g, match, names, panel);
  for (const side of [0, 1]) {
    const p = match.players[side];
    const m = mood[side];
    const expression = m.timer > 0 ? m.expression : 'normal';
    const img = loadImage(p.character.portraits[expression]);
    const x = side === 0 ? 14 : W - 14 - 74;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.strokeStyle = pal.ink;
    g.lineWidth = 3;
    rr(g, x, 12, 74, 74, 14);
    g.fill();
    g.stroke();
    if (ready(img)) {
      g.save();
      rr(g, x, 12, 74, 74, 14);
      g.clip();
      drawFacing(g, img, x - 6, 10, 86, 86, side);
      g.restore();
    }
    const label = names?.[side] ? `${names[side]}（${p.character.name}）` : p.character.name;
    outlinedText(g, label, side === 0 ? x + 84 : x - 10, 30, 20, pal.text, side === 0 ? 'left' : 'right');
    outlinedText(g, String(match.score[side]), side === 0 ? x + 84 : x - 10, 64, 44, side === match.lastScorer && match.phase === 'point' ? pal.flash : pal.text, side === 0 ? 'left' : 'right');
  }
  outlinedText(g, `${match.target} 分勝`, W / 2, 26, 16, pal.text);

  if (match.phase === 'ready') {
    const server = match.players[match.server];
    outlinedText(g, `${server.character.name} 發球`, W / 2, 190, 40, pal.text);
  } else if (match.phase === 'point' && match.timer > 40) {
    outlinedText(g, '得分！', W / 2, 190, 64, pal.flash);
  }
}

// 圖素包的比分底板（800×200，左右兩格數字中心在 27.75%／73.25%）
function drawScoreboard(g, match, names, panel) {
  const pw = 330;
  const ph = pw * (panel.naturalHeight / panel.naturalWidth);
  const px = W / 2 - pw / 2;
  const py = 6;
  g.drawImage(panel, px, py, pw, ph);
  for (const side of [0, 1]) {
    const flash = side === match.lastScorer && match.phase === 'point';
    const cx = px + pw * (side === 0 ? cfg.scoreboard.left : cfg.scoreboard.right);
    outlinedText(g, String(match.score[side]).padStart(2, '0'), cx, py + ph * cfg.scoreboard.y, 40, flash ? pal.flash : pal.text);
  }
  outlinedText(g, `${match.target} 分勝`, W / 2, py + ph + 10, 14, pal.text);

  // 兩邊角落：頭像＋名字
  for (const side of [0, 1]) {
    const p = match.players[side];
    const m = mood[side];
    const img = loadImage(p.character.portraits[m.timer > 0 ? m.expression : 'normal']);
    const size = 70;
    const x = side === 0 ? 16 : W - 16 - size;
    const y = 10;
    g.save();
    rr(g, x, y, size, size, 8);
    g.fillStyle = pal.portrait;
    g.fill();
    g.clip();
    if (ready(img)) drawFacing(g, img, x - 8, y - 2, size + 16, size + 16, side);
    g.restore();
    g.lineWidth = 3.5;
    g.strokeStyle = pal.ink;
    rr(g, x, y, size, size, 8);
    g.stroke();
    g.lineWidth = 1.5;
    g.strokeStyle = pal.flash;
    rr(g, x + 3, y + 3, size - 6, size - 6, 6);
    g.stroke();
    const label = names?.[side] ? `${names[side]}（${p.character.name}）` : p.character.name;
    outlinedText(g, label, side === 0 ? x + size + 10 : x - 10, y + size / 2, 19, pal.text, side === 0 ? 'left' : 'right');
  }

  if (match.phase === 'ready') {
    const server = match.players[match.server];
    outlinedText(g, `${server.character.name} 發球`, W / 2, 190, 40, pal.text);
  } else if (match.phase === 'point' && match.timer > 40) {
    outlinedText(g, '得分！', W / 2, 190, 64, pal.flash);
  }
}

function drawBubbles(g, match) {
  for (const b of bubbles) {
    const p = match.players[b.side];
    const alpha = Math.min(1, b.timer / 15, (b.max - b.timer) / 6);
    g.save();
    g.globalAlpha = alpha;
    g.font = '700 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    const tw = g.measureText(b.text).width;
    const w = tw + 28;
    const h = 40;
    let x = p.x - w / 2;
    x = Math.max(10, Math.min(W - w - 10, x));
    const y = Math.min(p.y - 200, GROUND - 240);
    g.fillStyle = pal.paper;
    g.strokeStyle = pal.ink;
    g.lineWidth = 3;
    rr(g, x, y, w, h, 14);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(p.x - 8, y + h - 1.5);
    g.lineTo(p.x, y + h + 14);
    g.lineTo(p.x + 8, y + h - 1.5);
    g.fill();
    g.stroke();
    g.fillStyle = pal.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(b.text, x + w / 2, y + h / 2 + 1);
    g.restore();
  }
}

// ---------- 主畫面 ----------

const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 190 + 40, y: 50 + (i % 3) * 45, s: 0.6 + (i % 3) * 0.25 }));
function drawClouds(g) {
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of clouds) {
    c.x += c.s * 0.15;
    if (c.x > W + 120) c.x = -120;
    for (const [dx, dy, r] of [[0, 0, 22], [24, -10, 26], [50, 0, 20], [24, 6, 22]]) {
      g.beginPath();
      g.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// 連線時在自己的角色頭上標「你」
function drawYouMarker(g, p) {
  const y = p.y - 168 + Math.sin(p.anim * 0.1) * 3;
  g.fillStyle = pal.accent;
  g.strokeStyle = pal.ink;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(p.x - 9, y);
  g.lineTo(p.x + 9, y);
  g.lineTo(p.x, y + 12);
  g.closePath();
  g.fill();
  g.stroke();
  outlinedText(g, '你', p.x, y - 13, 18, pal.text);
}

// opts：{ you: 自己的座位（連線時）, names: 兩邊玩家名稱（連線時） }
export function draw(canvas, match, opts = {}) {
  cfg = currentConfig();
  updatePalette();
  // 換風格時調整內部解析度與縮放方式（像素風格不要平滑）
  if (SCALE !== cfg.canvasScale || canvas.width !== Math.round(W * cfg.canvasScale)) {
    SCALE = cfg.canvasScale;
    resize(canvas);
    bgCanvas = null;
  }
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = !cfg.pixelated;
  g.setTransform(SCALE, 0, 0, SCALE, 0, 0);

  if (shake > 0) {
    g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
  }

  const court = art('court');
  if (ready(court)) {
    g.drawImage(court, 0, 0, W, H);
  } else {
    bgCanvas ??= buildBackground();
    g.drawImage(bgCanvas, 0, 0, W, H);
    // 雲要動，畫在背景之後、山的前面看起來也還好
    drawClouds(g);
  }
  drawNet(g);

  if (!match) return;

  for (const p of match.players) drawPlayer(g, match, p);
  drawBall(g, match.ball);

  for (const fx of effects) {
    const img = art(fx.key);
    if (!ready(img)) continue;
    const t = 1 - fx.life / fx.max;
    const w = fx.w * (1 + fx.grow * t);
    const h = w * (img.naturalHeight / img.naturalWidth);
    g.save();
    g.globalAlpha = fx.alpha * Math.min(1, (fx.life / fx.max) * 1.6);
    g.translate(fx.x, fx.y);
    g.rotate(fx.rot);
    if (fx.flip) g.scale(-1, 1);
    g.drawImage(img, -w / 2, -h / 2, w, h);
    g.restore();
  }
  for (const pt of particles) {
    g.globalAlpha = pt.life / pt.max;
    g.fillStyle = pt.color;
    g.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  g.globalAlpha = 1;

  if (opts.you != null && match.phase !== 'over') drawYouMarker(g, match.players[opts.you]);
  drawBubbles(g, match);
  drawHud(g, match, opts.names);
}

// 跟模擬同步，每個影格呼叫一次
export function tick() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += pt.gravity;
    if (--pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = effects.length - 1; i >= 0; i--) if (--effects[i].life <= 0) effects.splice(i, 1);
  for (let i = bubbles.length - 1; i >= 0; i--) if (--bubbles[i].timer <= 0) bubbles.splice(i, 1);
  for (const m of mood) if (m.timer > 0) m.timer--;
}

export function resize(canvas) {
  canvas.width = Math.round(W * SCALE);
  canvas.height = Math.round(H * SCALE);
  canvas.style.imageRendering = cfg.pixelated ? 'pixelated' : 'auto';
}
