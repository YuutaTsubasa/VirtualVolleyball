虛擬排球王 — Game Boy 四色圖素完整包
範圍：11 位角色、8 張動作與 5 張表情、各 1 張圖集，以及 27 張共用素材。正式 PNG 共 181 張，已通過完整驗證及 11 角色與共用總覽目視檢查。

製作：內建 image_gen 逐資產獨立生成目的明確的 Game Boy 像素原稿；不是把既有 anime 圖降色代替繪製。
sources/ 與 shared-sources/ 保留生成原稿，每張 .prompt.txt 為實際完整提示詞。queue.json 記錄來源參照與輸出規格。
Sharp 只做透明邊界裁切、nearest-neighbor 縮放、四色正規化、二值 alpha 正規化、圖集與預覽合成。
透明 alpha 來自原稿；不是以綠幕或移除純色背景偽造。
四個不透明色：#0f380f、#306230、#8bac0f、#9bbc0f；另允許完全透明。
UI 美術：四色綠色單色調、粗方形像素框線、平面高對比面板。可直接採上述四色作 CSS 主題。
原稿明度以固定門檻 58 / 128 / 205 分到四個色階；不使用漸層或抖色。所有成品 alpha 僅 0 或 255。

邏輯解析度
角色單張：128×128 邏輯格，4 倍 nearest，512×512 RGBA。
角色圖集：每格 128×128 邏輯格，2 倍 nearest，單格 256×256，8 格共 2048×256。
共用素材：所有最終尺寸除以 4 為邏輯尺寸，4 倍 nearest。例如 court 480×270 → 1920×1080，net 48×256 → 192×1024，icons 64×64 → 256×256，logo 350×105 → 1400×420。
每個檔案的 logicalWidth、logicalHeight、factor 見 manifest.json。
角色全身動作順序：idle, run1, run2, jump, spike, dive, win, lose。
角色半身表情順序：normal, happy, surprised, sad, win。
這些是 8 個動作關鍵圖（含兩張跑步），不代表完整流暢逐格動畫。
角色面向右；遊戲右側角色可水平翻轉。
全部 88 動作圖依 anime90 對應正式圖的 alpha 包圍盒調整內容寬高，取 4px 整數格，底邊固定 y=496；實際包圍盒與主版本寬高差最多 5px/4px，詳見 sprite-alignment.json。圖集由正式 512 圖縮半。肖像保持原尺寸。
分數中心：左 (216,102) / normalized (0.27,0.51)，右 (588,102) / normalized (0.735,0.51)。net 上方亮色帶在柱側 x=84 的中心 y=216（斜帶）；柱底邊 y=1016。

角色 ID
xiaocui 小翠；yuehua 月華；aming 阿明；tangtang 糖糖；xiaochun 小春；lanjie 蘭姐。
01-wolf → cangya；02-gambler → jinye；03-prince → leo；04-adventurer → alie。
保留完整狼耳／尾巴、賭徒成熟鬍子、王冠、冒險者的髮型／疤痕／耳環。
ayi 為隱藏阿翼，固定 H01-B01 原銀色全身盔甲，不換成體育服；參考來源由 anime90-full-v1/references/H01-B01-provenance.txt 記錄。

共用素材
environment：court、net、ball。
ui：logo、button-normal、button-selected、button-disabled、dialog-panel、portrait-frame、portrait-selected、score-panel、input-field、result-banner。
ui/icons：keyboard、gamepad、touch、lock、ready、pause、sound-on、sound-off、back、settings。
effects：hit-spark、sand-puff、spike-trail、score-burst。
portrait-frame、portrait-selected 中央透明；dialog-panel、score-panel、button 與 input-field 中央不透明。動態文字／分數由遊戲疊加。
UI 定位資訊另見 layout-metrics.json（以本包實際輸出量測）。

驗證與檢視
characters/<id>/overview.png 為逐角色總覽；common-assets-overview.png 為共用圖總覽；roster-overview.png 為全員總覽。
verification.json 包含每張尺寸、RGBA、四色、二值 alpha、4×或2×像素格、透明安全邊界與 SHA256。
切圖、圖集與預覽可由 prepare.cjs、build-preview.cjs 重建（需本機 Sharp）。
一般共用 cutout 安全邊界至少 8px；角色單張與 icons 至少 16px；圖集每格至少 8px。
正式清單只算 manifest 指定的 181 PNG，不把 sources 或 previews 算入。
此包只含美術，沒有修改遊戲程式，也沒有 commit。最終由整合工作交付 VolleyBall/art-inbox。
