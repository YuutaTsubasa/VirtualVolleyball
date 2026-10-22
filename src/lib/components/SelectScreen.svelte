<script>
  import { CHARACTERS, isUnlocked } from '../game/characters.js';
  import { play } from '../game/audio.js';

  // onstart({ characters, target, difficulty })、onback()
  let { mode, onstart, onback } = $props();

  const COLS = 4;
  const STEP_TITLES = {
    cpu: ['選擇你的角色', '選擇對手'],
    versus: ['1P 選擇角色', '2P 選擇角色'],
    watch: ['左邊的電腦', '右邊的電腦'],
  };

  let picks = $state([]);
  let cursor = $state(0);
  let difficulty = $state('normal');
  let target = $state(10);

  const current = $derived(CHARACTERS[cursor]);
  const step = $derived(picks.length);

  function pick(character = current) {
    if (!isUnlocked(character)) return;
    play('select');
    picks.push(character);
    if (picks.length === 2) {
      onstart({ characters: [...picks], target: Number(target), difficulty });
      return;
    }
    // 游標移到下一個角色，方便直接按確定
    let next = CHARACTERS.indexOf(character);
    do next = (next + 1) % CHARACTERS.length;
    while (!isUnlocked(CHARACTERS[next]));
    cursor = next;
  }

  function randomPick() {
    const pool = CHARACTERS.filter((c) => isUnlocked(c) && !picks.includes(c));
    pick(pool[Math.floor(Math.random() * pool.length)]);
  }

  function back() {
    play('select');
    if (picks.length) picks.pop();
    else onback();
  }

  function onkeydown(e) {
    if (e.repeat || e.target.tagName === 'SELECT') return;
    const n = CHARACTERS.length;
    const move = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -COLS, KeyW: -COLS, ArrowDown: COLS, KeyS: COLS }[e.code];
    if (move) {
      e.preventDefault();
      cursor = (cursor + move + n) % n;
      play('move');
    } else if (['Enter', 'Space', 'KeyF'].includes(e.code)) {
      e.preventDefault();
      pick();
    } else if (e.code === 'Escape' || e.code === 'Backspace') {
      back();
    } else if (e.code === 'KeyR') {
      randomPick();
    }
  }
</script>

<svelte:window {onkeydown} />

<section class="screen">
  <h2>{STEP_TITLES[mode][step]}</h2>
  <div class="select-body">
    <div class="roster">
      {#each CHARACTERS as c, i (c.id)}
        {@const open = isUnlocked(c)}
        {@const taken = picks.indexOf(c)}
        <button
          class="card"
          class:focus={i === cursor}
          class:locked={!open}
          class:taken={taken >= 0}
          data-tag={taken === 0 ? (mode === 'versus' ? '1P' : '已選') : ''}
          onmouseenter={() => (cursor = i)}
          onclick={() => pick(c)}
        >
          <img src={c.portraits.normal} alt="" />
          <span>{open ? c.name : '？？？'}</span>
        </button>
      {/each}
    </div>
    <aside class="detail">
      {#if isUnlocked(current)}
        <img src={current.portraits.happy} alt="" />
        <p class="name">{current.name}</p>
        <p class="intro">{current.intro}</p>
        {#each [['速度', 'speed'], ['跳躍', 'jump'], ['力量', 'power']] as [label, key] (key)}
          <div class="stat">
            {label}
            <div class="bar">
              {#each { length: 5 } as _, i (i)}<i class:on={i < current.stats[key]}></i>{/each}
            </div>
          </div>
        {/each}
      {:else}
        <p class="name">？？？</p>
        <p class="intro">在單人模式贏一場比賽就會出現。</p>
      {/if}
    </aside>
  </div>
  <div class="options">
    {#if mode !== 'versus'}
      <label>電腦強度
        <select bind:value={difficulty}>
          <option value="easy">簡單</option>
          <option value="normal">普通</option>
          <option value="hard">困難</option>
        </select>
      </label>
    {/if}
    <label>勝利分數
      <select bind:value={target}>
        <option value={5}>5 分</option>
        <option value={10}>10 分</option>
        <option value={15}>15 分</option>
      </select>
    </label>
    <button onclick={randomPick}>隨機</button>
    <button onclick={back}>返回</button>
  </div>
</section>
