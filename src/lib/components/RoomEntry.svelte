<script>
  // 開設房間／加入房間的表單
  import { onMount } from 'svelte';
  import { net, inTauri, connect, disconnect, startHost, stopHost, hostStatus, toast, load, store, DEFAULT_PORT } from '../net.svelte.js';
  import { CHARACTERS, isUnlocked, getCharacter } from '../game/characters.js';
  import PortraitGrid from './PortraitGrid.svelte';

  // page = host | join
  let { page, onback } = $props();
  const isHost = $derived(page === 'host');

  // 從房主的伺服器打開的網頁：位址直接帶入
  const servedByServer = !inTauri && location.protocol.startsWith('http') && !import.meta.env.DEV;

  const available = CHARACTERS.filter(isUnlocked);
  let name = $state(load('vb_name', ''));
  let port = $state(load('vb_port', String(DEFAULT_PORT)));
  let address = $state(servedByServer ? location.host : load('vb_address', ''));
  let hostKey = $state('');
  let character = $state(
    available.find((c) => c.id === load('vb_character'))?.id ?? available[Math.floor(Math.random() * available.length)].id,
  );
  let busy = $state(false);
  const connecting = $derived(!net.room && (net.status === 'connecting' || net.status === 'open'));

  onMount(() => {
    hostStatus().catch(() => {});
  });

  const playerName = () => name.trim() || '玩家';

  function remember() {
    store('vb_name', name);
    store('vb_character', character);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || connecting) return;
    remember();
    if (isHost && inTauri) {
      if (net.hostInfo) {
        connect(`localhost:${net.hostInfo.port}`, { name: playerName(), hostKey: net.hostInfo.host_key, character });
        return;
      }
      store('vb_port', port);
      busy = true;
      try {
        await startHost(port, playerName(), character);
      } catch (error) {
        toast(String(error));
      } finally {
        busy = false;
      }
      return;
    }
    if (!address.trim()) return toast(`請輸入房主的位址，例如 192.168.1.5:${DEFAULT_PORT}`);
    if (isHost && !hostKey.trim()) return toast('請輸入伺服器顯示的房主金鑰');
    if (!servedByServer) store('vb_address', address);
    connect(address, { name: playerName(), hostKey: isHost ? hostKey.trim() : undefined, character });
  }

  function spectate() {
    if (!address.trim()) return toast('請輸入房主的位址');
    remember();
    connect(address, { name: playerName(), spectate: true });
  }

  async function closeRoom() {
    busy = true;
    try {
      await stopHost();
    } catch (error) {
      toast(String(error));
    } finally {
      busy = false;
    }
  }

  function back() {
    if (connecting) disconnect();
    onback();
  }
</script>

<section class="screen entry">
  <h2>{isHost ? '開設房間' : '加入房間'}</h2>
  <form class="panel" onsubmit={submit}>
    <div class="cols">
      <div class="col">
        <label class="field">
          <span>玩家名稱</span>
          <input bind:value={name} placeholder="玩家" maxlength="16" autocomplete="nickname" />
        </label>

        {#if isHost && inTauri}
          {#if net.hostInfo}
            <p class="hint">房間已在通訊埠 <b>{net.hostInfo.port}</b> 開著。</p>
          {:else}
            <label class="field">
              <span>通訊埠</span>
              <input bind:value={port} type="number" min="1" max="65535" required />
            </label>
            <p class="hint">開好之後，在大廳把網址分享給朋友。朋友沒裝 App 也能用瀏覽器打開。</p>
          {/if}
        {:else}
          <label class="field">
            <span>{isHost ? '伺服器位址' : '房間位址'}</span>
            <input bind:value={address} placeholder="192.168.1.5:{DEFAULT_PORT}" readonly={servedByServer} />
          </label>
          {#if isHost}
            <label class="field">
              <span>房主金鑰</span>
              <input bind:value={hostKey} placeholder="伺服器啟動時印出的金鑰" />
            </label>
          {/if}
        {/if}

        <div class="picked">
          <img src={getCharacter(character).portraits.happy} alt="" />
          <div>
            <b>{getCharacter(character).name}</b>
            <small>{getCharacter(character).intro}</small>
          </div>
        </div>
      </div>
      <div class="col">
        <span class="label">選擇角色</span>
        <PortraitGrid bind:value={character} size={10} />
      </div>
    </div>

    {#if connecting}
      <div class="actions">
        <span class="hint">連線到 {net.address} 中…</span>
        <button type="button" onclick={disconnect}>取消連線</button>
      </div>
    {:else}
      <div class="actions">
        <button type="button" onclick={back}>返回</button>
        {#if isHost && inTauri && net.hostInfo}
          <button type="button" onclick={closeRoom} disabled={busy}>關閉房間</button>
        {/if}
        {#if !isHost}
          <button type="button" onclick={spectate}>觀戰</button>
        {/if}
        <button type="submit" class="primary" disabled={busy}>
          {isHost ? (net.hostInfo ? '回到房間' : '開房') : '加入'}
        </button>
      </div>
    {/if}
  </form>
</section>

<style>
  .entry {
    justify-content: center;
  }
  .panel {
    background: var(--paper);
    border: 0.45cqh solid var(--ink);
    border-radius: 2.4cqh;
    padding: 2.4cqh 3cqh;
    box-shadow: 0 1cqh 0 var(--ink);
    display: flex;
    flex-direction: column;
    gap: 2cqh;
    width: 86cqw;
  }
  .cols {
    display: grid;
    grid-template-columns: 30cqw 1fr;
    gap: 3cqw;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 1.4cqh;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5cqh;
    font-weight: 800;
  }
  .label {
    font-weight: 800;
  }
  input {
    font: inherit;
    padding: 0.8cqh 1.2cqh;
    border: 0.35cqh solid var(--ink);
    border-radius: 1.2cqh;
    background: #fff;
  }
  .hint {
    margin: 0;
    font-size: 2.1cqh;
    opacity: 0.8;
  }
  .picked {
    display: flex;
    gap: 1.4cqh;
    align-items: center;
    margin-top: auto;
  }
  .picked img {
    width: 14cqh;
    height: 14cqh;
    border-radius: 1.6cqh;
    border: 0.35cqh solid var(--ink);
    background: linear-gradient(#bfe6ff, #fff3d6);
  }
  .picked div {
    display: flex;
    flex-direction: column;
  }
  .picked b {
    font-size: 3.4cqh;
  }
  .picked small {
    font-size: 2cqh;
    opacity: 0.75;
  }
  .actions {
    display: flex;
    gap: 1.4cqh;
    justify-content: flex-end;
    align-items: center;
  }
  .primary {
    background: var(--accent2);
  }
</style>
