// 畫面：背景、角色、球、特效、計分板。只讀取比賽狀態，不改它。

import { W, H, GROUND, NET, BALL_R, PLAYER_HALF_W } from './game.js';
import { EXPRESSIONS, pickLine } from './characters.js';

const SCALE = 2; // 內部解析度 1920×1080，縮放顯示時比較銳利

// 有自己的背景圖（例如 ChatGPT 畫的）就放到 public/bg/court.png，把這裡改成 true
const USE_BACKGROUND_IMAGE = false;

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
  const key = `${character.id}:${expression}`;
  if (heads.has(key)) return heads.get(key);
  const img = loadImage(character.portraits[expression] ?? character.portraits.normal);
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
  if (USE_BACKGROUND_IMAGE) loadImage(`${import.meta.env.BASE_URL}bg/court.png`);
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

  // 球網
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

  return c;
}

// ---------- 特效 ----------

const particles = [];
const bubbles = [];
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
  bubbles.length = 0;
  shake = 0;
  setMood(0, 'normal', 0);
  setMood(1, 'normal', 0);
}

// 依比賽事件產生特效與台詞
export function handleEvents(match) {
  for (const e of match.events) {
    switch (e.type) {
      case 'spike':
        burst(e.x, e.y, '#fff3a0', 14, 7, 20, 0);
        shake = Math.max(shake, 6);
        break;
      case 'hit':
        burst(e.x, e.y, '#ffffff', 6, 3, 14, 0);
        break;
      case 'ground':
        burst(e.x, GROUND - 4, '#e4c27a', 24, 5, 40);
        shake = Math.max(shake, 10);
        break;
      case 'land':
      case 'dive':
        burst(e.x ?? match.players[e.side].x, GROUND - 2, '#ecd08f', 6, 2, 22);
        break;
      case 'score': {
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
  const facing = p.vx !== 0 && p.state === 'normal' ? Math.sign(p.vx) : p.toward;

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

// 有 ChatGPT 畫好的 sprite sheet 時（規格見 docs/art-guide.md）
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
  const drawH = 150;
  const drawW = drawH * (fw / fh);
  const facing = p.state === 'normal' && p.vx !== 0 ? Math.sign(p.vx) : p.toward;
  g.save();
  g.translate(p.x, p.y);
  if (facing < 0) g.scale(-1, 1);
  g.drawImage(img, i * fw, 0, fw, fh, -drawW / 2, -drawH, drawW, drawH);
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
  if (b.power) {
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

function outlinedText(g, text, x, y, size, fill = '#fff', align = 'center') {
  g.font = `900 ${size}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size / 5;
  g.strokeStyle = 'rgba(30,20,40,0.9)';
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

function drawHud(g, match) {
  for (const side of [0, 1]) {
    const p = match.players[side];
    const m = mood[side];
    const expression = m.timer > 0 ? m.expression : 'normal';
    const img = loadImage(p.character.portraits[expression]);
    const x = side === 0 ? 14 : W - 14 - 74;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.strokeStyle = 'rgba(30,20,40,0.9)';
    g.lineWidth = 3;
    rr(g, x, 12, 74, 74, 14);
    g.fill();
    g.stroke();
    if (ready(img)) {
      g.save();
      rr(g, x, 12, 74, 74, 14);
      g.clip();
      g.drawImage(img, x - 6, 10, 86, 86);
      g.restore();
    }
    outlinedText(g, p.character.name, side === 0 ? x + 84 : x - 10, 30, 20, '#fff', side === 0 ? 'left' : 'right');
    outlinedText(g, String(match.score[side]), side === 0 ? x + 84 : x - 10, 64, 44, side === match.lastScorer && match.phase === 'point' ? '#ffe066' : '#fff', side === 0 ? 'left' : 'right');
  }
  outlinedText(g, `${match.target} 分勝`, W / 2, 26, 16, '#fff');

  if (match.phase === 'ready') {
    const server = match.players[match.server];
    outlinedText(g, `${server.character.name} 發球`, W / 2, 190, 40, '#fff');
  } else if (match.phase === 'point' && match.timer > 40) {
    outlinedText(g, '得分！', W / 2, 190, 64, '#ffe066');
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
    g.fillStyle = '#ffffff';
    g.strokeStyle = 'rgba(30,20,40,0.9)';
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
    g.fillStyle = '#2b2233';
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

export function draw(canvas, match) {
  const g = canvas.getContext('2d');
  g.setTransform(SCALE, 0, 0, SCALE, 0, 0);

  if (shake > 0) {
    g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
  }

  const bgImg = USE_BACKGROUND_IMAGE ? loadImage(`${import.meta.env.BASE_URL}bg/court.png`) : null;
  if (ready(bgImg)) {
    g.drawImage(bgImg, 0, 0, W, H);
  } else {
    bgCanvas ??= buildBackground();
    g.drawImage(bgCanvas, 0, 0, W, H);
    // 雲要動，畫在背景之後、山的前面看起來也還好
    drawClouds(g);
  }

  if (!match) return;

  for (const p of match.players) drawPlayer(g, match, p);
  drawBall(g, match.ball);

  for (const pt of particles) {
    g.globalAlpha = pt.life / pt.max;
    g.fillStyle = pt.color;
    g.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  g.globalAlpha = 1;

  drawBubbles(g, match);
  drawHud(g, match);
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
  for (let i = bubbles.length - 1; i >= 0; i--) if (--bubbles[i].timer <= 0) bubbles.splice(i, 1);
  for (const m of mood) if (m.timer > 0) m.timer--;
}

export function resize(canvas) {
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
}
