# 🏐 虛擬排球王

《皮卡丘打排球》風格的 1 對 1 沙灘排球遊戲，球員是[虛擬台麻館](https://github.com/YuutaTsubasa/TaiwanMahjong)的角色們：小翠、月華、阿明、糖糖、小春、蘭姐、蒼牙、金爺、雷歐、阿烈，還有隱藏角色阿翼。Tauri v2 + Svelte 5，遊戲畫面用 Canvas 畫，比賽引擎用 Rust 寫。

🎮 **馬上玩**：<https://yuuta-tsubasa.studio/VirtualVolleyball/> ——網頁版免安裝（比賽引擎以 WebAssembly 在瀏覽器裡跑）。

- 🎮 **單機**：對戰電腦（簡單／普通／困難）、同一台電腦雙人對戰、電腦對電腦觀戰
- 🌐 **線上房間**：在網頁或 App 按「開設房間」→「線上」，拿到 5 碼房號與分享連結，朋友在任何地方輸入房號或打開連結就能加入（WebRTC 直連，跟 TaiwanMahjong 同一套做法）
- 🏠 **區網房間**：房主在 App 按「開設房間」→「區網」，朋友用 App 的「加入房間」輸入位址，或直接用瀏覽器打開房主的網址
- 👀 觀戰、大廳聊天、電腦補空位；比賽中斷線會由電腦代打，重新連上就還給你
- 🎨 六種畫面風格（90 年代、PC-98、MS-DOS、台式印刷、Game Boy、動漫電影），介面、角色、球場一起換
- 🎵 PC-98 FM 音源的原創配樂與音效（Web Audio 即時合成，不用音檔）
- 🌐 中文、English、日本語（第一次打開會照瀏覽器的語言，之後在設定切換）
- ⚙️ 設定（畫面風格、語言、音樂與音效音量、靜音）在標題選單或右上角的齒輪，比賽中從暫停選單打開

## 下載 App

各平台的安裝檔由 GitHub Actions 打包（[`.github/workflows/build-apps.yml`](.github/workflows/build-apps.yml)），做法跟 TaiwanMahjong 一樣：

| 平台 | 檔案 | 備註 |
| --- | --- | --- |
| Windows | `.exe`（安裝程式）、`.msi` | SmartScreen 會警告「未知的發行者」，點「其他資訊 → 仍要執行」 |
| macOS | `.dmg`（`aarch64` = Apple Silicon、`x64` = Intel） | 沒有公證，第一次開啟要在 Finder 按右鍵 →「打開」 |
| Linux | `.deb`、`.rpm`、`.AppImage` | |
| Android | `.apk` | 允許「安裝不明來源的應用程式」後直接安裝 |
| iOS | 模擬器用的 `.app` | 實機需要 Apple 開發者帳號簽章 |

- 推一個 `v*` 標籤（例如 `v0.1.0`）會打包全部平台並附到同名的 Release。
- 也可以在 Actions →「Build apps」→「Run workflow」手動打包，檔案在該次執行的 Artifacts。
- 網頁版在每次推到 `main` 時自動測試並部署到 GitHub Pages（[`.github/workflows/pages.yml`](.github/workflows/pages.yml)）。
  線上房間的配對服務已部署在 `https://virtual-volleyball-signal.taiwan-mahjong-signal.workers.dev`（預設值寫在 `src/lib/site.js`）。

## 開發

需求：Node 18+、Rust 1.89+、`rustup target add wasm32-unknown-unknown`（跟 TaiwanMahjong 相同）。

```bash
npm install
```

桌面 App：

```bash
npm run tauri dev
```

只開網頁版（http://localhost:1421，可以單機、開線上房間（要有配對服務，見下面）、加入別人的房間）：

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

支援鍵盤、滑鼠、手把（標準配置，例如 Xbox／PlayStation／Switch Pro）與觸控。

| | 鍵盤 1P | 鍵盤 2P | 手把 | 觸控 |
| --- | --- | --- | --- | --- |
| 移動 | A / D | ← / → | 十字鍵／左搖桿 | 左下搖桿 |
| 跳躍 | W | ↑ | A 或 ↑ | 「跳」或搖桿往上推 |
| 擊球 | F／空白鍵 | Enter／右 Shift | B／X／RB／RT | 「擊」 |
| 暫停 | Esc／P | Esc／P | Start | 上方 ❚❚ |

- 球碰到身體會自動彈出去。
- **扣殺**：跳起來在空中按住擊球，碰到球就扣殺；在空中碰到球之後約 0.15 秒內補按擊球也算（用手把 A 跳時拇指來不及移過去）；同時按 ↓ 重扣、往對面按更快，放開 ↑ 再按一次是高吊（起跳時按著的 ↑ 不算，所以用搖桿往上推起跳、推著不放也能扣殺）。跳和擊球同時按也可以。
- **飛撲**：在地上按住左右再按擊球。
- 對戰電腦和連線時，WASD、方向鍵、任何一支手把都可以；雙人同樂時第一支手把是 1P、第二支是 2P，同一台平板則左右各一組觸控按鈕。
- 選單：滑鼠／觸控直接點；鍵盤用方向鍵、Enter、Esc；手把用十字鍵、A、B（文字欄位按 A 會跳出手把鍵盤）。做法跟 TaiwanMahjong 相同（`src/lib/input-controls.js`）。
- 手機請橫放；單機比賽中轉成直的或切到背景會自動暫停。
- 對戰電腦贏一場會解鎖隱藏角色「阿翼」——或在選單輸入 ↑↑↓↓←→←→BA。

## 連線怎麼運作

比賽在房主那邊跑（每秒 60 格），玩家只送輸入，房主把每一格的狀態廣播給所有人，所以每個人看到的都一樣、也沒辦法作弊。房間與訊息的處理（座位、聊天、連線訊息在 VirtualCore 的 `virtual-room`，排球自己的部分在 `crates/volleyball-core/src/room.rs`）是同一份 Rust 程式，區網伺服器直接用、線上房間編成 WebAssembly 用，單機版也是同一個引擎，行為不會有差異。

兩種房間：

| | 線上房間 | 區網房間 |
| --- | --- | --- |
| 誰當伺服器 | 房主的瀏覽器（網頁版、App 都可以） | 房主的 App 內建伺服器（VirtualCore 的 virtual-lan，`/ws`） |
| 怎麼連 | WebRTC 直連，配對時經過 Cloudflare 的小服務 | WebSocket 連房主的 IP:埠 |
| 怎麼邀請 | 5 碼房號或分享連結（`…/#join/房號`） | 區網位址（同網路，或自己開埠／通道） |

線上房間的細節：

- 房主的比賽在 Web Worker 裡跑（`src/lib/local/host-worker.js`），分頁切到背景也不會變慢；關掉分頁房間就關了。
- 每條 WebRTC 連線開兩個資料通道：**可靠**的（hello、大廳資訊、房主指令、聊天）與**不可靠、不排序**的（`maxRetransmits: 0`，每格的影格與輸入）。影格掉了不重送，下一格馬上補上，延遲不會越積越多；訊息帶編號，收到比較舊的就丟掉。
- 斷線會自動重連，帶著 token 拿回原本的座位；比賽中斷線的這段時間由電腦代打。
- 配對服務（[VirtualCore](https://github.com/YuutaTsubasa/VirtualCore) 的 `workers/signal/`）只轉送 WebRTC 的 offer／answer／ICE，比賽資料不經過它。它掛了也不影響已經在房間裡的人，只是新的人進不來；沒設定或連不上時介面會自動藏起線上房間。
- 少數很嚴格的網路（對稱式 NAT）WebRTC 連不通，這時請改用區網房間或通道。

區網房間：

- 預設通訊埠 **7788**（TaiwanMahjong 用 7777，兩個可以同時開）。
- 區網最順。要跨網路玩可以用 cloudflared 之類的通道，把 https 網址給朋友；延遲會直接反映在手感上。

## 線上房間的配對服務（Cloudflare Workers）

線上房間需要部署一個很小的配對服務，用 Cloudflare Workers 免費方案（Durable Object＋可休眠的 WebSocket，超過每日額度只會報錯、不會收費）。程式在 [VirtualCore](https://github.com/YuutaTsubasa/VirtualCore) 的 `workers/signal/`（Virtual 系列五款共用），排球部署的名字是 `virtual-volleyball-signal`。

**已部署**：`https://virtual-volleyball-signal.taiwan-mahjong-signal.workers.dev`（打開 `/health` 會看到 `ok`）。
這個網址就是 `src/lib/site.js` 的預設值，網頁版、桌面 App、本機開發都直接用它，不用另外設定。

**改了配對服務要重新部署**（在 VirtualCore 的資料夾，用自己的 Cloudflare 帳號，第一次要先 `npx wrangler login`）：

```bash
npm --prefix workers/signal run deploy:volleyball
```

要換成別的配對服務，建置時設環境變數 `VITE_SIGNAL_SERVER=https://…`；設成 `off` 則不提供線上房間。
GitHub Actions 的網頁版部署也可以在 repo 的 Variables 設 `SIGNAL_SERVER` 覆蓋。
App 版大廳的分享連結用 `VITE_WEB_URL`（打包 App 的 workflow 已設成網頁版的網址）。

**本機測試**（不用部署、不用登入；VirtualCore clone 在旁邊的 `../VirtualCore`）：

```bash
npm --prefix ../VirtualCore/workers/signal run dev
```

會在 http://localhost:8787 跑配對服務。在專案根目錄建立 `.env.development.local`：

```
VITE_SIGNAL_SERVER=http://localhost:8787
```

再 `npm run dev`，開兩個瀏覽器分頁：一個「開設房間」→「線上」，另一個打開大廳顯示的連結（或在「加入房間」輸入房號）。同一個瀏覽器的兩個分頁會共用 localStorage（名字、角色），測試時改一下名字比較好分。

## 程式結構

```
crates/volleyball-core/    比賽引擎（Rust）：物理、規則、電腦玩家、房間（實作 virtual-room 的 RoomGame）
crates/volleyball-wasm/    把引擎包成 WebAssembly：單機版（LocalMatch）與線上房間的房主（HostRoom）
src-tauri/                 Tauri v2 App＋區網伺服器（VirtualCore 的 virtual-lan，/ws）
  src/server.rs              啟動 virtual-lan（WebSocket、比賽時鐘、靜態網頁都在那裡）
  src/bin/volleyball-server.rs  不開視窗的伺服器
src/
  App.svelte                 畫面切換
  lib/engine.js              主迴圈：單機跑 WASM、連線收伺服器影格
  lib/net.svelte.js          連線狀態：區網（WebSocket）與線上房間（WebRTC）
  lib/site.js                排球的配對服務網址、網頁版網址（房號與分享連結的規則在 VirtualCore）
  lib/local/host-worker.js   線上房間的房主：在 Web Worker 裡跑房間與比賽
  lib/components/            Menu、SelectScreen、RoomEntry、Lobby…
  lib/game/render.js         Canvas 繪圖：背景、角色、球、特效、計分板
  lib/game/characters.js     角色顯示資料：名字、台詞、頭像（實際能力值在 Rust 那邊）
  lib/game/input.js          比賽中的輸入：鍵盤＋手把＋觸控
  lib/input-controls.js      選單的鍵盤／手把操作（跟 TaiwanMahjong 共用）
  lib/components/Controls.svelte       選單操作、手把鍵盤、暫停
  lib/components/TouchControls.svelte  比賽中的觸控按鈕
  lib/game/audio.js          音效入口（比賽事件、介面都呼叫 play()）
  lib/audio/                 曲子（songs.js）、音量與 BGM（sound.svelte.js）；PC-98 音源與播放器在 VirtualCore
  lib/components/SettingsDialog.svelte  設定視窗
  lib/i18n.svelte.js         多國語言：t('原文')，翻譯在 lib/i18n/<語言>/*.js（tests/i18n.test.js 會檢查漏翻）
public/                    圖：角色半身像與動作圖集、球場、特效、介面（90 年代圖素包，WebP）
docs/art-guide.md          美術素材的來源、規格與還沒做的部分
docs/art/anime90-v1/       90 年代圖素包的說明與提示詞
```

### 跟 VirtualCore 共用的部分

[VirtualCore](https://github.com/YuutaTsubasa/VirtualCore) 是 Virtual 系列五款共用的程式，`package.json` 用 git tag 引用（`virtual-core`）：

- `virtual-core/audio/synth.js`、`audio/music.js`：PC-98 FM 音源與曲子播放器
- `virtual-core/net/p2p.js`、`net/site.js`：線上房間的 WebRTC 傳輸、房號與分享連結
- `workers/signal/`：配對服務
- Rust `crates/virtual-room`（座位、房主、聊天、連線訊息、線上房主）與 `crates/virtual-lan`（區網伺服器）：`Cargo.toml` 用 git tag 引用
- `.github/workflows/build-apps.yml`、`pages.yml`：這個 repo 的兩個 workflow 只是呼叫它們

本機要同時改 VirtualCore 時：`npm install ../VirtualCore` 暫時換成本機版本；Rust 在 `.cargo/config.toml` 寫 `[patch."https://github.com/YuutaTsubasa/VirtualCore"]` 指到 `../VirtualCore/crates/…`（兩者都不要 commit）。

## 美術

90 年代賽璐璐風格的角色、球場與介面都已經是正式圖（[docs/art-guide.md](docs/art-guide.md)）。之後會跟台麻一樣有六種風格。
