<script>
  import { asset, artStyle } from './lib/art-style.svelte.js';
  import { loading, preloadStyle, preloadStyleWithin } from './lib/preload.svelte.js';
  import { onMount } from 'svelte';
  import { createEngine } from './lib/engine.js';
  import { pickLine, unlockHidden } from './lib/game/characters.js';
  import { toggleMute } from './lib/game/audio.js';
  import { net, hostCmd, leave } from './lib/net.svelte.js';
  import Menu from './lib/components/Menu.svelte';
  import Dialog from './lib/components/Dialog.svelte';
  import TitleScreen from './lib/components/TitleScreen.svelte';
  import SoloScreen from './lib/components/SoloScreen.svelte';
  import HelpScreen from './lib/components/HelpScreen.svelte';
  import SettingsDialog from './lib/components/SettingsDialog.svelte';
  import SelectScreen from './lib/components/SelectScreen.svelte';
  import RoomEntry from './lib/components/RoomEntry.svelte';
  import Lobby from './lib/components/Lobby.svelte';
  import Controls from './lib/components/Controls.svelte';
  import TouchControls from './lib/components/TouchControls.svelte';
  import { ui, openSettings } from './lib/ui.svelte.js';
  import { roomCodeOf } from './lib/site.js';
  import { setBgm, playJingle } from './lib/audio/sound.svelte.js';

  // 單機：title | solo | help | select | play | pause | result | host | join（設定是隨時可開的視窗）
  // 連線中（net.room 有值）時畫面由房間狀態決定：大廳或比賽
  // 分享連結（…#join/房號）打開：直接到加入房間、帶入房號
  const linkCode = roomCodeOf(location.hash) ?? '';
  if (linkCode) history.replaceState(null, '', location.pathname + location.search);
  let joinCode = $state(linkCode);
  let screen = $state(linkCode ? 'join' : 'title');
  let mode = $state('cpu'); // cpu | versus | watch
  let lastSetup = null;
  let result = $state(null);
  let onlineMenu = $state(false);
  let canvas;
  let engine = $state();

  // 開遊戲時先把目前風格的圖都載好（最多等 15 秒）；之後換風格就在背景載
  let booting = $state(true);
  let waiting = $state(false); // 進比賽前還在等圖
  const percent = $derived(loading.total ? Math.round((loading.done / loading.total) * 100) : 0);
  preloadStyleWithin(artStyle.id, 15000).then(() => (booting = false));
  $effect(() => {
    if (!booting) preloadStyle(artStyle.id);
  });

  // 剛換風格、圖還沒載完就開賽：先顯示載入中，免得角色和球場慢慢冒出來
  async function ensureArt() {
    let done = false;
    const all = preloadStyle(artStyle.id).then(() => (done = true));
    await Promise.resolve();
    if (done) return;
    waiting = true;
    await Promise.race([all, new Promise((resolve) => setTimeout(resolve, 10000))]);
    waiting = false;
  }

  onMount(() => {
    engine = createEngine(canvas, {
      onMatchEnd,
      onMatchStart: () => (result = null),
      // 有人差一分就贏：換成賽末點的曲子
      onScore: (m) => (matchPoint = m.phase !== 'over' && Math.max(...m.score) >= m.target - 1),
    });
    window.__vb = engine;
    // 單機比賽中切到背景、或手機轉成直的：自動暫停
    const portrait = matchMedia('(orientation: portrait) and (pointer: coarse)');
    const autoPause = () => {
      if ((document.hidden || portrait.matches) && screen === 'play' && !roomPhase) pause();
    };
    document.addEventListener('visibilitychange', autoPause);
    portrait.addEventListener('change', autoPause);
    // 已經開著遊戲時貼上分享連結（只改了 #join/房號）：還沒進房間就切到加入房間
    const onHash = () => {
      const code = roomCodeOf(location.hash);
      if (!code) return;
      history.replaceState(null, '', location.pathname + location.search);
      if (net.room || net.status !== 'idle' || ['play', 'pause'].includes(screen)) return;
      joinCode = code;
      screen = 'join';
    };
    addEventListener('hashchange', onHash);
    return () => {
      engine.destroy();
      document.removeEventListener('visibilitychange', autoPause);
      removeEventListener('hashchange', onHash);
      portrait.removeEventListener('change', autoPause);
    };
  });

  // 連線房間的階段切換
  const roomPhase = $derived(net.room?.phase ?? null);
  let prevPhase = null;
  $effect(() => {
    const phase = roomPhase;
    if (!engine || phase === prevPhase) return;
    if (phase === 'playing') {
      result = null;
      onlineMenu = false;
      engine.startOnline();
    } else {
      engine.stop();
      result = null;
      // 離開房間 → 回標題
      if (phase === null && prevPhase !== null) screen = 'title';
    }
    prevPhase = phase;
  });

  const view = $derived(roomPhase ? `online-${roomPhase}` : screen);

  // 背景音樂：依畫面切換（短曲播完會自動接回）
  let matchPoint = $state(false);
  const scene = $derived.by(() => {
    if (view === 'online-lobby') return 'menu';
    if (view === 'online-playing') return result ? 'menu' : matchPoint ? 'tension' : 'match';
    if (screen === 'title') return 'title';
    if (screen === 'play' || screen === 'pause') return matchPoint ? 'tension' : 'match';
    return 'menu';
  });
  $effect(() => setBgm(scene));

  function openSelect(m) {
    mode = m;
    screen = 'select';
  }

  async function start(setup) {
    await ensureArt();
    lastSetup = { ...setup, mode };
    result = null;
    matchPoint = false;
    engine.startLocal(lastSetup);
    screen = 'play';
  }

  function toTitle() {
    engine.stop();
    screen = 'title';
  }

  function onMatchEnd(match) {
    const winner = match.players[match.winner].character;
    const online = !!net.room;
    const mine = online ? net.seat : lastSetup.mode === 'cpu' ? 0 : null;
    const lost = mine != null && match.winner !== mine;
    result = {
      winner,
      title: lost ? `${winner.name} 獲勝…` : `${winner.name} 獲勝！`,
      line: pickLine(winner, 'win'),
      score: `${match.score[0]} − ${match.score[1]}`,
      unlocked: !online && lastSetup.mode === 'cpu' && !lost && unlockHidden(),
    };
    // 觀戰（沒有「自己」）也播勝利曲
    playJingle(lost ? 'lose' : 'win');
    if (!online) screen = 'result';
  }

  // 正在打球（方向鍵、手把拿來操作角色，不做選單操作）
  const inGame = $derived(
    (screen === 'play' && !roomPhase) || (view === 'online-playing' && !result && !onlineMenu),
  );

  // 觸控按鈕：哪幾組要顯示（觀戰、電腦對電腦時不用）
  const touchSlots = $derived.by(() => {
    if (!inGame || ui.input !== 'touch') return [];
    if (view === 'online-playing') return net.seat != null ? [0] : [];
    if (mode === 'versus') return [0, 1];
    return mode === 'cpu' ? [0] : [];
  });

  let selectScreen = $state();

  // Esc／手把 B
  function back() {
    if (view === 'online-playing') {
      if (onlineMenu) onlineMenu = false;
      return;
    }
    if (view === 'online-lobby') return; // 離開房間要按按鈕，避免誤觸
    if (screen === 'select') selectScreen?.goBack();
    else if (screen === 'pause') resume();
    else if (['solo', 'help', 'host', 'join'].includes(screen)) screen = 'title';
  }

  // Esc／P／手把 Start
  function pause() {
    if (view === 'online-playing') onlineMenu = true;
    else if (screen === 'play') {
      engine.pause();
      screen = 'pause';
    }
  }

  function onkeydown(e) {
    if (e.repeat || e.target.closest?.('input, textarea, select')) return;
    if (e.code === 'KeyM') toggleMute();
  }

  function resume() {
    engine.resume();
    screen = 'play';
  }
</script>

<svelte:window {onkeydown} />
<Controls {inGame} onback={back} onpause={pause} />

{#snippet resultCard(r)}
  <div class="result">
    <div class="ribbon">
      <img src="{asset('ui/result-banner.webp')}" alt="" />
      <span>{r.title}</span>
    </div>
    <div class="result-row">
      <div class="result-pic"><img src={r.winner.portraits.win} alt="" /></div>
      <div class="result-text">
        <p class="result-line">「{r.line}」</p>
        <p class="result-score">{r.score}</p>
        {#if r.unlocked}<p class="result-unlock">隱藏角色「阿翼」加入了！</p>{/if}
      </div>
    </div>
  </div>
{/snippet}

<div id="stage">
  <canvas bind:this={canvas}></canvas>

  {#if view === 'online-lobby'}
    <Lobby />
  {:else if view === 'online-playing'}
    {#if result}
      <Dialog title="比賽結束" wide>
        {@render resultCard(result)}
        {#if net.isHost}
          <Menu
            horizontal
            items={[
              { label: '再來一場', action: () => hostCmd('start'), primary: true },
              { label: '回大廳', action: () => hostCmd('reset') },
            ]}
          />
        {:else}
          <div class="hint-bar">等待房主決定下一步…</div>
        {/if}
      </Dialog>
    {:else if onlineMenu}
      <Dialog title="選單" subtitle="連線比賽不會暫停喔！">
        <Menu
          items={[
            { label: '回到比賽', action: () => (onlineMenu = false) },
            { label: '設定', action: openSettings },
            ...(net.isHost ? [{ label: '結束比賽、回大廳', action: () => hostCmd('reset') }] : []),
            { label: '離開房間', action: leave },
          ]}
        />
      </Dialog>
    {/if}
    {#if net.status === 'reconnecting'}
      <div class="net-banner">連線中斷，重新連線中…</div>
    {/if}
  {:else if screen === 'title'}
    <TitleScreen
      items={[
        { label: '單機遊玩', action: () => (screen = 'solo') },
        { label: '開設房間', action: () => (screen = 'host') },
        { label: '加入房間', action: () => (screen = 'join') },
        { label: '操作說明', action: () => (screen = 'help') },
        { label: '設定', action: openSettings },
      ]}
    />
  {:else if screen === 'solo'}
    <SoloScreen onpick={openSelect} onback={() => (screen = 'title')} />
  {:else if screen === 'host' || screen === 'join'}
    <!-- 換了分享連結就重新帶入房號 -->
    {#key joinCode}
      <RoomEntry
        page={screen}
        code={screen === 'join' ? joinCode : ''}
        onback={() => {
          joinCode = '';
          screen = 'title';
        }}
      />
    {/key}
  {:else if screen === 'help'}
    <HelpScreen onback={() => (screen = 'title')} />
  {:else if screen === 'select'}
    <SelectScreen bind:this={selectScreen} {mode} onstart={start} onback={() => (screen = 'solo')} />
  {:else if screen === 'pause'}
    <Dialog title="暫停">
      <Menu
        items={[
          { label: '繼續', action: resume },
          { label: '重新開始', action: () => start(lastSetup) },
          { label: '設定', action: openSettings },
          { label: '回標題', action: toTitle },
        ]}
      />
    </Dialog>
  {:else if screen === 'result' && result}
    <Dialog title="比賽結束" wide>
      {@render resultCard(result)}
      <Menu
        horizontal
        items={[
          { label: '再來一場', action: () => start(lastSetup), primary: true },
          { label: '換角色', action: () => openSelect(lastSetup.mode) },
          { label: '回標題', action: toTitle },
        ]}
      />
    </Dialog>
  {/if}

  {#if touchSlots.length}
    <TouchControls slots={touchSlots} onpause={pause} />
  {/if}

  <div class="toasts">
    {#each net.toasts as t (t.id)}
      <div class="toast" class:ok={t.kind === 'ok'}>{t.message}</div>
    {/each}
  </div>
  <SettingsDialog />
  {#if booting || waiting}
    <div class="loading" role="status">
      <img src={asset('ui/logo.webp')} alt="虛擬排球王" />
      <div class="bar"><i style:width="{percent}%"></i></div>
      <p>載入中… {percent}%</p>
    </div>
  {/if}
  <div class="rotate-hint">請把裝置轉成橫向 ↻</div>
</div>

<style>
  .loading {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3cqh;
    background: var(--navy-deep);
    color: var(--cream);
  }
  .loading img {
    width: 46cqw;
  }
  .loading .bar {
    width: 40cqw;
    height: 2.4cqh;
    border: 0.4cqh solid var(--cream);
    padding: 0.4cqh;
  }
  .loading .bar i {
    display: block;
    height: 100%;
    background: var(--gold);
    transition: width 0.15s;
  }
  .loading p {
    margin: 0;
    font-weight: 900;
    font-size: 2.6cqh;
    letter-spacing: 0.2em;
  }
  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6cqh;
  }
  .ribbon {
    position: relative;
    width: 56cqw;
  }
  .ribbon img {
    width: 100%;
    display: block;
  }
  .ribbon span {
    /* 文字對齊緞帶中間那條黃色底（各風格的圖不一樣高，見 app.css 的 --ribbon-y） */
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--ribbon-y, 0.333) * 100%);
    translate: 0 -50%;
    text-align: center;
    line-height: 1;
    font-size: 5.4cqh;
    font-weight: 900;
    letter-spacing: 0.12em;
    color: var(--navy);
  }
  .result-row {
    display: flex;
    gap: 3cqw;
    align-items: center;
  }
  .result-pic {
    width: 30cqh;
    height: 30cqh;
    border: 0.5cqh solid var(--navy);
    outline: 0.35cqh solid var(--gold);
    outline-offset: -1cqh;
    background: linear-gradient(#ffe9a8, #ffb3c8);
    overflow: hidden;
  }
  .result-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .result-text p {
    margin: 0;
  }
  .result-line {
    font-size: 3.4cqh;
    font-weight: 800;
    max-width: 40cqw;
  }
  .result-score {
    margin-top: 1.4cqh !important;
    font-size: 7cqh;
    font-weight: 900;
    color: var(--sea);
    letter-spacing: 0.1em;
  }
  .result-unlock {
    color: var(--accent);
    font-weight: 900;
    font-size: 2.8cqh;
  }
</style>
