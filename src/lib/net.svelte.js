// 與比賽伺服器的 WebSocket 連線（全域狀態），做法跟 TaiwanMahjong 的 net.svelte.js 一樣。
import { isTauri, invoke } from '@tauri-apps/api/core';

export const inTauri = isTauri();
export const DEFAULT_PORT = 7788;

export const net = $state({
  status: 'idle', // idle | connecting | open | reconnecting
  address: '',
  seat: null, // 0 左 / 1 右 / null 觀眾
  isHost: false,
  room: null, // 大廳資訊：{ phase, seats, host_seat, you, settings, chat }
  hostInfo: null, // 本機開房時：{ port, host_key, ips }
  toasts: [],
});

// 比賽影格不放進 $state（每秒 60 次，交給 engine 直接處理）
const frameListeners = new Set();
export function onFrame(fn) {
  frameListeners.add(fn);
  return () => frameListeners.delete(fn);
}

let ws = null;
let wantOpen = false;
let hello = null;
let retryTimer = null;
let toastId = 0;

const tokenKey = (addr) => `vb_token_${addr}`;
const hostKeyKey = (addr) => `vb_hostkey_${addr}`;

export function load(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function store(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // 無痕模式之類的存不了就算了
  }
}

export function toast(message, kind = 'error') {
  const id = ++toastId;
  net.toasts.push({ id, message, kind });
  setTimeout(() => {
    net.toasts = net.toasts.filter((t) => t.id !== id);
  }, 4000);
}

export function normalizeAddress(a) {
  a = (a || '').trim().replace(/^(https?|wss?):\/\//, '').replace(/\/.*$/, '');
  if (a && !a.includes(':') && !a.includes('.')) a = `localhost:${a}`;
  // https 頁面連的是 Cloudflare 之類的通道網址（wss 走 443），不要補通訊埠
  const tunnel = typeof location !== 'undefined' && location.protocol === 'https:' && !inTauri && /\.[a-z][a-z0-9-]*$/i.test(a);
  if (a && !tunnel && !/:\d+$/.test(a) && !a.endsWith(']')) a = `${a}:${DEFAULT_PORT}`;
  return a;
}

export function connect(address, { name, hostKey, spectate = false, character } = {}) {
  disconnect();
  address = normalizeAddress(address);
  if (!address) return;
  if (hostKey) store(hostKeyKey(address), hostKey);
  net.address = address;
  net.status = 'connecting';
  wantOpen = true;
  hello = {
    type: 'hello',
    name,
    host_key: hostKey || load(hostKeyKey(address)) || undefined,
    spectate,
    character,
  };
  open();
}

function open() {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' && !inTauri;
  let socket;
  try {
    socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${net.address}/ws`);
  } catch (e) {
    toast(`無法連線：${e}`);
    net.status = 'idle';
    return;
  }
  ws = socket;
  socket.onopen = () => {
    net.status = 'open';
    const token = hello.spectate ? undefined : load(tokenKey(net.address)) || undefined;
    socket.send(JSON.stringify({ ...hello, token }));
    lastInput = -1;
  };
  socket.onmessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    if (m.type === 'frame') {
      for (const fn of frameListeners) fn(m.state);
    } else if (m.type === 'room') {
      net.room = m.state;
      net.seat = m.state.you;
      net.isHost = !!m.state.is_host;
    } else if (m.type === 'welcome') {
      net.seat = m.seat;
      net.isHost = m.is_host;
      if (m.token) store(tokenKey(net.address), m.token);
    } else if (m.type === 'error') {
      toast(m.message);
    }
  };
  socket.onclose = () => {
    if (ws !== socket) return;
    ws = null;
    if (wantOpen) {
      net.status = net.room ? 'reconnecting' : 'connecting';
      retryTimer = setTimeout(open, 1500);
    } else {
      net.status = 'idle';
    }
  };
}

export function disconnect() {
  wantOpen = false;
  clearTimeout(retryTimer);
  if (ws) {
    const s = ws;
    ws = null;
    s.close();
  }
  net.room = null;
  net.seat = null;
  net.isHost = false;
  net.status = 'idle';
}

export function send(obj) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

// 輸入只在有變化時送（位元見 crates/volleyball-core/src/game.rs 的 Input::from_bits）
let lastInput = -1;
let lastSeq = -1;
export function sendInput(bits, seq) {
  if (bits === lastInput && seq === lastSeq) return;
  if (send({ type: 'input', b: bits, s: seq })) {
    lastInput = bits;
    lastSeq = seq;
  }
}

export function hostCmd(cmd, extra = {}) {
  send({ type: 'host', cmd, ...extra });
}

export function setCharacter(id) {
  store('vb_character', id);
  if (hello) hello.character = id;
  if (net.seat != null) send({ type: 'character', id });
}

/** 離開座位並回到首頁 */
export function leave() {
  send({ type: 'leave' });
  store(tokenKey(net.address), null);
  setTimeout(disconnect, 100);
}

export async function startHost(port, name, character) {
  const info = await invoke('start_host', { port: Number(port) || DEFAULT_PORT });
  net.hostInfo = info;
  connect(`localhost:${info.port}`, { name, hostKey: info.host_key, character });
  return info;
}

export async function stopHost() {
  disconnect();
  await invoke('stop_host');
  net.hostInfo = null;
}

export async function hostStatus() {
  if (!inTauri) return null;
  const info = await invoke('host_status');
  net.hostInfo = info;
  return info;
}

/** 給其他人用的網址清單 */
export function serverUrls() {
  if (net.hostInfo) return net.hostInfo.ips.map((ip) => `http://${ip}:${net.hostInfo.port}`);
  return net.address ? [`http://${net.address}`] : [];
}
