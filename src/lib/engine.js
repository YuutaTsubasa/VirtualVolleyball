// 遊戲主迴圈：固定 60 fps 讀輸入、推進比賽，每個畫面影格繪圖。
// 比賽本身在 Rust（crates/volleyball-core）：
//   單機 → 瀏覽器裡的 WebAssembly（crates/volleyball-wasm）
//   連線 → 伺服器每個影格送來狀態，這裡只送輸入、負責畫
// 兩邊的狀態格式一樣，所以畫面只有一套。跟 Svelte 無關，UI 透過回傳的方法控制它。

import init, { LocalMatch } from './local/pkg/volleyball_wasm.js';
import * as input from './game/input.js';
import * as render from './game/render.js';
import { play } from './game/audio.js';
import { CHARACTERS, getCharacter } from './game/characters.js';
import { net, onFrame, sendInput } from './net.svelte.js';

const FRAME = 1000 / 60;
const CELEBRATE_FRAMES = 120; // 比賽結束後先慶祝一下才跳結果畫面

const wasmReady = init();

// 引擎送來的 JSON → 畫面用的物件（角色 id 換成角色資料、補上球的殘影）
function hydrate(state, prev) {
  state.players.forEach((p) => (p.character = getCharacter(p.character)));
  const trail = prev?.ball.trail ?? [];
  trail.unshift({ x: state.ball.x, y: state.ball.y });
  if (trail.length > 8) trail.pop();
  state.ball.trail = trail;
  return state;
}

export function createEngine(canvas, { onMatchEnd, onMatchStart = () => {} }) {
  render.resize(canvas);
  render.preload(CHARACTERS);

  // idle：在選單（選單蓋住整個畫面，不跑比賽也不出聲）
  let state = 'idle'; // idle | local | paused | ended | online
  let local = null; // { game: LocalMatch, humans: [slot 或 null] }
  let match = null;
  let celebrate = 0;
  let hitSeq = 0;
  let ready = false;
  wasmReady.then(() => (ready = true));

  function newLocal(characters, target, sides) {
    const game = new LocalMatch(characters[0].id, characters[1].id, target);
    sides.forEach((s, i) => s.ai && game.setAi(i, s.ai));
    return game;
  }

  function advance(m) {
    for (const e of m.events) play(e.type);
    render.handleEvents(m);
    render.tick();
  }

  // 收到伺服器的影格
  onFrame((s) => {
    if (state !== 'online') return;
    // 房主按了「再來一場」：影格編號重新開始
    if (match && s.frame < match.frame) {
      celebrate = 0;
      render.resetEffects();
      onMatchStart();
    }
    match = hydrate(s, match);
    advance(match);
    if (match.phase === 'over') {
      if (++celebrate === CELEBRATE_FRAMES) onMatchEnd(match);
    } else {
      celebrate = 0;
    }
  });

  function simulate() {
    if (!ready) return;
    if (state === 'local' || state === 'ended') {
      const bits = local.humans.map((h) => (h && state === 'local' ? input.toBits(h()) : 0));
      local.game.step(bits[0], bits[1]);
      match = hydrate(JSON.parse(local.game.state()), match);
      if (state === 'ended') {
        render.tick();
        return;
      }
      advance(match);
      if (match.phase === 'over' && ++celebrate === CELEBRATE_FRAMES) {
        state = 'ended';
        onMatchEnd(match);
      }
    } else if (state === 'online') {
      // 只送自己的輸入，比賽在伺服器上跑
      if (net.seat != null) {
        // 自己一個人操作：兩組鍵盤、所有手把、觸控按鈕都算
        const i = input.read(0, { keymaps: [0, 1], pads: 'all', touch: 0 });
        if (i.hitPressed) hitSeq++;
        sendInput(input.toBits({ ...i, hitPressed: false }), hitSeq);
      }
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
    // 選單蓋住整個畫面時不用畫
    if (state !== 'idle') draw();
    raf = requestAnimationFrame(loop);
  }
  function draw() {
    const online = state === 'online';
    render.draw(canvas, match, {
      you: online ? net.seat : null,
      names: online ? net.room?.seats.map((s) => s?.name) : null,
    });
  }
  raf = requestAnimationFrame(loop);

  return {
    // 單機：mode = cpu（1P 對電腦）| versus（同一台雙人）| watch（電腦對電腦）
    async startLocal({ mode, characters, target, difficulty }) {
      await wasmReady;
      let sides;
      let humans;
      if (mode === 'cpu') {
        // 單人時 1P 用 WASD 或方向鍵、任何一支手把都可以
        sides = [{}, { ai: difficulty }];
        humans = [() => input.read(0, { keymaps: [0, 1], pads: 'all', touch: 0 }), null];
      } else if (mode === 'versus') {
        sides = [{}, {}];
        // 第一支手把給 1P、第二支給 2P；只有一支手把時，另一人用鍵盤
        humans = [() => input.read(0, { pads: [0] }), () => input.read(1, { pads: [1] })];
      } else {
        sides = [{ ai: difficulty }, { ai: difficulty }];
        humans = [null, null];
      }
      local?.game.free();
      local = { game: newLocal(characters, target, sides), humans };
      match = null;
      celebrate = 0;
      render.resetEffects();
      state = 'local';
    },
    // 連線：畫伺服器送來的比賽
    startOnline() {
      if (state === 'online') return;
      match = null;
      celebrate = 0;
      render.resetEffects();
      state = 'online';
    },
    pause() {
      if (state === 'local') state = 'paused';
    },
    resume() {
      if (state === 'paused') state = 'local';
    },
    // 回到選單：停掉比賽（不再出聲）
    stop() {
      local?.game.free();
      local = null;
      match = null;
      render.resetEffects();
      state = 'idle';
    },
    destroy() {
      cancelAnimationFrame(raf);
    },
    // 給除錯用
    get match() {
      return match;
    },
  };
}
