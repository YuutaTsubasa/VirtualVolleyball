<script>
  // 左下角的「◀ 返回」
  import { play } from '../game/audio.js';

  let { label = '返回', onclick } = $props();
</script>

<button
  type="button"
  class="vbtn back plain"
  onclick={() => {
    play('select');
    onclick();
  }}
><span class="tri"></span>{label}</button>
