<script>
  // 單機遊玩：選模式（對戰電腦／雙人同樂／電腦觀戰），右邊是預覽
  import { asset } from '../art-style.svelte.js';
  import { onMount } from 'svelte';
  import { CHARACTERS } from '../game/characters.js';
  import { play } from '../game/audio.js';
  import { ui } from '../ui.svelte.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import SpritePose from './SpritePose.svelte';
  import BackButton from './BackButton.svelte';
  import ControlHint from './ControlHint.svelte';
  import { t } from '../i18n.svelte.js';

  let { onpick, onback } = $props();

  const MODES = [
    { id: 'cpu', title: '對戰電腦', sub: '一人挑戰電腦對手', tag: '1P vs CPU', tags: ['1P', 'CPU'], caption: '選擇角色，開始挑戰！' },
    { id: 'versus', title: '雙人同樂', sub: '同一台電腦，兩人對戰', tag: '1P vs 2P', tags: ['1P', '2P'], caption: '鍵盤、手把、平板都能兩人玩！' },
    { id: 'watch', title: '電腦觀戰', sub: '觀看電腦互相對戰', tag: 'CPU vs CPU', tags: ['CPU', 'CPU'], caption: '看看高手怎麼打！' },
  ];

  let current = $state(0);
  const mode = $derived(MODES[current]);
  // 有模式預覽插圖（ui/mode-*）就用插圖，沒有就用兩位角色的動作圖
  const modeArt = $derived(asset(`ui/mode-${mode.id}.webp`));
  // 觀戰圖示：有畫好的就用（各風格自己的，沒有就用 90 年代版），都沒有時用程式畫的電視
  const watchIcon = $derived(asset('ui/icons/watch.webp') ?? asset('ui/icons/watch.webp', 'anime90'));

  // 預覽用的兩位角色：每次進來隨機挑
  const pool = CHARACTERS.filter((c) => !c.hidden);
  const pickTwo = () => {
    const a = pool[Math.floor(Math.random() * pool.length)];
    let b = pool[Math.floor(Math.random() * pool.length)];
    if (b === a) b = pool[(pool.indexOf(a) + 4) % pool.length];
    return [a, b];
  };
  const pairs = MODES.map(pickTwo);

  let list;
  onMount(() => list.querySelector('button')?.focus({ preventScroll: true }));

  function choose(i) {
    play('select');
    onpick(MODES[i].id);
  }
</script>

{#snippet icon(id)}
  {#if id === 'cpu'}
    <img src="{asset('ui/icons/gamepad.webp')}" alt="" />
  {:else if id === 'versus'}
    <span class="pair"><img src="{asset('ui/icons/gamepad.webp')}" alt="" /><img src="{asset('ui/icons/gamepad.webp')}" alt="" /></span>
  {:else if watchIcon}
    <img src={watchIcon} alt="" />
  {:else}
    <svg viewBox="0 0 64 52" aria-hidden="true">
      <rect x="3" y="3" width="58" height="36" rx="3" fill="#fbf4e0" stroke="#142a63" stroke-width="5" />
      <circle cx="32" cy="17" r="6" fill="#ffd43b" stroke="#142a63" stroke-width="2.5" />
      <path d="M16 33l6-10 5 10M48 33l-6-10-5 10" stroke="#142a63" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <path d="M24 49h16M32 39v10" stroke="#142a63" stroke-width="5" stroke-linecap="round" />
    </svg>
  {/if}
{/snippet}

<ScreenFrame title={t('單機遊玩')} subtitle={t('選擇遊玩模式')}>
  <div class="modes" bind:this={list}>
    {#each MODES as m, i (m.id)}
      <button
        type="button"
        class="mode vbtn plain"
        class:active={i === current}
        onfocus={() => {
          current = i;
          if (ui.input === 'key' || ui.input === 'pad') play('move');
        }}
        onmouseenter={() => ui.input === 'pointer' && (current = i)}
        onclick={() => (ui.input === 'touch' && current !== i ? (current = i) : choose(i))}
      >
        <span class="icon">{@render icon(m.id)}</span>
        <span class="text"><b>{t(m.title)}</b><small>{t(m.sub)}</small></span>
        <span class="tag">{m.tag}</span>
      </button>
    {/each}
  </div>

  <div class="preview panel">
    <div class="stage-art" style="background-image: url({asset('game/court.webp')})">
      {#key current}
        {#if modeArt}
          <img class="mode-art" src={modeArt} alt="" />
        {:else}
        <div class="side left">
          <span class="who">{mode.tags[0]}</span>
          <SpritePose character={pairs[current][0]} size="34cqh" />
        </div>
        <img class="ball" src="{asset('game/ball.webp')}" alt="" />
        <span class="vs">VS</span>
        <div class="side right">
          <span class="who cpu" class:p2={mode.tags[1] === '2P'}>{mode.tags[1]}</span>
          <SpritePose character={pairs[current][1]} size="34cqh" flip />
        </div>
        {/if}
      {/key}
    </div>
    <div class="caption">{t(mode.caption)}</div>
  </div>

  {#snippet foot()}
    <BackButton onclick={onback} />
    <span></span>
    <ControlHint />
  {/snippet}
</ScreenFrame>

<style>
  .modes {
    flex: 1.15;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.2cqh;
  }
  .mode {
    --cut: 2.4cqh;
    justify-content: flex-start;
    min-height: 15cqh;
    padding: 1cqh 6cqh 1cqh 5cqh;
    letter-spacing: 0;
    text-indent: 0;
    gap: 3cqh;
    text-align: left;
  }
  .icon {
    width: 13cqh;
    display: flex;
    justify-content: center;
  }
  .icon img {
    width: 11cqh;
  }
  .icon svg {
    width: 10cqh;
  }
  .pair {
    display: flex;
  }
  .pair img {
    width: 7.5cqh;
  }
  .pair img + img {
    margin-left: -1.6cqh;
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6cqh;
  }
  .text b {
    font-size: 5.6cqh;
    letter-spacing: 0.1em;
    line-height: 1;
  }
  .text small {
    font-size: 2.4cqh;
    font-weight: 800;
  }
  .tag {
    font-size: 2.6cqh;
    font-weight: 900;
    border-left: 0.35cqh solid var(--navy);
    padding-left: 2.4cqh;
    white-space: nowrap;
  }

  .preview {
    flex: 1;
    padding: 1.2cqh;
    gap: 1.2cqh;
  }
  .stage-art {
    position: relative;
    flex: 1;
    border: 0.35cqh solid var(--navy);
    background-position: center 70%;
    background-size: cover;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 0 3cqh 1cqh;
  }
  .side {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: pop 0.25s ease-out;
  }
  .who {
    background: var(--navy);
    color: var(--on-dark);
    font-weight: 900;
    font-size: 3cqh;
    padding: 0.2cqh 3cqh;
    border: 0.35cqh solid var(--cream);
    border-radius: 1cqh;
    margin-bottom: -1cqh;
    z-index: 1;
  }
  .who.cpu {
    background: #1b6b5a;
  }
  .who.p2 {
    background: var(--accent);
  }
  .vs {
    position: absolute;
    left: 50%;
    top: 52%;
    translate: -50% -50%;
    font-size: 9cqh;
    font-weight: 900;
    font-style: italic;
    color: var(--gold);
    -webkit-text-stroke: 0.6cqh var(--navy);
    paint-order: stroke fill;
  }
  .ball {
    position: absolute;
    left: 50%;
    top: 14%;
    width: 11cqh;
    translate: -50% 0;
    animation: bob 1.2s ease-in-out infinite alternate;
  }
  .mode-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: pop 0.25s ease-out;
  }
  .caption {
    background: var(--cream);
    border: 0.35cqh solid var(--navy);
    text-align: center;
    font-weight: 900;
    font-size: 3.2cqh;
    letter-spacing: 0.15em;
    padding: 0.8cqh;
  }
  @keyframes bob {
    to {
      translate: -50% 1.6cqh;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(1.6cqh);
    }
  }
</style>
