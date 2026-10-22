<script>
  // 標題畫面：標誌、主選單，左右各一位角色（每次隨機）
  import { asset } from '../art-style.svelte.js';
  import { CHARACTERS } from '../game/characters.js';
  import { toggleMute, isMuted } from '../game/audio.js';
  import Logo from './Logo.svelte';
  import Menu from './Menu.svelte';
  import SpritePose from './SpritePose.svelte';
  import ControlHint from './ControlHint.svelte';

  let { items } = $props();

  const pool = CHARACTERS.filter((c) => !c.hidden);
  const leftIndex = Math.floor(Math.random() * pool.length);
  // 右邊挑一位不一樣的
  const left = pool[leftIndex];
  const right = pool[(leftIndex + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length];

  // 有標題主視覺（ui/title-scene）就用插圖，沒有就用球場＋左右兩位角色的動作圖
  const scene = $derived(asset('ui/title-scene.webp'));
  let muted = $state(isMuted());
</script>

<section class="screen title">
  {#if scene}
    <img class="menu-bg" src={scene} alt="" />
  {:else}
    <img class="menu-bg" src="{asset('game/court.webp')}" alt="" />
    <div class="hero left"><SpritePose character={left} pose="spike" size="64cqh" /></div>
    <div class="hero right"><SpritePose character={right} pose="idle" size="58cqh" flip /></div>
  {/if}

  <div class="center">
    <Logo size="big" />
    <Menu {items} width="36cqw" />
  </div>

  <button
    type="button"
    class="sound"
    aria-label={muted ? '開啟音效' : '關閉音效'}
    onclick={() => (muted = toggleMute())}
  >
    <img src="{asset(`ui/icons/${muted ? 'sound-off' : 'sound-on'}.webp`)}" alt="" />
  </button>
  <div class="foot"><ControlHint /></div>
</section>

<style>
  .title {
    justify-content: flex-start;
  }
  .center {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3cqh;
    margin-top: 6cqh;
  }
  .hero {
    position: absolute;
    bottom: 4cqh;
    filter: drop-shadow(0 1cqh 0.6cqh rgba(80, 50, 20, 0.35));
  }
  .hero.left {
    left: -2cqw;
    animation: float 2.4s ease-in-out infinite alternate;
  }
  .hero.right {
    right: 1cqw;
  }
  .sound {
    position: absolute;
    bottom: 2.4cqh;
    right: 2.4cqw;
    width: 9cqh;
    height: 9cqh;
    padding: 0.8cqh;
    border: 0.45cqh solid var(--navy);
    border-radius: 50%;
    background: var(--cream);
  }
  .sound img {
    width: 100%;
    height: 100%;
  }
  .foot {
    position: absolute;
    bottom: 2.6cqh;
    left: 50%;
    translate: -50% 0;
  }
  @keyframes float {
    to {
      transform: translateY(-2cqh);
    }
  }
</style>
