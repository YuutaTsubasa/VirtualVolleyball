// 遊戲主迴圈：固定 60 fps 模擬 + 每個畫面影格繪圖。
// 跟 Svelte 無關，UI 只透過 startMatch / pause / resume / stop 控制它。

import { createMatch, step } from './game/game.js';
import { createAI } from './game/ai.js';
import * as input from './game/input.js';
import * as render from './game/render.js';
import { play } from './game/audio.js';
import { CHARACTERS } from './game/characters.js';

const FRAME = 1000 / 60;
const CELEBRATE_FRAMES = 120; // 比賽結束後先慶祝一下才跳結果畫面

export function createEngine(canvas, { onMatchEnd }) {
  render.resize(canvas);
  render.preload(CHARACTERS);

  let state = 'demo'; // demo | play | paused | ended
  let match = null;
  let controllers = [null, null];
  let celebrate = 0;
  let demo = null;
  let demoAI = null;

  function startDemo() {
    const pool = CHARACTERS.filter((c) => !c.hidden);
    const a = pool[Math.floor(Math.random() * pool.length)];
    let b = pool[Math.floor(Math.random() * pool.length)];
    if (b === a) b = pool[(pool.indexOf(a) + 3) % pool.length];
    demo = createMatch({ characters: [a, b], target: 99 });
    demoAI = [createAI(0, 'hard'), createAI(1, 'hard')];
    render.resetEffects();
  }

  function simulate() {
    if (state === 'play') {
      step(match, controllers.map((c) => c(match)));
      for (const e of match.events) play(e.type);
      render.handleEvents(match);
      render.tick();
      if (match.phase === 'over' && ++celebrate === CELEBRATE_FRAMES) {
        state = 'ended';
        onMatchEnd(match);
      }
    } else if (state === 'ended') {
      // 結果畫面背後讓角色把動作做完
      step(match, [null, null]);
      render.tick();
    } else if (state === 'demo') {
      if (!demo || demo.phase === 'over') startDemo();
      step(demo, demoAI.map((ai) => ai(demo)));
      render.handleEvents(demo);
      render.tick();
    }
  }

  let last = performance.now();
  let acc = 0;
  let raf = 0;
  function loop(now) {
    acc += Math.min(100, now - last);
    last = now;
    let steps = 0;
    while (acc >= FRAME) {
      simulate();
      acc -= FRAME;
      steps++;
    }
    // 沒跑模擬的影格（高更新率螢幕）不要清掉「剛按下」，否則會吃掉按鍵
    if (steps > 0) input.endFrame();
    render.draw(canvas, state === 'demo' ? demo : match);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    // setup：{ mode: 'cpu' | 'versus' | 'watch', characters, target, difficulty }
    startMatch({ mode, characters, target, difficulty }) {
      match = createMatch({ characters, target });
      if (mode === 'cpu') {
        // 單人時 1P 用 WASD 或方向鍵都可以
        controllers = [() => input.read(0, { keymaps: [0, 1], pad: 0 }), createAI(1, difficulty)];
      } else if (mode === 'versus') {
        controllers = [() => input.read(0), () => input.read(1)];
      } else {
        controllers = [createAI(0, difficulty), createAI(1, difficulty)];
      }
      celebrate = 0;
      render.resetEffects();
      state = 'play';
    },
    pause() {
      if (state === 'play') state = 'paused';
    },
    resume() {
      if (state === 'paused') state = 'play';
    },
    // 回到標題的示範賽
    stop() {
      match = null;
      demo = null;
      state = 'demo';
    },
    destroy() {
      cancelAnimationFrame(raf);
    },
    // 給除錯用
    get match() {
      return state === 'demo' ? demo : match;
    },
  };
}
