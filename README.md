# 🏐 虛擬台麻館沙灘排球

《皮卡丘打排球》風格的 1 對 1 排球遊戲，球員是[虛擬台麻館](../TaiwanMahjong)的角色們。Tauri v2 + Svelte 5，遊戲畫面用 Canvas 畫。

## 開發

需求：Node 18+、Rust 1.89+（跟 TaiwanMahjong 相同）。

```bash
npm install
```

桌面 App：

```bash
npm run tauri dev
```

只開網頁版（瀏覽器打開 http://localhost:1421）：

```bash
npm run dev
```

打包安裝檔：

```bash
npm run tauri build
```

## 怎麼玩

| | 1P（左） | 2P（右） |
| --- | --- | --- |
| 移動 | A / D | ← / → |
| 跳躍 | W | ↑ |
| 擊球 | F 或 空白鍵 | Enter 或 右 Shift |

- 球碰到身體會自動彈出去。
- **扣殺**：跳起來在空中按擊球；同時按 ↑ 高吊、↓ 重扣、往對面按更快。
- **飛撲**：在地上按住左右再按擊球。
- 模式：單人對電腦（簡單／普通／困難）、雙人同機、電腦對電腦觀戰。支援手把。
- 單人模式贏一場會解鎖隱藏角色「阿翼」。

## 程式結構

```
src/
  App.svelte                 畫面切換：標題、說明、選角、暫停、結果
  lib/components/            Svelte 元件（Menu、SelectScreen）
  lib/engine.js              主迴圈：固定 60fps 模擬＋繪圖，給 UI 控制
  lib/game/game.js           物理與規則（純邏輯，不碰畫面）
  lib/game/ai.js             電腦玩家：預測落點、跑位、起跳扣殺
  lib/game/render.js         Canvas 繪圖：背景、角色、球、特效、計分板
  lib/game/input.js          鍵盤＋手把
  lib/game/audio.js          WebAudio 合成音效
  lib/game/characters.js     角色資料：能力值、台詞、圖檔
src-tauri/                   Tauri v2 外殼（目前只開視窗）
public/characters/           角色頭像（從 TaiwanMahjong 複製，縮成 384px）
docs/art-guide.md            要請 ChatGPT 畫的圖與提示詞
scripts/make_sheet.py        把單張姿勢圖組成 sprite sheet
```

`game.js` 是確定性的（同樣輸入 → 同樣結果），之後要做連線對戰可以直接沿用。

## 美術

現在場上的角色是「麻將館頭像當大頭＋程式畫的 Q 版身體」。正式的全身 sprite 請看 [docs/art-guide.md](docs/art-guide.md)。
