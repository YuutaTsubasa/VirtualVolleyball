// 電腦玩家：預測球的落點、跑過去、時機對了就跳起來扣殺。
// 輸出跟鍵盤一樣的輸入物件，所以比賽模擬不用分辨誰是電腦。

import { stepBall, hitCircle, GROUND, NET, START_X, BALL_R } from './game.js';

export const DIFFICULTIES = {
  easy: { label: '簡單', error: 110, reaction: 18, spike: 0.25, dive: 0.15, jumpTiming: 0.5 },
  normal: { label: '普通', error: 60, reaction: 9, spike: 0.6, dive: 0.45, jumpTiming: 0.8 },
  hard: { label: '困難', error: 24, reaction: 3, spike: 0.95, dive: 0.85, jumpTiming: 1 },
};

const HIT_HEIGHT = GROUND - 70;

// 模擬球往後飛，回傳第一次降到 y 高度時的位置與所需影格
function predict(ball, y, maxFrames = 240) {
  const b = { ...ball, trail: null };
  for (let t = 1; t <= maxFrames; t++) {
    stepBall(b);
    if (b.vy > 0 && b.y >= y) return { x: b.x, frames: t };
  }
  return { x: b.x, frames: maxFrames };
}

export function createAI(side, level = 'normal') {
  const cfg = DIFFICULTIES[level] ?? DIFFICULTIES.normal;
  let wobble = 0;
  let thinkTimer = 0;
  let plan = { x: START_X[side] };
  let hitHeld = false;

  const ownSide = (x) => (side === 0 ? x < NET.x : x > NET.x);

  return function think(match) {
    const me = match.players[side];
    const ball = match.ball;
    const input = { left: false, right: false, up: false, down: false, hit: false, hitPressed: false };
    if (match.phase !== 'rally') {
      hitHeld = false;
      return input;
    }

    // 反應速度：每隔幾個影格才重新判斷一次
    if (--thinkTimer <= 0) {
      thinkTimer = cfg.reaction;
      wobble = (Math.random() * 2 - 1) * cfg.error;
      const landing = predict(ball, HIT_HEIGHT);
      if (ownSide(landing.x)) {
        // 站在球的後方一點，讓球往對面彈；離網越遠站得越後面，球才送得過去
        const back = 20 + Math.abs(landing.x - NET.x) * 0.045;
        plan = { x: landing.x - me.toward * back + wobble, frames: landing.frames, landing: landing.x };
      } else {
        plan = { x: START_X[side] + me.toward * 40 + wobble * 0.5 };
      }
    }

    const dx = plan.x - me.x;
    if (Math.abs(dx) > 6) {
      if (dx > 0) input.right = true;
      else input.left = true;
    }

    const c = hitCircle(me);
    const bdx = ball.x - me.x;
    const ballComing = ownSide(ball.x) || Math.sign(ball.vx) === -me.toward;

    // 來不及跑到落點時飛撲
    if (me.onGround && plan.landing !== undefined && plan.frames < 22 && ownSide(plan.landing)) {
      const need = Math.abs(plan.landing - me.x);
      if (need > 80 && need < 260 && Math.random() < cfg.dive * 0.25) {
        input.hitPressed = true;
        if (plan.landing > me.x) input.right = true;
        else input.left = true;
        return input;
      }
    }

    // 起跳：球在頭上、正在落下、高度剛好
    const nearNet = Math.abs(me.x - NET.x) < 230;
    if (
      me.onGround && ballComing && ball.vy > -2 && Math.abs(bdx) < 45 &&
      ball.y > GROUND - 330 && ball.y < GROUND - 170 && nearNet &&
      Math.random() < cfg.jumpTiming * 0.35
    ) {
      input.up = true;
    }

    // 空中而且球就在旁邊：扣殺
    if (!me.onGround) {
      const dist = Math.hypot(ball.x - c.x, ball.y - c.y);
      if (dist < c.r + BALL_R + 40 && ball.y < c.y + 10) {
        if (!hitHeld && Math.random() < cfg.spike) {
          input.hitPressed = true;
          input.hit = true;
          // 靠網就往下重扣；離網遠的話重扣會掛網，改打平球或高吊
          const r = Math.random();
          if (Math.abs(me.x - NET.x) < 130) input.down = r < 0.75;
          else if (r < 0.3) input.up = true;
          if (Math.random() < 0.5) {
            input.left = me.toward < 0;
            input.right = me.toward > 0;
          }
        }
        hitHeld = true;
      }
    } else {
      hitHeld = false;
    }

    return input;
  };
}
