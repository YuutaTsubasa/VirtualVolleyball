<script>
  import { onMount } from 'svelte';
  import { createEngine } from './lib/engine.js';
  import { pickLine, unlockHidden } from './lib/game/characters.js';
  import { toggleMute } from './lib/game/audio.js';
  import Menu from './lib/components/Menu.svelte';
  import SelectScreen from './lib/components/SelectScreen.svelte';

  // title | help | select | play | pause | result
  let screen = $state('title');
  let mode = $state('cpu'); // cpu | versus | watch
  let lastSetup = null;
  let result = $state(null);
  let canvas;
  let engine;

  onMount(() => {
    engine = createEngine(canvas, { onMatchEnd });
    window.__vb = engine;
    return () => engine.destroy();
  });

  function openSelect(m) {
    mode = m;
    screen = 'select';
  }

  function start(setup) {
    lastSetup = { ...setup, mode };
    engine.startMatch(lastSetup);
    screen = 'play';
  }

  function toTitle() {
    engine.stop();
    screen = 'title';
  }

  function onMatchEnd(match) {
    const winner = match.players[match.winner].character;
    const humanLost = lastSetup.mode === 'cpu' && match.winner === 1;
    const humanWon = lastSetup.mode === 'cpu' && match.winner === 0;
    result = {
      winner,
      title: humanLost ? `${winner.name} 獲勝…` : `${winner.name} 獲勝！`,
      line: pickLine(winner, 'win'),
      score: `${match.score[0]} − ${match.score[1]}`,
      unlocked: humanWon && unlockHidden(),
    };
    screen = 'result';
  }

  function onkeydown(e) {
    if (e.repeat) return;
    if (e.code === 'KeyM') toggleMute();
    if (screen === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) {
      engine.pause();
      screen = 'pause';
    } else if (screen === 'pause' && e.code === 'Escape') {
      resume();
    } else if (screen === 'help' && e.code === 'Escape') {
      screen = 'title';
    }
  }

  function resume() {
    engine.resume();
    screen = 'play';
  }
</script>

<svelte:window {onkeydown} />

<div id="stage">
  <canvas bind:this={canvas}></canvas>

  {#if screen === 'title'}
    <section class="screen">
      <h1 class="logo"><small>虛擬台麻館</small>沙灘排球</h1>
      <Menu
        items={[
          { label: '單人對戰電腦', action: () => openSelect('cpu') },
          { label: '雙人對戰', action: () => openSelect('versus') },
          { label: '觀戰（電腦對電腦）', action: () => openSelect('watch') },
          { label: '操作說明', action: () => (screen = 'help') },
        ]}
      />
      <p class="hint">↑↓ 選擇　Enter 確定　M 靜音</p>
    </section>
  {:else if screen === 'help'}
    <section class="screen">
      <h2>操作說明</h2>
      <table class="keys">
        <tbody>
          <tr><th></th><th>1P（左）</th><th>2P（右）</th></tr>
          <tr><td>移動</td><td>A / D</td><td>← / →</td></tr>
          <tr><td>跳躍</td><td>W</td><td>↑</td></tr>
          <tr><td>擊球</td><td>F 或 空白鍵</td><td>Enter 或 右 Shift</td></tr>
        </tbody>
      </table>
      <ul class="tips">
        <li>球碰到身體就會自動彈出去，角度看球打在身上的位置。</li>
        <li><b>扣殺</b>：跳起來在空中按「擊球」。同時按 ↑ 是高吊球、按 ↓ 是重扣、往對面按會更快。</li>
        <li><b>飛撲救球</b>：在地上按住左右再按「擊球」。</li>
        <li>單人模式時，1P 也可以用方向鍵＋Enter。手把：A 跳、B/X 擊球。</li>
        <li>Esc 或 P 暫停。單人模式贏一場會解鎖隱藏角色。</li>
      </ul>
      <Menu items={[{ label: '返回', action: () => (screen = 'title') }]} />
    </section>
  {:else if screen === 'select'}
    <SelectScreen {mode} onstart={start} onback={() => (screen = 'title')} />
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
      <div class="result-card">
        <img class="result-portrait" src={result.winner.portraits.win} alt="" />
        <div>
          <p class="result-name">{result.title}</p>
          <p class="result-line">「{result.line}」</p>
          <p class="result-score">{result.score}</p>
          {#if result.unlocked}<p class="result-unlock">隱藏角色「阿翼」加入了！</p>{/if}
        </div>
      </div>
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
</div>
