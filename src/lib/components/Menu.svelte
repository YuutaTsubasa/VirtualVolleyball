<script>
  // 可以用滑鼠或鍵盤（↑↓ / ←→、Enter）操作的按鈕列
  import { play } from '../game/audio.js';

  let { items, horizontal = false } = $props();
  let focus = $state(0);

  function choose(item) {
    play('select');
    item.action();
  }

  function onkeydown(e) {
    if (e.repeat) return;
    const prev = horizontal ? ['ArrowLeft', 'KeyA'] : ['ArrowUp', 'KeyW'];
    const next = horizontal ? ['ArrowRight', 'KeyD'] : ['ArrowDown', 'KeyS'];
    if (prev.includes(e.code)) {
      focus = (focus - 1 + items.length) % items.length;
      play('move');
    } else if (next.includes(e.code)) {
      focus = (focus + 1) % items.length;
      play('move');
    } else if (['Enter', 'Space', 'KeyF'].includes(e.code)) {
      e.preventDefault();
      choose(items[focus]);
    }
  }
</script>

<svelte:window {onkeydown} />

<nav class="menu" class:row={horizontal}>
  {#each items as item, i (item.label)}
    <button class:focus={i === focus} onmouseenter={() => (focus = i)} onclick={() => choose(item)}>
      {item.label}
    </button>
  {/each}
</nav>
