<script>
  // 「虛擬排球王」標誌（docs/art/anime90-v1 的 ui/logo）
  import { asset } from '../art-style.svelte.js';
  let { size = 'small' } = $props();
</script>

<img class="logo {size}" src="{asset('ui/logo.webp')}" alt="虛擬排球王" draggable="false" />

<style>
  .logo {
    display: block;
    width: 100%;
    height: auto;
    filter: drop-shadow(0 0.6cqh 0.4cqh rgba(12, 29, 75, 0.35));
  }
  .logo.big {
    width: 62cqw;
  }
</style>
