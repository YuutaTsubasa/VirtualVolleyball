// 比賽模擬：只管物理與規則，不碰畫面與聲音。
// 每次 step() 前進固定 1/60 秒，同樣的輸入一定得到同樣的結果（之後要做連線對戰也能直接沿用）。

export const W = 960;
export const H = 540;
export const GROUND = 470;
export const NET = { x: W / 2, w: 14, top: 290 };

export const BALL_R = 24;
const BALL_G = 0.32;
const BALL_MAX_SPEED = 26;
const NET_BOUNCE = 0.85;

const PLAYER_G = 0.85;
export const PLAYER_HALF_W = 34;
const HIT_COOLDOWN = 10;
const SPIKE_WINDOW = 14;
const DIVE_FRAMES = 20;
const RECOVER_FRAMES = 16;

const READY_FRAMES = 50;
const POINT_FRAMES = 90;

export const START_X = [160, W - 160];

// 角色能力值（1–5）換成實際數值
export function statsFor(character) {
  const { speed, jump, power } = character.stats;
  return {
    speed: 5.4 + speed * 0.45,
    jump: 15.4 + jump * 0.65,
    power: 0.86 + power * 0.06,
  };
}

// 玩家的擊球判定圓（站著跟飛撲時不一樣）
export function hitCircle(p) {
  return p.state === 'dive'
    ? { x: p.x, y: p.y - 32, r: 44 }
    : { x: p.x, y: p.y - 62, r: 50 };
}

function createPlayer(side, character) {
  return {
    side,
    character,
    stats: statsFor(character),
    toward: side === 0 ? 1 : -1, // 對手場地的方向
    x: START_X[side],
    y: GROUND,
    vx: 0,
    vy: 0,
    onGround: true,
    state: 'normal', // normal | dive | recover
    timer: 0,
    spikeTimer: 0,
    hitCooldown: 0,
    anim: 0, // 給畫面用的計時
    lastHit: 99, // 上一次擊球後經過的影格（畫揮手動作用）
  };
}

export function createMatch({ characters, target = 15 }) {
  const match = {
    target,
    players: [createPlayer(0, characters[0]), createPlayer(1, characters[1])],
    ball: { x: 0, y: 0, vx: 0, vy: 0, spin: 0, angle: 0, power: false, trail: [] },
    score: [0, 0],
    server: 0,
    phase: 'ready', // ready | rally | point | over
    timer: READY_FRAMES,
    lastScorer: null,
    winner: null,
    frame: 0,
    events: [],
  };
  resetRally(match);
  return match;
}

function resetRally(match) {
  for (const p of match.players) {
    Object.assign(p, {
      x: START_X[p.side], y: GROUND, vx: 0, vy: 0, onGround: true,
      state: 'normal', timer: 0, spikeTimer: 0, hitCooldown: 0, lastHit: 99,
    });
  }
  const b = match.ball;
  Object.assign(b, { x: START_X[match.server], y: 140, vx: 0, vy: 0, spin: 0, power: false });
  b.trail.length = 0;
  match.phase = 'ready';
  match.timer = READY_FRAMES;
}

const NO_INPUT = { left: false, right: false, up: false, down: false, hit: false, hitPressed: false };

export function step(match, inputs) {
  match.events.length = 0;
  match.frame++;

  if (match.phase === 'over') {
    for (const p of match.players) updatePlayer(match, p, NO_INPUT);
    return;
  }

  if (match.phase === 'ready') {
    if (--match.timer <= 0) {
      match.phase = 'rally';
      match.events.push({ type: 'whistle' });
    }
    return;
  }

  match.players.forEach((p, i) => updatePlayer(match, p, inputs[i] ?? NO_INPUT));

  if (match.phase === 'rally') {
    // 分兩小步走，快球也不會穿過球網或人
    for (let sub = 0; sub < 2; sub++) {
      stepBall(match.ball, 0.5, match.events);
      match.players.forEach((p, i) => collidePlayerBall(match, p, inputs[i] ?? NO_INPUT));
      if (match.ball.y + BALL_R >= GROUND) {
        landBall(match);
        break;
      }
    }
  } else if (match.phase === 'point') {
    // 球落地後慢慢彈一下，讓大家看清楚
    const b = match.ball;
    b.vy += BALL_G;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.96;
    if (b.y + BALL_R >= GROUND) {
      b.y = GROUND - BALL_R;
      b.vy = -Math.abs(b.vy) * 0.35;
    }
    if (--match.timer <= 0) finishPoint(match);
  }

  const b = match.ball;
  b.angle += b.spin;
  b.trail.unshift({ x: b.x, y: b.y });
  if (b.trail.length > 8) b.trail.pop();
}

function updatePlayer(match, p, input) {
  p.anim++;
  p.lastHit++;
  if (p.hitCooldown > 0) p.hitCooldown--;
  if (p.spikeTimer > 0) p.spikeTimer--;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const frozen = match.phase === 'over';

  if (p.state === 'dive') {
    if (--p.timer <= 0 && p.onGround) {
      p.state = 'recover';
      p.timer = RECOVER_FRAMES;
    }
  } else if (p.state === 'recover') {
    p.vx = 0;
    if (--p.timer <= 0) p.state = 'normal';
  } else if (!frozen) {
    p.vx = dir * p.stats.speed;
    if (p.onGround && input.hitPressed && dir !== 0 && !input.up) {
      // 飛撲救球
      p.state = 'dive';
      p.timer = DIVE_FRAMES;
      p.vx = dir * p.stats.speed * 2;
      p.vy = -5;
      p.onGround = false;
      match.events.push({ type: 'dive', side: p.side });
    } else if (p.onGround && input.up) {
      p.vy = -p.stats.jump;
      p.onGround = false;
      match.events.push({ type: 'jump', side: p.side });
    } else if (!p.onGround && input.hitPressed) {
      p.spikeTimer = SPIKE_WINDOW;
      p.lastHit = 0;
    }
  } else {
    p.vx = 0;
  }

  p.vy += PLAYER_G;
  p.x += p.vx;
  p.y += p.vy;
  if (p.y >= GROUND) {
    if (!p.onGround) match.events.push({ type: 'land', side: p.side, x: p.x });
    p.y = GROUND;
    p.vy = 0;
    p.onGround = true;
    if (p.state === 'dive') p.vx *= 0.8;
  }

  const minX = p.side === 0 ? PLAYER_HALF_W : NET.x + NET.w / 2 + PLAYER_HALF_W;
  const maxX = p.side === 0 ? NET.x - NET.w / 2 - PLAYER_HALF_W : W - PLAYER_HALF_W;
  p.x = Math.max(minX, Math.min(maxX, p.x));
}

// 球的運動（AI 預測落點也用這個），dt = 1 是一整個影格
export function stepBall(b, dt = 1, events = null) {
  b.vy += BALL_G * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if (b.x < BALL_R) {
    b.x = BALL_R;
    b.vx = Math.abs(b.vx);
    events?.push({ type: 'wall' });
  } else if (b.x > W - BALL_R) {
    b.x = W - BALL_R;
    b.vx = -Math.abs(b.vx);
    events?.push({ type: 'wall' });
  }

  // 球網：圓與長方形碰撞，往法線方向反彈
  const left = NET.x - NET.w / 2;
  const right = NET.x + NET.w / 2;
  const cx = Math.max(left, Math.min(right, b.x));
  const cy = Math.max(NET.top, Math.min(GROUND, b.y));
  let dx = b.x - cx;
  let dy = b.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 < BALL_R * BALL_R) {
    let d = Math.sqrt(d2);
    if (d === 0) {
      dx = b.vx > 0 ? -1 : 1;
      dy = 0;
      d = 1;
    }
    const nx = dx / d;
    const ny = dy / d;
    b.x = cx + nx * BALL_R;
    b.y = cy + ny * BALL_R;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + NET_BOUNCE) * vn * nx;
      b.vy -= (1 + NET_BOUNCE) * vn * ny;
      b.power = false;
      // 落在網子正上方時往旁邊滑，免得球停在網上
      if (ny < -0.7 && Math.abs(b.vx) < 1.5) b.vx += b.x >= NET.x ? 1.5 : -1.5;
      events?.push({ type: 'net' });
    }
  }
}

function collidePlayerBall(match, p, input) {
  if (p.hitCooldown > 0) return;
  const b = match.ball;
  const c = hitCircle(p);
  const dx = b.x - c.x;
  const dy = b.y - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= c.r + BALL_R) return;

  p.hitCooldown = HIT_COOLDOWN;
  p.lastHit = 0;

  if (!p.onGround && p.spikeTimer > 0 && p.state === 'normal') {
    // 扣殺：方向鍵決定球路（上＝高吊、下＝重扣、往前＝更快）
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const forward = dir === p.toward ? 1 : dir === -p.toward ? -1 : 0;
    b.vx = p.toward * (15 + forward * 5) * p.stats.power;
    b.vy = (input.up ? -9 : input.down ? 13 : 3) * p.stats.power;
    b.power = true;
    p.spikeTimer = 0;
    match.events.push({ type: 'spike', side: p.side, x: b.x, y: b.y });
  } else {
    b.vx = Math.max(-9, Math.min(9, dx * 0.15)) + p.vx * 0.15;
    // 正上方接球時稍微往對面送，避免永遠垂直彈
    if (Math.abs(b.vx) < 0.6) b.vx = p.toward * 0.8;
    b.vy = p.state === 'dive' ? -13 : -Math.max(12, Math.min(15, Math.abs(b.vy)));
    b.power = false;
    match.events.push({ type: 'hit', side: p.side, x: b.x, y: b.y });
  }

  const speed = Math.hypot(b.vx, b.vy);
  if (speed > BALL_MAX_SPEED) {
    b.vx *= BALL_MAX_SPEED / speed;
    b.vy *= BALL_MAX_SPEED / speed;
  }
  b.spin = b.vx * 0.02;

  // 把球推出判定圓外
  const nx = dist === 0 ? 0 : dx / dist;
  const ny = dist === 0 ? -1 : dy / dist;
  b.x = c.x + nx * (c.r + BALL_R + 1);
  b.y = c.y + ny * (c.r + BALL_R + 1);
}

function landBall(match) {
  const b = match.ball;
  b.y = GROUND - BALL_R;
  const scorer = b.x < NET.x ? 1 : 0;
  match.lastScorer = scorer;
  match.phase = 'point';
  match.timer = POINT_FRAMES;
  b.vy = -Math.abs(b.vy) * 0.45;
  b.vx *= 0.5;
  b.power = false;
  match.score[scorer]++;
  match.events.push({ type: 'ground', x: b.x }, { type: 'score', side: scorer });
}

function finishPoint(match) {
  const scorer = match.lastScorer;
  if (match.score[scorer] >= match.target) {
    match.phase = 'over';
    match.winner = scorer;
    match.events.push({ type: 'over', side: scorer });
    return;
  }
  match.server = scorer;
  resetRally(match);
}
