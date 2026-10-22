<script>
  // 畫面風格：六種畫風，點了馬上換（介面、角色、球場一起換）
  import { onMount } from 'svelte';
  import { ART_STYLES, artStyle, setArtStyle, asset } from '../art-style.svelte.js';
  import { styleProgress } from '../style-assets.js';
  import { play } from '../game/audio.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import BackButton from './BackButton.svelte';
  import ControlHint from './ControlHint.svelte';

  let { onback } = $props();
  let list;

  onMount(() => list.querySelector('.selected')?.focus({ preventScroll: true }));

  function choose(id) {
    play('select');
    setArtStyle(id);
  }
</script>

<ScreenFrame title="畫面風格" subtitle="介面、角色、球場一起換">
  <div class="styles" bind:this={list}>
    {#each ART_STYLES as s (s.id)}
      {@const progress = styleProgress(s.id)}
      <button type="button" class="style-card panel" class:selected={artStyle.id === s.id} onclick={() => choose(s.id)}>
        <div class="pic" class:pixel={s.pixelated}>
          <img src={asset('characters/xiaochun/happy.webp', s.id)} alt="" class:pending={progress === 0} />
          {#if progress < 1}<span class="wip">製作中{progress > 0 ? ` ${Math.round(progress * 100)}%` : ''}</span>{/if}
        </div>
        <span class="txt">
          <b>{s.name}</b>
          <small>{s.description}</small>
        </span>
      </button>
    {/each}
  </div>

  {#snippet foot()}
    <BackButton onclick={onback} />
    <div class="hint-bar">還沒交圖的部分會先用 90 年代版</div>
    <ControlHint />
  {/snippet}
</ScreenFrame>

<style>
  .styles {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2cqh 2cqw;
  }
  .style-card {
    position: relative;
    flex-direction: row;
    align-items: center;
    gap: 1.6cqh;
    padding: 1.4cqh;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: var(--navy);
  }
  .style-card.selected {
    border-color: var(--gold-deep);
    box-shadow: inset 0 0 0 0.45cqh var(--gold), 0 0.6cqh 0 rgba(12, 29, 75, 0.35);
  }
  .style-card.selected::after {
    content: '✔';
    position: absolute;
    top: 0.6cqh;
    right: 1cqh;
    font-size: 3cqh;
    font-weight: 900;
    color: var(--gold-deep);
  }
  .pic {
    position: relative;
    width: 17cqh;
    height: 17cqh;
    flex: none;
    border: 0.4cqh solid var(--navy);
    background: linear-gradient(#5aa9ec, #9fd3ff);
    overflow: hidden;
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pic.pixel img {
    image-rendering: pixelated;
  }
  .pic img.pending {
    filter: grayscale(1) opacity(0.5);
  }
  .wip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--navy);
    color: var(--on-dark);
    font-size: 1.8cqh;
    font-weight: 900;
    text-align: center;
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6cqh;
  }
  b {
    display: block;
    white-space: nowrap;
    font-size: 3.6cqh;
    font-weight: 900;
  }
  small {
    display: block;
    font-size: 2cqh;
    font-weight: 800;
    color: var(--navy-soft);
  }
</style>
