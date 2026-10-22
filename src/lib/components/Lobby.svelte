<script>
  // 房間大廳：左右兩個座位、邀請資訊、規則、聊天、開始比賽
  import { tick } from 'svelte';
  import { net, hostCmd, leave, send, serverUrls, setCharacter, toast, load } from '../net.svelte.js';
  import { getCharacter } from '../game/characters.js';
  import { DIFFICULTIES } from '../game/constants.js';
  import PortraitGrid from './PortraitGrid.svelte';

  const SIDES = ['左邊', '右邊'];
  const room = $derived(net.room);
  const isHost = $derived(net.isHost);
  const urls = $derived(serverUrls());
  let urlIdx = $state(0);
  const address = $derived(urls[urlIdx] ?? urls[0] ?? '');

  let botDifficulty = $state('normal');
  let showCharacter = $state(false);
  let chatText = $state('');
  let chatBox = $state();

  const myCharacter = $derived(net.seat != null ? room?.seats[net.seat]?.character : null);

  $effect(() => {
    room?.chat.length;
    tick().then(() => chatBox && (chatBox.scrollTop = chatBox.scrollHeight));
  });

  function roleOf(seat, i) {
    const tags = [];
    if (i === room.host_seat) tags.push('房主');
    if (i === net.seat) tags.push('你');
    if (seat.kind === 'bot') tags.push('電腦');
    return tags.join('・');
  }

  function statusOf(seat) {
    if (seat.kind === 'bot') return DIFFICULTIES[seat.difficulty];
    return seat.connected ? '已連線' : '斷線中';
  }

  function updateSettings(patch) {
    hostCmd('settings', { settings: { ...room.settings, ...patch } });
  }

  function sit() {
    send({ type: 'sit', name: load('vb_name', '') || '玩家', character: load('vb_character') });
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('已複製', 'ok');
    } catch {
      toast('複製失敗，請手動選取');
    }
  }

  function sendChat(event) {
    event.preventDefault();
    if (!chatText.trim()) return;
    send({ type: 'chat', text: chatText });
    chatText = '';
  }
</script>

<section class="screen lobby">
  <header>
    <h2>房間大廳</h2>
    <button onclick={leave}>⇦ 離開房間</button>
  </header>

  <div class="body">
    <div class="seats">
      {#each room.seats as seat, i (i)}
        <div class="seat panel" class:me={i === net.seat} class:empty={!seat}>
          <span class="side">{SIDES[i]}</span>
          {#if seat}
            {@const c = getCharacter(seat.character)}
            <img src={i === net.seat ? c.portraits.happy : c.portraits.normal} alt="" />
            <b class="name" title={seat.name}>{seat.name}</b>
            <span class="char">{c.name}</span>
            <span class="role">{roleOf(seat, i)}</span>
            <span class="status"><i class="dot" class:on={seat.kind === 'bot' || seat.connected}></i>{statusOf(seat)}</span>
            {#if i === net.seat}
              <button onclick={() => (showCharacter = true)}>更換角色</button>
            {:else if isHost && room.host_seat !== i}
              <button onclick={() => hostCmd('remove', { seat: i })}>移除</button>
            {/if}
          {:else}
            <div class="chair">🏐</div>
            <b class="name wait">等待入席</b>
            {#if net.seat == null}
              <button onclick={sit}>入席</button>
            {/if}
            {#if isHost}
              <div class="addbot">
                <select bind:value={botDifficulty}>
                  {#each Object.entries(DIFFICULTIES) as [k, label] (k)}<option value={k}>{label}</option>{/each}
                </select>
                <button onclick={() => hostCmd('add_bot', { seat: i, difficulty: botDifficulty })}>加入電腦</button>
              </div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>

    <aside class="side-col">
      <section class="panel invite">
        <h3>{isHost ? '邀請朋友' : '連線資訊'}</h3>
        {#if urls.length > 1}
          <div class="tabs">
            {#each urls as u, i (u)}
              <button class:sel={i === urlIdx} onclick={() => (urlIdx = i)}>{u.replace(/^https?:\/\//, '')}</button>
            {/each}
          </div>
        {/if}
        <div class="copy-row">
          <code>{address}</code>
          <button onclick={() => copy(address)}>複製</button>
        </div>
        <p class="small">
          {#if isHost}朋友用 App 的「加入房間」輸入位址，或直接用瀏覽器打開這個網址。需要在同一個區網，或房主的路由器有開放這個埠。{:else}已連線到房主。{/if}
        </p>
      </section>

      <section class="panel rules">
        <h3>比賽規則</h3>
        <label>勝利分數
          <select value={room.settings.target} disabled={!isHost} onchange={(e) => updateSettings({ target: Number(e.currentTarget.value) })}>
            {#each [5, 10, 15, 21] as n (n)}<option value={n}>{n} 分</option>{/each}
          </select>
        </label>
        <label>補位電腦
          <select value={room.settings.difficulty} disabled={!isHost} onchange={(e) => updateSettings({ difficulty: e.currentTarget.value })}>
            {#each Object.entries(DIFFICULTIES) as [k, label] (k)}<option value={k}>{label}</option>{/each}
          </select>
        </label>
      </section>

      <section class="panel chat">
        <ol bind:this={chatBox}>
          {#each room.chat as line, i (i)}
            {#if line.sys}
              <li class="sys">{line.text}</li>
            {:else}
              <li><b class:mine={line.seat === net.seat && line.seat != null}>{line.name}</b>：{line.text}</li>
            {/if}
          {/each}
        </ol>
        <form onsubmit={sendChat}>
          <input bind:value={chatText} placeholder="說點什麼…" maxlength="300" />
          <button type="submit" disabled={!chatText.trim()}>送出</button>
        </form>
      </section>
    </aside>
  </div>

  <footer>
    {#if isHost}
      <p class="small">空位會在開始時補上電腦。</p>
      <button class="start" onclick={() => hostCmd('start')}>開始比賽</button>
    {:else}
      <p class="waiting">等待房主開始比賽…</p>
    {/if}
  </footer>
</section>

{#if showCharacter}
  <div class="modal" role="presentation" onclick={(e) => e.target === e.currentTarget && (showCharacter = false)}>
    <div class="panel">
      <h3>更換角色</h3>
      <PortraitGrid
        value={myCharacter}
        size={11}
        onpick={(id) => {
          setCharacter(id);
          showCharacter = false;
        }}
      />
    </div>
  </div>
{/if}

<style>
  .lobby {
    justify-content: flex-start;
    padding: 3cqh 3cqw;
    gap: 2cqh;
    background: rgba(20, 16, 35, 0.55);
  }
  header,
  footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  footer {
    justify-content: flex-end;
    gap: 2cqw;
    color: #fff;
    text-shadow: 0 0 0.6cqh #000;
  }
  .body {
    flex: 1;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 36cqw;
    gap: 2cqw;
    min-height: 0;
  }
  .panel {
    background: var(--paper);
    border: 0.45cqh solid var(--ink);
    border-radius: 2cqh;
    padding: 1.6cqh;
  }
  h3 {
    margin: 0 0 1cqh;
    font-size: 2.8cqh;
  }
  .small {
    font-size: 1.9cqh;
    margin: 0.8cqh 0 0;
    opacity: 0.8;
  }

  .seats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2cqw;
  }
  .seat {
    position: relative;
    padding-top: 4.4cqh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6cqh;
    text-align: center;
  }
  .seat.me {
    outline: 0.7cqh solid var(--accent);
  }
  .seat.empty {
    background: rgba(255, 250, 240, 0.75);
    justify-content: center;
  }
  .seat img {
    width: 100%;
    max-width: 30cqh;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 1.6cqh;
    background: linear-gradient(#bfe6ff, #fff3d6);
  }
  .side {
    position: absolute;
    top: 1.2cqh;
    left: 1.2cqh;
    background: var(--ink);
    color: #fff;
    border-radius: 1cqh;
    padding: 0 1.2cqh;
    font-size: 2cqh;
    font-weight: 800;
  }
  .name {
    font-size: 3.4cqh;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name.wait {
    opacity: 0.6;
  }
  .char,
  .role,
  .status {
    font-size: 2.1cqh;
  }
  .role {
    color: var(--accent);
    font-weight: 800;
    min-height: 1em;
  }
  .chair {
    font-size: 12cqh;
    opacity: 0.4;
  }
  .dot {
    display: inline-block;
    width: 1.2cqh;
    height: 1.2cqh;
    border-radius: 50%;
    background: #bbb;
    margin-right: 0.6cqh;
  }
  .dot.on {
    background: #2fbf71;
  }
  .addbot {
    display: flex;
    gap: 0.8cqh;
  }
  .seat button,
  .addbot select {
    padding: 0.6cqh 1.6cqh;
    box-shadow: none;
  }

  .side-col {
    display: flex;
    flex-direction: column;
    gap: 1.6cqh;
    min-height: 0;
  }
  .copy-row {
    display: flex;
    gap: 1cqh;
    align-items: center;
  }
  .copy-row code {
    flex: 1;
    background: #fff;
    border: 0.3cqh solid var(--ink);
    border-radius: 1cqh;
    padding: 0.6cqh 1cqh;
    font-size: 2.2cqh;
    overflow-x: auto;
    white-space: nowrap;
  }
  .copy-row button,
  .tabs button {
    padding: 0.5cqh 1.4cqh;
    box-shadow: none;
    font-size: 2cqh;
  }
  .tabs {
    display: flex;
    gap: 0.6cqh;
    margin-bottom: 0.8cqh;
    flex-wrap: wrap;
  }
  .tabs .sel {
    background: var(--accent2);
  }
  .rules {
    display: flex;
    gap: 2cqw;
    flex-wrap: wrap;
    align-items: center;
  }
  .rules h3 {
    width: 100%;
  }
  .rules label {
    display: flex;
    gap: 0.8cqh;
    align-items: center;
    font-weight: 800;
    font-size: 2.2cqh;
  }
  .rules select {
    padding: 0.4cqh 1cqh;
    box-shadow: none;
  }
  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .chat ol {
    flex: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    font-size: 2.1cqh;
    line-height: 1.5;
  }
  .chat .sys {
    opacity: 0.6;
  }
  .chat .mine {
    color: var(--accent);
  }
  .chat form {
    display: flex;
    gap: 0.8cqh;
    margin-top: 1cqh;
  }
  .chat input {
    flex: 1;
    font: inherit;
    font-size: 2.2cqh;
    padding: 0.6cqh 1cqh;
    border: 0.3cqh solid var(--ink);
    border-radius: 1cqh;
  }
  .chat button {
    padding: 0.5cqh 1.6cqh;
    box-shadow: none;
  }
  .start {
    background: var(--accent2);
    font-size: 3.4cqh;
    padding: 1.4cqh 5cqh;
  }
  .waiting {
    font-weight: 800;
    font-size: 3cqh;
    margin: 0;
  }
  .modal {
    position: absolute;
    inset: 0;
    background: rgba(20, 16, 35, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
  }
  .modal .panel {
    width: 74cqw;
  }
</style>
