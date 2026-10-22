<script>
  // 角色頭像格子（開房／加入／大廳換角色用）
  import { CHARACTERS, isUnlocked } from '../game/characters.js';

  let { value = $bindable(), onpick = () => {}, size = 9 } = $props();
  const list = CHARACTERS.filter(isUnlocked);
</script>

<div class="pgrid" style="--size: {size}cqh">
  {#each list as c (c.id)}
    <button
      type="button"
      class="card"
      class:focus={c.id === value}
      title={c.intro}
      onclick={() => {
        value = c.id;
        onpick(c.id);
      }}
    >
      <img src={c.portraits.normal} alt="" />
      <span>{c.name}</span>
    </button>
  {/each}
</div>

<style>
  .pgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, var(--size));
    gap: 0.8cqh;
  }
  .card {
    width: var(--size);
    height: var(--size);
  }
</style>
