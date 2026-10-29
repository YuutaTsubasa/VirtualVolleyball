// 比賽中的輸入：鍵盤、手把、觸控按鈕合在一起。每個影格呼叫 read(slot) 取得該玩家的輸入。
// （選單的操作在 src/lib/components/Controls.svelte）

import { padDpad } from 'virtual-core/input/controls.js';
const KEYMAPS = [
  // 1P：WASD 移動跳躍，F / 空白鍵 擊球
  { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], hit: ['KeyF', 'Space'] },
  // 2P：方向鍵，Enter / 右 Shift 擊球
  { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], hit: ['Enter', 'NumpadEnter', 'ShiftRight', 'Numpad0'] },
];

const held = new Set();
const pressedThisFrame = new Set();

const blank = () => ({ left: false, right: false, up: false, down: false, hit: false });
const touch = [blank(), blank()];
const touchPressed = [false, false];

function typing(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable]');
}

window.addEventListener('keydown', (e) => {
  if (e.repeat || typing(e.target)) return;
  held.add(e.code);
  pressedThisFrame.add(e.code);
});
window.addEventListener('keyup', (e) => held.delete(e.code));
window.addEventListener('blur', () => {
  held.clear();
  touch.forEach((t) => Object.assign(t, blank()));
});

// ---------- 手把（A 跳；A 以外的三顆按鈕和肩鍵、扳機都是擊球；十字鍵或左搖桿移動） ----------

const padHitPrev = new Map();

function standardPads() {
  let pads = [];
  try {
    pads = navigator.getGamepads?.() ?? [];
  } catch {
    // 某些瀏覽器在非安全環境會擋
  }
  // 沒有標準配置的手把也收（十字鍵另外處理，見 padDpad）
  return [...pads].filter((p) => p?.connected);
}

function readPad(pad) {
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  const btn = (i) => !!pad.buttons[i]?.pressed;
  // X 和 Y 都算擊球：有些掌機（例如 AYN 的 Android 機）內建手把照 Linux 的慣例送鍵，
  // 瀏覽器讀到的 X、Y 會對調，只收 X 的話按 X 會沒反應（只剩碰到球自動彈出去，扣殺不了）
  const hit = [1, 2, 3, 4, 5, 6, 7].some(btn);
  const dpad = padDpad(pad);
  const result = {
    left: ax < -0.4 || dpad.left,
    right: ax > 0.4 || dpad.right,
    up: btn(0) || dpad.up || ay < -0.6,
    down: ay > 0.5 || dpad.down,
    hit,
    hitPressed: hit && !padHitPrev.get(pad.index),
  };
  padHitPrev.set(pad.index, hit);
  return result;
}

// ---------- 觸控（TouchControls.svelte 呼叫） ----------

export function setTouch(slot, patch) {
  Object.assign(touch[slot], patch);
}
export function pressTouchHit(slot) {
  touchPressed[slot] = true;
}
export function clearTouch() {
  touch.forEach((t) => Object.assign(t, blank()));
}

/**
 * 讀一個玩家的輸入。
 * keymaps：要讀哪幾組鍵盤；pads：'all'（所有手把）或手把順序的陣列（第幾支手把，不是 index）；
 * touch：讀哪一組觸控按鈕。
 */
export function read(slot, { keymaps = [slot], pads = [slot], touch: touchSlot = slot } = {}) {
  const any = (codes) => codes.some((c) => held.has(c));
  const anyPressed = (codes) => codes.some((c) => pressedThisFrame.has(c));
  const input = { left: false, right: false, up: false, down: false, hit: false, hitPressed: false };
  const merge = (src) => {
    for (const key of Object.keys(input)) input[key] ||= !!src[key];
  };
  for (const k of keymaps) {
    const map = KEYMAPS[k];
    merge({
      left: any(map.left),
      right: any(map.right),
      up: any(map.up),
      down: any(map.down),
      hit: any(map.hit),
      hitPressed: anyPressed(map.hit),
    });
  }
  const connected = standardPads();
  const chosen = pads === 'all' ? connected : pads.map((i) => connected[i]).filter(Boolean);
  for (const pad of chosen) merge(readPad(pad));
  if (touchSlot != null) {
    merge(touch[touchSlot]);
    input.hitPressed ||= touchPressed[touchSlot];
  }
  return input;
}

// 一個模擬影格結束後清掉「剛按下」的紀錄
export function endFrame() {
  pressedThisFrame.clear();
  touchPressed[0] = touchPressed[1] = false;
}

// 轉成送給引擎的位元：1 左、2 右、4 上、8 下、16 擊球（按住）、32 擊球（剛按下）
export function toBits(i) {
  return (i.left ? 1 : 0) | (i.right ? 2 : 0) | (i.up ? 4 : 0) | (i.down ? 8 : 0) | (i.hit ? 16 : 0) | (i.hitPressed ? 32 : 0);
}
