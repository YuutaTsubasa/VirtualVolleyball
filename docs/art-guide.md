# 美術素材

## 目前狀態

90 年代（anime90）風格已經全部到位，來源是「虛擬排球王 90 年代圖素包 v1」，說明、清單與提示詞保存在 [art/anime90-v1/](art/anime90-v1/)。

| 用途 | 遊戲裡的檔案 | 圖素包原檔 |
| --- | --- | --- |
| 角色半身像（5 表情） | `public/characters/<id>/<表情>.webp`（512） | `characters/<id>/portraits/` |
| 角色動作圖集（8 動作） | `public/sprites/<id>.webp`（4096×512，每格 512） | `characters/<id>/sprites/`（用 512 原圖重新排） |
| 球場、球網、球 | `public/game/` | `environment/` |
| 特效 | `public/effects/` | `effects/` |
| 標誌、比分底板、結果緞帶、頭像框 | `public/ui/` | `ui/` |
| 圖示（鍵盤、手把、觸控、鎖、暫停、音量…） | `public/ui/icons/`（128） | `ui/icons/`、`ui/icons-extra/` |

圖素包裡四位新男角的資料夾名稱對到台麻（origin/master）的正式角色：

| 圖素包 | 角色 |
| --- | --- |
| 01-wolf | 蒼牙 `cangya` |
| 02-gambler | 金爺 `jinye` |
| 03-prince | 雷歐 `leo` |
| 04-adventurer | 阿烈 `alie` |

全部轉成 WebP，約 7 MB。

## 規格（之後補其他風格時照這個）

- **動作圖**：`idle` `run1` `run2` `jump` `spike` `dive` `win` `lose` 8 張，512×512 透明 PNG，**面向右**，腳底在 (256, 496)。遊戲右邊的角色會自動左右翻轉。
- **半身像**：`normal` `happy` `surprised` `sad` `win` 5 張，512×512 透明 PNG。
- **球場**：1920×1080，下方約 36% 是沙地；遊戲的地面線在畫面 87% 的高度。球網、球、角色都另外疊上去，球場圖本身不要畫網。
- **球網**：側視、透明背景；白帶與網柱底部在圖裡的 y 座標（90 年代版 190／1016）記在 `src/lib/style-assets.js` 的 `styleConfig`，各風格可以在 `style-assets.json` 覆寫。
- **比分底板**：兩格數字的中心（90 年代版是寬度 27.75%／73.25%、高度 49%）同樣在 `styleConfig`，各風格可以覆寫。

## 六種畫風

標題的「畫面風格」可以切換 90 年代、PC-98、MS-DOS、台式印刷、Game Boy、動漫電影（ID 跟 TaiwanMahjong 一樣）。

- 90 年代以外的圖放在 `public/styles/<風格>/`，結構跟上面一樣。
- 每種風格實際有哪些檔案、畫面設定（比分數字位置、球網座標、像素風格的內部解析度）記在 `src/lib/style-assets.json`；沒有的圖會用 90 年代版。
- 介面配色在 `src/app.css` 最後的 `:root[data-style='…']`。
- 圖素包由 ChatGPT 交到 `art-inbox/`（規格見 `art-inbox/README.md`），用這個指令接進來：

```bash
python -P scripts/import-style.py art-inbox/pc98-assets.zip pc98 --config '{"canvasScale": 0.5}'
```

另外 90 年代版有四張選用插圖：`ui/title-scene`（標題主視覺）與 `ui/mode-cpu`／`mode-versus`／`mode-watch`（單機模式預覽），來源在 `docs/art/anime90-ui-v1/`。沒有這些圖的風格會改用角色動作圖拼。
