<script>
  // 單機選角：先選 1P（或左邊）再選對手（或右邊），右邊看角色資料、調比賽設定
  import { onMount } from 'svelte';
  import { CHARACTERS, isUnlocked } from '../game/characters.js';
  import { play } from '../game/audio.js';
  import { ui } from '../ui.svelte.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import BackButton from './BackButton.svelte';
  import ControlHint from './ControlHint.svelte';
  import CharacterGrid from './CharacterGrid.svelte';
  import CharacterDetail from './CharacterDetail.svelte';

  // onstart({ characters, target, difficulty })、onback()
  let { mode, onstart, onback } = $props();

  const STEPS = {
    cpu: [['選擇角色', '1P vs CPU・選你的角色'], ['選擇對手', '1P vs CPU・選電腦的角色']],
    versus: [['1P 選角', '1P vs 2P・左邊的角色'], ['2P 選角', '1P vs 2P・右邊的角色']],
    watch: [['左邊電腦', 'CPU vs CPU・左邊的角色'], ['右邊電腦', 'CPU vs CPU・右邊的角色']],
  };

  let picks = $state([]);
  let cursor = $state(4); // 預設小春
  let difficulty = $state('normal');
  let target = $state(10);
  let grid;
  let startButton = $state();

  const current = $derived(CHARACTERS[cursor]);
  // 第一步選 1P（或左邊），第二步選對手（或右邊）；選完對手不會馬上開始，按「開始比賽」才開始
  const step = $derived(Math.min(picks.length, 1));
  const TAGS = { cpu: ['1P', 'CPU'], versus: ['1P', '2P'], watch: ['左', '右'] };
  const tags = $derived(Object.fromEntries(picks.map((c, i) => [c.id, TAGS[mode][i]])));

  onMount(() => grid.focusIndex(cursor));

  function pick(character = current) {
    if (!isUnlocked(character)) return play('deny');
    play('pick');
    if (picks.length >= 1) {
      // 第二步：只是選定對手（可以一直換），焦點移到「開始比賽」
      picks[1] = character;
      if (ui.input !== 'touch') startButton?.focus({ preventScroll: true });
      return;
    }
    picks.push(character);
    // 游標移到下一個角色，方便直接按確定
    let next = CHARACTERS.indexOf(character);
    do next = (next + 1) % CHARACTERS.length;
    while (!isUnlocked(CHARACTERS[next]));
    cursor = next;
    if (ui.input !== 'touch') grid.focusIndex(next);
  }

  // 「決定」（第一步）／「開始比賽」（第二步；還沒選對手就用游標所在的角色）
  function confirm() {
    if (step === 0) return pick();
    const opponent = picks[1] ?? current;
    if (!isUnlocked(opponent)) return play('deny');
    play('select');
    onstart({ characters: [picks[0], opponent], target: Number(target), difficulty });
  }

  function randomPick() {
    const pool = CHARACTERS.filter((c) => isUnlocked(c) && !picks.includes(c));
    pick(pool[Math.floor(Math.random() * pool.length)]);
  }

  function back() {
    play('select');
    if (picks.length) picks.pop(); // 先取消對手，再取消自己的角色
    else onback();
  }

  // Esc／手把 B（由 App 透過 Controls 呼叫）
  export function goBack() {
    back();
  }
</script>

<ScreenFrame title={STEPS[mode][step][0]} subtitle={STEPS[mode][step][1]}>
  <div class="panel grow">
    <div class="panel-head">角色一覽</div>
    <div class="panel-body">
      <CharacterGrid bind:this={grid} bind:cursor {tags} onpick={(c) => pick(c)} />
    </div>
  </div>

  <div class="side">
    <CharacterDetail character={current} />
    <div class="panel">
      <div class="panel-head">比賽設定</div>
      <div class="panel-body settings">
        {#if mode !== 'versus'}
          <label class="field">電腦強度
            <select class="vsel" bind:value={difficulty}>
              <option value="easy">簡單</option>
              <option value="normal">普通</option>
              <option value="hard">困難</option>
            </select>
          </label>
        {/if}
        <label class="field">勝利分數
          <select class="vsel" bind:value={target}>
            <option value={5}>5 分</option>
            <option value={10}>10 分</option>
            <option value={15}>15 分</option>
          </select>
        </label>
        <button type="button" class="vbtn small" onclick={randomPick}>隨機</button>
      </div>
    </div>
  </div>

  {#snippet foot()}
    <BackButton onclick={back} />
    <ControlHint extra={ui.input === 'touch' ? '點一下看資料，再點一下決定' : ''} />
    <button
      type="button"
      class="vbtn primary"
      bind:this={startButton}
      disabled={step === 0 ? !isUnlocked(current) : !isUnlocked(picks[1] ?? current)}
      onclick={confirm}
    >
      {step === 1 ? '開始比賽' : '決定'}
    </button>
  {/snippet}
</ScreenFrame>

<style>
  .grow {
    flex: 1.5;
  }
  .side {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.6cqh;
    min-width: 0;
  }
  .settings {
    flex-direction: row;
    align-items: flex-end;
    gap: 2cqw;
  }
  .settings .field {
    flex: 1;
  }
</style>
