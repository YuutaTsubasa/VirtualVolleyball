<script>
  // 操作說明：鍵盤／手把／觸控對照表與小技巧
  import { asset } from '../art-style.svelte.js';
  import ScreenFrame from './ScreenFrame.svelte';
  import { t } from '../i18n.svelte.js';
  import BackButton from './BackButton.svelte';
  import ControlHint from './ControlHint.svelte';

  let { onback } = $props();
  const ROWS = [
    ['移動', 'A / D', '← / →', '十字鍵／左搖桿', '左下搖桿'],
    ['跳躍', 'W', '↑', 'A 或 ↑', '「跳」或搖桿往上'],
    ['擊球', 'F／空白鍵', 'Enter／右 Shift', 'B／X／RB／RT', '「擊」'],
    ['暫停', 'Esc／P', 'Esc／P', 'Start', '上方暫停鈕'],
  ];
</script>

<ScreenFrame title={t('操作說明')} subtitle={t('鍵盤・手把・觸控都能玩')}>
  <div class="panel keys-panel">
    <div class="panel-head">{t('操作方式')}</div>
    <div class="panel-body">
      <table>
        <thead>
          <tr>
            <th></th>
            <th><img src="{asset('ui/icons/keyboard.webp')}" alt="" />{t('鍵盤 1P')}</th>
            <th><img src="{asset('ui/icons/keyboard.webp')}" alt="" />{t('鍵盤 2P')}</th>
            <th><img src="{asset('ui/icons/gamepad.webp')}" alt="" />{t('手把')}</th>
            <th><img src="{asset('ui/icons/touch.webp')}" alt="" />{t('觸控')}</th>
          </tr>
        </thead>
        <tbody>
          {#each ROWS as [label, ...cells] (label)}
            <tr>
              <th>{t(label)}</th>
              {#each cells as c, i (i)}<td>{t(c)}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="panel tips-panel">
    <div class="panel-head">{t('小技巧')}</div>
    <div class="panel-body">
      <ul>
        <li><b>{t('扣殺')}</b>{t('：跳起來在空中按住擊球，碰到球就扣殺。同時按 ↓ 重扣、往對面按更快；放開 ↑ 再按一次是高吊。')}</li>
        <li><b>{t('飛撲救球')}</b>{t('：在地上按住左右再按擊球。')}</li>
        <li>{t('對戰電腦和連線時，兩組鍵盤、任何手把都能操作；雙人同樂時第 1 支手把是 1P、第 2 支是 2P。')}</li>
        <li>{t('手把在文字欄位按 A 會跳出手把鍵盤。')}</li>
        <li>{t('對戰電腦贏一場，會有隱藏角色加入。')}</li>
      </ul>
    </div>
  </div>

  {#snippet foot()}
    <BackButton onclick={onback} />
    <span></span>
    <ControlHint />
  {/snippet}
</ScreenFrame>

<style>
  .keys-panel {
    flex: 1.6;
  }
  .tips-panel {
    flex: 1;
  }
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 0.8cqh;
    font-size: 2.4cqh;
    font-weight: 800;
  }
  thead th {
    font-size: 2.3cqh;
    white-space: nowrap;
  }
  thead img {
    display: block;
    width: 6cqh;
    margin: 0 auto 0.4cqh;
  }
  tbody th {
    background: var(--navy);
    color: var(--on-dark);
    padding: 1cqh 2.4cqh 1cqh 1.6cqh;
    white-space: nowrap;
    clip-path: polygon(0 0, 100% 0, calc(100% - 1cqh) 100%, 0 100%);
  }
  tbody td {
    background: var(--paper-white);
    border-top: 0.3cqh solid var(--navy);
    border-bottom: 0.3cqh solid var(--navy);
    text-align: center;
    padding: 1cqh 0.6cqh;
  }
  ul {
    margin: 0;
    padding-left: 2.6cqh;
    font-size: 2.3cqh;
    font-weight: 700;
    line-height: 1.55;
    display: flex;
    flex-direction: column;
    gap: 0.8cqh;
  }
</style>
