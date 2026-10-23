<script>
  // 開設房間／加入房間：左邊玩家資料，右邊選角色
  import { onMount } from 'svelte';
  import { net, inTauri, connect, disconnect, startHost, stopHost, hostStatus, toast, load, store, DEFAULT_PORT, checkOnline, hostOnline, joinOnline } from '../net.svelte.js';
  import { SIGNAL_SERVER, roomCodeOf } from '../site.js';
  import { CHARACTERS, isUnlocked, getCharacter } from '../game/characters.js';
  import { play } from '../game/audio.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import BackButton from './BackButton.svelte';
  import CharacterGrid from './CharacterGrid.svelte';

  // page = host | join；code：從分享連結（#join/房號）打開時帶入的房號
  let { page, code = '', onback } = $props();
  const isHost = $derived(page === 'host');

  // 從房主的伺服器打開的網頁：位址直接帶入
  const servedByServer = !inTauri && location.protocol.startsWith('http') && !import.meta.env.DEV;

  const available = CHARACTERS.filter(isUnlocked);
  let name = $state(load('vb_name', ''));
  let port = $state(load('vb_port', String(DEFAULT_PORT)));
  // svelte-ignore state_referenced_locally
  let address = $state(code || (servedByServer ? location.host : load('vb_address', '')));
  // 開房方式：線上（房號，WebRTC）或區網（桌面 App 內建伺服器／自架伺服器）
  let hostMode = $state(load('vb_host_mode', 'online'));
  // 線上房間只有配對服務在的時候才能開（沒設定配對服務就整個藏起來）
  const online = $derived(isHost && !!net.online && hostMode === 'online');
  let hostKey = $state('');
  let character = $state(
    available.find((c) => c.id === load('vb_character'))?.id ?? available[Math.floor(Math.random() * available.length)].id,
  );
  let cursor = $state(CHARACTERS.findIndex((c) => c.id === character));
  let busy = $state(false);
  const connecting = $derived(!net.room && (net.status === 'connecting' || net.status === 'open'));
  const chosen = $derived(getCharacter(character));

  onMount(() => {
    hostStatus().catch(() => {});
    checkOnline();
  });

  function pickMode(m) {
    play('select');
    hostMode = m;
    store('vb_host_mode', m);
  }

  const playerName = () => name.trim() || '玩家';

  function remember() {
    store('vb_name', name);
    store('vb_character', character);
  }

  async function submit() {
    if (busy || connecting) return;
    play('select');
    remember();
    if (online) return hostOnline({ name: playerName(), character });
    if (!isHost && roomCodeOf(address)) return joinRoomCode(false);
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

  // 加入線上房間（輸入房號或分享連結）
  function joinRoomCode(spectate) {
    if (net.online === false) return toast('線上房間暫時無法使用，請稍後再試');
    store('vb_address', address);
    joinOnline(roomCodeOf(address), { name: playerName(), spectate, character });
  }

  function spectate() {
    if (!address.trim()) return toast(net.online ? '請輸入房號或房主的位址' : '請輸入房主的位址');
    remember();
    if (roomCodeOf(address)) return joinRoomCode(true);
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

  const hint = $derived(
    connecting
      ? net.code
        ? `連線到房間 ${net.code} 中…`
        : `連線到 ${net.address} 中…`
      : online
        ? '開房後會拿到 5 碼房號與分享連結，朋友在任何地方都能加入。'
        : isHost
          ? inTauri
            ? '開房後，可在大廳分享網址邀請朋友。'
            : '在網頁開房：輸入伺服器位址與啟動時印出的房主金鑰。'
          : net.online
            ? '輸入房號、分享連結或區網位址；沒有座位時會改成觀戰。'
            : '輸入房主分享的網址；沒有座位時會改成觀戰。',
  );
</script>

<ScreenFrame title={isHost ? '開設房間' : '加入房間'} subtitle="設定玩家資料與角色">
  <form
    class="panel profile"
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
  >
    <div class="panel-head">玩家資料</div>
    <div class="panel-body">
      <label class="field">玩家名稱
        <input bind:value={name} placeholder="玩家" maxlength="16" autocomplete="nickname" />
      </label>

      {#if isHost && SIGNAL_SERVER}
        <div class="field">開房方式
          <div class="modes" role="radiogroup">
            <button type="button" role="radio" aria-checked={online} class="vbtn small" class:active={online} disabled={!net.online} onclick={() => pickMode('online')}>線上（房號）</button>
            <button type="button" role="radio" aria-checked={!online} class="vbtn small" class:active={!online} onclick={() => pickMode('lan')}>{inTauri ? '區網（桌面 App）' : '區網（自架伺服器）'}</button>
          </div>
          {#if net.online === null}<small>檢查線上房間中…</small>{:else if !net.online}<small>線上房間暫時無法使用，請稍後再試。</small>{/if}
        </div>
      {/if}

      {#if online}
        <p class="note">比賽在你的瀏覽器裡跑，朋友用 WebRTC 直接連到你。<small>開著這個畫面房間才在，關掉分頁房間就關了。</small></p>
      {:else if isHost && inTauri}
        {#if net.hostInfo}
          <p class="note">房間已在通訊埠 <b>{net.hostInfo.port}</b> 開著。</p>
          <button type="button" class="vbtn small" onclick={closeRoom} disabled={busy}>關閉房間</button>
        {:else}
          <label class="field">通訊埠
            <input bind:value={port} type="number" min="1" max="65535" required />
            <small>預設 {DEFAULT_PORT}</small>
          </label>
        {/if}
      {:else}
        <label class="field">{isHost ? '伺服器位址' : net.online ? '房號或網址' : '房間網址'}
          <input
            bind:value={address}
            placeholder={!isHost && net.online ? `K7QX2 或 192.168.1.5:${DEFAULT_PORT}` : `192.168.1.5:${DEFAULT_PORT}`}
            readonly={servedByServer && !code}
            spellcheck="false"
          />
        </label>
        {#if isHost}
          <label class="field">房主金鑰
            <input bind:value={hostKey} placeholder="伺服器啟動時印出的金鑰" />
          </label>
        {/if}
      {/if}

      <div class="chosen">
        <div class="frame-pic"><img src={chosen.portraits.normal} alt="" /></div>
        <div>
          <b>{chosen.name}</b>
          <small>{chosen.intro}</small>
          <span class="badge">已選擇</span>
        </div>
      </div>
    </div>
  </form>

  <div class="panel roster">
    <div class="panel-head">選擇角色</div>
    <div class="panel-body">
      <CharacterGrid bind:cursor selected={character} showLocked={false} onpick={(c) => (character = c.id)} />
      <p class="tip">點選頭像，選擇你的角色</p>
    </div>
  </div>

  {#snippet foot()}
    <BackButton onclick={back} />
    <div class="hint-bar">{hint}</div>
    <div class="actions">
      {#if connecting}
        <button type="button" class="vbtn small" onclick={disconnect}>取消</button>
      {:else if !isHost}
        <button type="button" class="vbtn small" onclick={spectate}>觀戰</button>
      {/if}
      <button type="button" class="vbtn primary" disabled={busy || connecting} onclick={submit}>
        {isHost ? (!online && net.hostInfo ? '回到房間' : '開設房間') : '加入房間'}
      </button>
    </div>
  {/snippet}
</ScreenFrame>

<style>
  .profile {
    flex: 1;
  }
  .roster {
    flex: 1.75;
  }
  .note {
    margin: 0;
    font-weight: 800;
    font-size: 2.3cqh;
  }
  .note small {
    display: block;
    margin-top: 0.4cqh;
    font-weight: 700;
    font-size: 1.9cqh;
    color: var(--muted);
  }
  .modes {
    display: flex;
    gap: 1cqh;
    flex-wrap: wrap;
  }
  .chosen {
    margin-top: auto;
    display: flex;
    gap: 1.6cqh;
    align-items: center;
    border-top: 0.35cqh solid var(--navy);
    padding-top: 1.4cqh;
  }
  .frame-pic {
    width: 17cqh;
    height: 17cqh;
    flex: none;
    border: 0.45cqh solid var(--navy);
    outline: 0.3cqh solid var(--gold);
    outline-offset: -0.9cqh;
    background: linear-gradient(#5aa9ec, #9fd3ff);
    overflow: hidden;
  }
  .frame-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .chosen > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 0.5cqh;
  }
  .chosen b {
    font-size: 5cqh;
    line-height: 1.1;
  }
  .chosen small {
    font-size: 2.1cqh;
    font-weight: 800;
    color: var(--navy-soft);
  }
  .badge {
    align-self: flex-start;
    background: linear-gradient(#ffe56b, var(--gold) 55%, var(--gold-deep));
    border: 0.35cqh solid var(--navy);
    font-weight: 900;
    font-size: 2.4cqh;
    letter-spacing: 0.2em;
    padding: 0.3cqh 2.6cqh;
    clip-path: polygon(1cqh 0, 100% 0, calc(100% - 1cqh) 100%, 0 100%);
  }
  .tip {
    margin: 0;
    text-align: center;
    font-weight: 800;
    font-size: 2.1cqh;
    letter-spacing: 0.2em;
  }
  .actions {
    display: flex;
    gap: 1.4cqh;
    align-items: center;
  }
</style>
