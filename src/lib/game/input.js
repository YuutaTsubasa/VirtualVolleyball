// 鍵盤＋手把輸入。每個影格呼叫 read(slot) 取得該玩家的輸入。

const KEYMAPS = [
  // 1P：WASD 移動跳躍，F / 空白鍵 擊球
  { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], hit: ['KeyF', 'Space'] },
  // 2P：方向鍵，Enter / 右 Shift 擊球
  { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], hit: ['Enter', 'NumpadEnter', 'ShiftRight', 'Numpad0'] },
];

const held = new Set();
const pressedThisFrame = new Set();

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  held.add(e.code);
  pressedThisFrame.add(e.code);
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
});
window.addEventListener('keyup', (e) => held.delete(e.code));
window.addEventListener('blur', () => held.clear());

const padHitPrev = [false, false];

function readPad(index) {
  const pad = navigator.getGamepads?.()[index];
  if (!pad) return null;
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  const btn = (i) => !!pad.buttons[i]?.pressed;
  const hit = btn(1) || btn(2) || btn(5);
  const result = {
    left: ax < -0.4 || btn(14),
    right: ax > 0.4 || btn(15),
    up: btn(0) || btn(12) || ay < -0.6,
    down: ay > 0.5 || btn(13),
    hit,
    hitPressed: hit && !padHitPrev[index],
  };
  padHitPrev[index] = hit;
  return result;
}

// slots：這個玩家要讀哪幾組鍵盤（1P 單人模式可以兩組都用）
export function read(slot, { keymaps = [slot], pad = slot } = {}) {
  const any = (codes) => codes.some((c) => held.has(c));
  const anyPressed = (codes) => codes.some((c) => pressedThisFrame.has(c));
  const input = { left: false, right: false, up: false, down: false, hit: false, hitPressed: false };
  for (const k of keymaps) {
    const map = KEYMAPS[k];
    input.left ||= any(map.left);
    input.right ||= any(map.right);
    input.up ||= any(map.up);
    input.down ||= any(map.down);
    input.hit ||= any(map.hit);
    input.hitPressed ||= anyPressed(map.hit);
  }
  const p = readPad(pad);
  if (p) for (const key of Object.keys(input)) input[key] ||= p[key];
  return input;
}

// 一個影格結束後清掉「剛按下」的紀錄
export function endFrame() {
  pressedThisFrame.clear();
}

export function wasPressed(...codes) {
  return codes.some((c) => pressedThisFrame.has(c));
}
