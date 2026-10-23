<script>
  // 房間大廳：左右兩個座位（VS）、邀請朋友、比賽規則、大廳聊天、開始比賽
  import { asset } from '../art-style.svelte.js';
  import { tick } from 'svelte';
  import { net, inTauri, hostCmd, leave, send, serverUrls, setCharacter, toast, load } from '../net.svelte.js';
  import { WEB_URL, shareLink } from '../site.js';
  import { CHARACTERS, getCharacter } from '../game/characters.js';
  import { DIFFICULTIES } from '../game/constants.js';
  import { play } from '../game/audio.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import BackButton from './BackButton.svelte';
  import CharacterGrid from './CharacterGrid.svelte';

  const SIDES = ['左邊・1P', '右邊・2P'];
  const room = $derived(net.room);
  const isHost = $derived(net.isHost);
  const urls = $derived(serverUrls());
  let urlIdx = $state(0);
  const address = $derived(urls[urlIdx] ?? urls[0] ?? '');
  // 線上房間的分享連結（…#join/房號）。桌面 App 沒設定網頁版網址時只給房號。
  const webBase = WEB_URL || (!inTauri && location.protocol.startsWith('http') ? location.origin + location.pathname : '');
  const link = $derived(shareLink(net.code, webBase));

  let botDifficulty = $state('normal');
  let charDialog;
  let dialogCursor = $state(0);
  let chatText = $state('');
  let chatBox = $state();

  const myCharacter = $derived(net.seat != null ? room?.seats[net.seat]?.character : null);

  $effect(() => {
    room?.chat.length;
    tick().then(() => chatBox && (chatBox.scrollTop = chatBox.scrollHeight));
  });

  function roleOf(i) {
    const tags = [];
    if (i === room.host_seat) tags.push('房主');
    if (i === net.seat) tags.push('你');
    return tags.join('・');
  }

  function statusOf(seat) {
    if (seat.kind === 'bot') return `電腦・${DIFFICULTIES[seat.difficulty]}`;
    return seat.connected ? '已連線' : '斷線中';
  }

  function updateSettings(patch) {
    hostCmd('settings', { settings: { ...room.settings, ...patch } });
  }

  function sit() {
    play('select');
    send({ type: 'sit', name: load('vb_name', '') || '玩家', character: load('vb_character') });
  }

  function openCharacters() {
    dialogCursor = Math.max(0, CHARACTERS.findIndex((c) => c.id === myCharacter));
    charDialog.showModal();
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

<ScreenFrame title="房間大廳" subtitle="邀請朋友，一起上場！">
  <div class="seats">
    {#each room.seats as seat, i (i)}
      <div class="panel seat" class:gold-frame={i === net.seat} class:empty={!seat}>
        <div class="panel-head">{SIDES[i]}</div>
        {#if seat}
          {@const c = getCharacter(seat.character)}
          <div class="pic" style="background-image: url({asset('game/court.webp')})">
            {#if roleOf(i)}
              <span class="role">
                {#if i === room.host_seat}<svg viewBox="0 0 24 18" aria-hidden="true"><path d="M2 16 4 4l5 5 3-7 3 7 5-5 2 12z" fill="#ffd43b" stroke="#142a63" stroke-width="2" stroke-linejoin="round" /></svg>{/if}
                {roleOf(i)}
              </span>
            {/if}
            <img src={i === net.seat ? c.portraits.happy : c.portraits.normal} alt="" />
          </div>
          <div class="plate">
            <b title={seat.name}>{seat.name}</b>
            <small>{c.name}</small>
          </div>
          <span class="status"><i class="dot" class:on={seat.kind === 'bot' || seat.connected}></i>{statusOf(seat)}</span>
          {#if i === net.seat}
            <button type="button" class="vbtn small gold" onclick={openCharacters}>更換角色</button>
          {:else if isHost && room.host_seat !== i}
            <button type="button" class="vbtn small" onclick={() => hostCmd('remove', { seat: i })}>移除</button>
          {/if}
        {:else}
          <div class="waiting">
            <img src="{asset('game/ball.webp')}" alt="" />
            <b>等待入席</b>
            <small>邀請朋友加入對戰</small>
          </div>
          {#if net.seat == null}
            <button type="button" class="vbtn small gold" onclick={sit}>入席</button>
          {/if}
          {#if isHost}
            <label class="bot">電腦難度
              <select class="vsel" bind:value={botDifficulty}>
                {#each Object.entries(DIFFICULTIES) as [k, label] (k)}<option value={k}>{label}</option>{/each}
              </select>
            </label>
            <button type="button" class="vbtn small gold" onclick={() => hostCmd('add_bot', { seat: i, difficulty: botDifficulty })}>加入電腦</button>
          {/if}
        {/if}
      </div>
      {#if i === 0}<span class="vs">VS</span>{/if}
    {/each}
  </div>

  <aside class="side">
    <section class="panel">
      <div class="panel-head left">{isHost ? '邀請朋友' : '連線資訊'}</div>
      <div class="panel-body">
        {#if net.code}
          <div class="copy-row">
            <span class="code-label">房號</span>
            <code class="room-code">{net.code}</code>
            <button type="button" class="vbtn small gold" onclick={() => copy(net.code)}>複製</button>
          </div>
          {#if link}
            <div class="copy-row">
              <code>{link}</code>
              <button type="button" class="vbtn small gold" onclick={() => copy(link)}>複製</button>
            </div>
          {/if}
          <p class="small">
            {#if net.signalDown}
              <b class="warn">配對服務暫時連不上：已經在房間的人不受影響，新的人要等一下才進得來。</b>
            {:else if isHost}
              朋友在「加入房間」輸入房號{link ? '，或直接打開連結' : ''}就能加入。比賽在你的瀏覽器裡跑，請不要關掉這個分頁。
            {:else}
              已用 WebRTC 直接連到房主。
            {/if}
          </p>
        {:else}
          {#if urls.length > 1}
            <div class="tabs">
              {#each urls as u, i (u)}
                <button type="button" class:sel={i === urlIdx} onclick={() => (urlIdx = i)}>{u.replace(/^https?:\/\//, '')}</button>
              {/each}
            </div>
          {/if}
          <div class="copy-row">
            <code>{address}</code>
            <button type="button" class="vbtn small gold" onclick={() => copy(address)}>複製</button>
          </div>
          <p class="small">
            {#if isHost}朋友可用 App 或瀏覽器加入。區網可直接連線；跨網路需要開放這個埠或用通道。{:else}已連線到房主。{/if}
          </p>
        {/if}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head left">比賽規則</div>
      <div class="panel-body rules">
        <label>勝利分數
          <select class="vsel" value={room.settings.target} disabled={!isHost} onchange={(e) => updateSettings({ target: Number(e.currentTarget.value) })}>
            {#each [5, 10, 15, 21] as n (n)}<option value={n}>{n} 分</option>{/each}
          </select>
        </label>
        <label>補位電腦
          <select class="vsel" value={room.settings.difficulty} disabled={!isHost} onchange={(e) => updateSettings({ difficulty: e.currentTarget.value })}>
            {#each Object.entries(DIFFICULTIES) as [k, label] (k)}<option value={k}>{label}</option>{/each}
          </select>
        </label>
      </div>
    </section>

    <section class="panel chat">
      <div class="panel-head left">大廳聊天</div>
      <div class="panel-body">
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
          <button type="submit" class="vbtn small gold" disabled={!chatText.trim()}>送出</button>
        </form>
      </div>
    </section>
  </aside>

  {#snippet foot()}
    <BackButton label="離開房間" onclick={leave} />
    <div class="hint-bar">{isHost ? '空位會在開始時補上電腦。' : '等待房主開始比賽…'}</div>
    {#if isHost}
      <button type="button" class="vbtn primary" onclick={() => hostCmd('start')}>開始比賽</button>
    {:else}
      <img class="spinner" src="{asset('game/ball.webp')}" alt="" />
    {/if}
  {/snippet}
</ScreenFrame>

<dialog class="char-dialog" bind:this={charDialog}>
  <div class="panel">
    <div class="panel-head">更換角色</div>
    <div class="panel-body">
      <CharacterGrid
        bind:cursor={dialogCursor}
        selected={myCharacter}
        showLocked={false}
        onpick={(c) => {
          setCharacter(c.id);
          charDialog.close();
        }}
      />
      <div class="dialog-actions"><button type="button" class="vbtn small" onclick={() => charDialog.close()}>取消</button></div>
    </div>
  </div>
</dialog>

<style>
  .seats {
    flex: 1.45;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    gap: 0.6cqw;
    min-width: 0;
  }
  .seat {
    align-items: center;
    gap: 0.8cqh;
    padding-bottom: 1.4cqh;
    min-width: 0;
  }
  .seat .panel-head {
    align-self: stretch;
  }
  .pic {
    position: relative;
    align-self: stretch;
    margin: 0 1cqh;
    flex: 1;
    min-height: 0;
    border: 0.35cqh solid var(--navy);
    background-size: cover;
    background-position: center 30%;
    overflow: hidden;
  }
  .pic img {
    position: absolute;
    left: 50%;
    bottom: 0;
    height: 100%;
    translate: -50% 0;
  }
  .role {
    position: absolute;
    top: 0.8cqh;
    left: 0.8cqh;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.6cqh;
    background: linear-gradient(#ffe56b, var(--gold) 55%, var(--gold-deep));
    border: 0.3cqh solid var(--navy);
    font-weight: 900;
    font-size: 2.1cqh;
    padding: 0.2cqh 1.6cqh 0.2cqh 1cqh;
    clip-path: polygon(0 0, 100% 0, calc(100% - 1cqh) 100%, 0 100%);
  }
  .role svg {
    width: 3cqh;
  }
  .plate {
    margin-top: -3cqh;
    z-index: 1;
    width: 86%;
    background: var(--cream);
    border: 0.35cqh solid var(--navy);
    border-radius: 0.6cqh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4cqh;
  }
  .plate b {
    font-size: 3.6cqh;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .plate small {
    font-weight: 800;
    font-size: 2.1cqh;
  }
  .status {
    font-weight: 800;
    font-size: 2.1cqh;
  }
  .dot {
    display: inline-block;
    width: 1.6cqh;
    height: 1.6cqh;
    border-radius: 50%;
    background: #9aa3ba;
    border: 0.25cqh solid var(--navy);
    margin-right: 0.6cqh;
    vertical-align: -0.2cqh;
  }
  .dot.on {
    background: var(--ok);
  }
  .waiting {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6cqh;
  }
  .waiting img {
    width: 15cqh;
    opacity: 0.55;
    animation: spin 6s linear infinite;
  }
  .waiting b {
    font-size: 4.2cqh;
    letter-spacing: 0.1em;
  }
  .waiting small {
    font-weight: 800;
    font-size: 2.1cqh;
  }
  .bot {
    display: flex;
    gap: 1cqh;
    align-items: center;
    font-weight: 900;
    font-size: 2.2cqh;
  }
  .vs {
    align-self: center;
    font-size: 8cqh;
    font-weight: 900;
    font-style: italic;
    color: var(--gold);
    -webkit-text-stroke: 0.55cqh var(--navy);
    paint-order: stroke fill;
    margin: 0 -1.4cqw;
    z-index: 1;
  }

  .side {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.2cqh;
    min-height: 0;
    min-width: 0;
  }
  .side .panel-body {
    padding: 1cqh 1.6cqh;
    gap: 0.8cqh;
  }
  .side .panel-head {
    font-size: 2.6cqh;
    padding: 0.3cqh 3cqh 0.3cqh 6.4cqh;
  }
  .copy-row {
    display: flex;
    gap: 1cqh;
    align-items: center;
  }
  .copy-row code {
    flex: 1;
    min-width: 0;
    background: var(--paper-white);
    border: 0.35cqh solid var(--navy);
    border-radius: 0.6cqh;
    padding: 0.5cqh 1cqh;
    font-size: 2.2cqh;
    font-weight: 700;
    overflow-x: auto;
    white-space: nowrap;
    user-select: text;
  }
  .code-label {
    font-weight: 900;
    font-size: 2.2cqh;
  }
  .room-code {
    font-size: 3.6cqh !important;
    font-weight: 900 !important;
    letter-spacing: 0.3em;
    text-align: center;
  }
  .warn {
    color: var(--accent);
  }
  .tabs {
    display: flex;
    gap: 0.6cqh;
    flex-wrap: wrap;
  }
  .tabs button {
    border: 0.25cqh solid var(--navy);
    background: var(--paper-white);
    border-radius: 0.6cqh;
    font-weight: 800;
    font-size: 1.8cqh;
    padding: 0.2cqh 1cqh;
  }
  .tabs .sel {
    background: var(--gold);
  }
  .small {
    margin: 0;
    font-size: 1.9cqh;
    font-weight: 700;
  }
  .rules {
    flex-direction: row !important;
    gap: 2cqw !important;
    flex-wrap: wrap;
  }
  .rules label {
    display: flex;
    gap: 1cqh;
    align-items: center;
    font-weight: 900;
    font-size: 2.2cqh;
  }
  .chat {
    flex: 1;
  }
  .chat ol {
    flex: 1;
    min-height: 0;
    list-style: none;
    margin: 0;
    padding: 0.6cqh 1cqh;
    overflow-y: auto;
    font-size: 2cqh;
    line-height: 1.5;
    background: var(--paper-white);
    border: 0.3cqh solid var(--navy);
    border-radius: 0.6cqh;
  }
  .chat .sys {
    color: var(--muted);
  }
  .chat .mine {
    color: var(--accent);
  }
  .chat form {
    display: flex;
    gap: 0.8cqh;
  }
  .chat input {
    flex: 1;
    min-width: 0;
    font-size: 2.1cqh;
  }
  .spinner {
    width: 7cqh;
    height: 7cqh;
    animation: spin 1.6s linear infinite;
  }

  .char-dialog {
    border: none;
    background: none;
    padding: 0;
    width: 76cqw;
    max-width: 92vw;
  }
  .char-dialog::backdrop {
    background: rgba(8, 18, 48, 0.6);
  }
  .char-dialog .panel-body {
    min-height: 40cqh;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
</style>
