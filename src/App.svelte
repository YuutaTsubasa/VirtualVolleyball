<script>
  import { onMount } from 'svelte';
  import { createEngine } from './lib/engine.js';
  import { pickLine, unlockHidden } from './lib/game/characters.js';
  import { toggleMute } from './lib/game/audio.js';
  import { net, hostCmd, leave } from './lib/net.svelte.js';
  import Menu from './lib/components/Menu.svelte';
  import SelectScreen from './lib/components/SelectScreen.svelte';
  import RoomEntry from './lib/components/RoomEntry.svelte';
  import Lobby from './lib/components/Lobby.svelte';
  import Controls from './lib/components/Controls.svelte';
  import TouchControls from './lib/components/TouchControls.svelte';
  import { ui } from './lib/ui.svelte.js';

  // 單機：title | solo | help | select | play | pause | result | host | join
  // 連線中（net.room 有值）時畫面由房間狀態決定：大廳或比賽
  let screen = $state('title');
  let mode = $state('cpu'); // cpu | versus | watch
  let lastSetup = null;
  let result = $state(null);
  let onlineMenu = $state(false);
  let canvas;
  let engine = $state();

  onMount(() => {
    engine = createEngine(canvas, { onMatchEnd, onMatchStart: () => (result = null) });
    window.__vb = engine;
    // 單機比賽中切到背景、或手機轉成直的：自動暫停
    const portrait = matchMedia('(orientation: portrait) and (pointer: coarse)');
    const autoPause = () => {
      if ((document.hidden || portrait.matches) && screen === 'play' && !roomPhase) pause();
    };
    document.addEventListener('visibilitychange', autoPause);
    portrait.addEventListener('change', autoPause);
    return () => {
      engine.destroy();
      document.removeEventListener('visibilitychange', autoPause);
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

  function openSelect(m) {
    mode = m;
    screen = 'select';
  }

  function start(setup) {
    lastSetup = { ...setup, mode };
    result = null;
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
    else if (screen === 'solo' || screen === 'help' || screen === 'host' || screen === 'join') screen = 'title';
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
  <div class="result-card">
    <img class="result-portrait" src={r.winner.portraits.win} alt="" />
    <div>
      <p class="result-name">{r.title}</p>
      <p class="result-line">「{r.line}」</p>
      <p class="result-score">{r.score}</p>
      {#if r.unlocked}<p class="result-unlock">隱藏角色「阿翼」加入了！</p>{/if}
    </div>
  </div>
{/snippet}

<div id="stage">
  <canvas bind:this={canvas}></canvas>

  {#if view === 'online-lobby'}
    <Lobby />
  {:else if view === 'online-playing'}
    {#if result}
      <section class="screen">
        {@render resultCard(result)}
        {#if net.isHost}
          <Menu
            horizontal
            items={[
              { label: '再來一場', action: () => hostCmd('start') },
              { label: '回大廳', action: () => hostCmd('reset') },
            ]}
          />
        {:else}
          <p class="hint">等待房主決定下一步…</p>
        {/if}
      </section>
    {:else if onlineMenu}
      <section class="screen">
        <h2>選單</h2>
        <p class="hint">連線比賽不會暫停喔！</p>
        <Menu
          items={[
            { label: '回到比賽', action: () => (onlineMenu = false) },
            ...(net.isHost ? [{ label: '結束比賽、回大廳', action: () => hostCmd('reset') }] : []),
            { label: '離開房間', action: leave },
          ]}
        />
      </section>
    {/if}
    {#if net.status === 'reconnecting'}
      <div class="banner">連線中斷，重新連線中…</div>
    {/if}
  {:else if screen === 'title'}
    <section class="screen">
      <h1 class="logo"><small>虛擬台麻館</small>沙灘排球</h1>
      <Menu
        items={[
          { label: '單機遊玩', action: () => (screen = 'solo') },
          { label: '開設房間', action: () => (screen = 'host') },
          { label: '加入房間', action: () => (screen = 'join') },
          { label: '操作說明', action: () => (screen = 'help') },
        ]}
      />
      <p class="hint">{ui.input === 'pad' ? '十字鍵選擇　A 確定　B 返回' : ui.input === 'touch' ? '點選開始' : '↑↓ 選擇　Enter 確定　Esc 返回　M 靜音'}</p>
    </section>
  {:else if screen === 'solo'}
    <section class="screen">
      <h2>單機遊玩</h2>
      <Menu
        items={[
          { label: '對戰電腦', action: () => openSelect('cpu') },
          { label: '雙人同樂（同一台電腦）', action: () => openSelect('versus') },
          { label: '觀戰（電腦對電腦）', action: () => openSelect('watch') },
          { label: '返回', action: () => (screen = 'title') },
        ]}
      />
    </section>
  {:else if screen === 'host' || screen === 'join'}
    <RoomEntry page={screen} onback={() => (screen = 'title')} />
  {:else if screen === 'help'}
    <section class="screen">
      <h2>操作說明</h2>
      <table class="keys">
        <tbody>
          <tr><th></th><th>鍵盤 1P</th><th>鍵盤 2P</th><th>手把</th><th>觸控</th></tr>
          <tr><td>移動</td><td>A / D</td><td>← / →</td><td>十字鍵／左搖桿</td><td>左下搖桿</td></tr>
          <tr><td>跳躍</td><td>W</td><td>↑</td><td>A 或 ↑</td><td>「跳」或搖桿往上推</td></tr>
          <tr><td>擊球</td><td>F／空白鍵</td><td>Enter／右 Shift</td><td>B／X／RB／RT</td><td>「擊」</td></tr>
          <tr><td>暫停</td><td colspan="2">Esc／P</td><td>Start</td><td>上方 ❚❚</td></tr>
        </tbody>
      </table>
      <ul class="tips">
        <li><b>扣殺</b>：跳起來在空中按擊球。同時按 ↑ 是高吊球、按 ↓ 是重扣、往對面按會更快。</li>
        <li><b>飛撲救球</b>：在地上按住左右再按擊球。</li>
        <li>對戰電腦和連線時，WASD、方向鍵、任何一支手把都能操作；雙人同樂時第一支手把是 1P、第二支是 2P。</li>
        <li>選單可以用滑鼠、觸控、方向鍵＋Enter／Esc，或手把十字鍵＋A／B 操作；手把在文字欄位按 A 會跳出手把鍵盤。</li>
      </ul>
      <Menu items={[{ label: '返回', action: () => (screen = 'title') }]} />
    </section>
  {:else if screen === 'select'}
    <SelectScreen bind:this={selectScreen} {mode} onstart={start} onback={() => (screen = 'solo')} />
  {:else if screen === 'pause'}
    <section class="screen">
      <h2>暫停</h2>
      <Menu
        items={[
          { label: '繼續', action: resume },
          { label: '重新開始', action: () => start(lastSetup) },
          { label: '回標題', action: toTitle },
        ]}
      />
    </section>
  {:else if screen === 'result' && result}
    <section class="screen">
      {@render resultCard(result)}
      <Menu
        horizontal
        items={[
          { label: '再來一場', action: () => start(lastSetup) },
          { label: '換角色', action: () => openSelect(lastSetup.mode) },
          { label: '回標題', action: toTitle },
        ]}
      />
    </section>
  {/if}

  {#if touchSlots.length}
    <TouchControls slots={touchSlots} onpause={pause} />
  {/if}

  <div class="toasts">
    {#each net.toasts as t (t.id)}
      <div class="toast" class:ok={t.kind === 'ok'}>{t.message}</div>
    {/each}
  </div>
  <div class="rotate-hint">請把裝置轉成橫向 ↻</div>
</div>
