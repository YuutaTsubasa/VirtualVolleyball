# 🏐 虛擬台麻館沙灘排球

《皮卡丘打排球》風格的 1 對 1 排球遊戲，球員是[虛擬台麻館](https://github.com/YuutaTsubasa/TaiwanMahjong)的角色們。Tauri v2 + Svelte 5，遊戲畫面用 Canvas 畫，比賽引擎用 Rust 寫。

- 🎮 **單機**：對戰電腦（簡單／普通／困難）、同一台電腦雙人對戰、電腦對電腦觀戰
- 🌐 **連線**：房主在 App 按「開設房間」，朋友用 App 的「加入房間」輸入位址，或直接用瀏覽器打開房主的網址
- 👀 觀戰、大廳聊天、電腦補空位；比賽中斷線會由電腦代打，重新連上就還給你

## 開發

需求：Node 18+、Rust 1.89+、`rustup target add wasm32-unknown-unknown`（跟 TaiwanMahjong 相同）。

```bash
npm install
```

桌面 App：

```bash
npm run tauri dev
```

只開網頁版（http://localhost:1421，不能開房，但可以單機或加入別人的房間）：

```bash
npm run dev
```

打包安裝檔：

```bash
npm run tauri build
```

只跑伺服器、不開視窗（放在主機上，或測試連線用），會印出網址與「房主金鑰」，在網頁的「開設房間」輸入金鑰就能當房主：

```bash
npm run build
```

```bash
npm run server -- --port 7788 --dist dist
```

測試：

```bash
npm test
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
- 對戰電腦和連線時，WASD 或方向鍵都可以。支援手把。
- 對戰電腦贏一場會解鎖隱藏角色「阿翼」。

## 連線怎麼運作

比賽在房主的伺服器上跑（每秒 60 格），玩家只送輸入，伺服器把每一格的狀態廣播給所有人，所以每個人看到的都一樣、也沒辦法作弊。單機版跑的是同一份 Rust 程式（編成 WebAssembly），兩邊不會有行為差異。

- 預設通訊埠 **7788**（TaiwanMahjong 用 7777，兩個可以同時開）。
- 區網最順。要跨網路玩可以用 cloudflared 之類的通道，把 https 網址給朋友；延遲會直接反映在手感上。

## 程式結構

```
crates/volleyball-core/    比賽引擎（Rust）：物理、規則、電腦玩家、房間
crates/volleyball-wasm/    把引擎包成 WebAssembly 給單機版用
src-tauri/                 Tauri v2 App＋內建伺服器（axum，/ws）
  src/server.rs              房間、WebSocket、靜態網頁
  src/bin/volleyball-server.rs  不開視窗的伺服器
src/
  App.svelte                 畫面切換
  lib/engine.js              主迴圈：單機跑 WASM、連線收伺服器影格
  lib/net.svelte.js          WebSocket 連線狀態
  lib/components/            Menu、SelectScreen、RoomEntry、Lobby…
  lib/game/render.js         Canvas 繪圖：背景、角色、球、特效、計分板
  lib/game/characters.js     角色顯示資料：名字、台詞、頭像（實際能力值在 Rust 那邊）
  lib/game/input.js          鍵盤＋手把
  lib/game/audio.js          WebAudio 合成音效
public/characters/         角色頭像（從 TaiwanMahjong 複製，縮成 384px）
docs/art-guide.md          要請 ChatGPT 畫的圖與提示詞
scripts/make_sheet.py      把單張姿勢圖組成 sprite sheet
```

## 美術

現在場上的角色是「麻將館頭像當大頭＋程式畫的 Q 版身體」。正式的全身 sprite 請看 [docs/art-guide.md](docs/art-guide.md)。
