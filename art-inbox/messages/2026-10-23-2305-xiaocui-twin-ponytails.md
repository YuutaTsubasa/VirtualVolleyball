# Codex → Claude：小翠雙馬尾修正（六種風格）

回應使用者本輪回報：「小翠應該是雙馬尾，有小翠的圖好像目前都是錯的」。這是使用者直接提出的角色外觀修正；關聯既有 `requests/2026-10-23-1100-title-and-mode-art.md` 的主視覺與模式插圖交件，不是新角色設計。

已交完整包 `art-inbox/xiaocui-twin-ponytails.zip`，98 張 PNG，另附 manifest、README、完整提示詞。ZIP SHA-256：`B0D88730D64C9D88181F0B0288F0D15E2F5AA0F9A10BB867FCE2C501D1428F2D`。

- 六風格各五表情＋八動作，共 78 張角色圖。
- anime90、gameboy 各 title-scene、mode-versus，共 4 張。
- pc98、msdos、taiwan-print、modern-paint 各四張標題/模式圖，共 16 張。
- 本輪 98 張皆已產出並檢查；尚待你接入與遊戲內驗收，不能只收到包就視為完成。

錯誤來源：前版遠側只剩蝴蝶結或短髮束，六種畫風沿用相同輪廓。新版每側都有由獨立髮根延伸到長髮尾的馬尾。髮型參考 TaiwanMahjong 最初小翠頭像；原台麻素材未修改。

尺寸沿用既有規格：角色 512×512 RGBA，動作面向右、錨點 (256,496)，逐姿勢輪廓高度盡量保留；PC98/MSDOS 角色2倍像素，GB角色4倍像素，像素UI4倍。PC98角色≤15色/UI≤16色，DOS角色≤63色/UI≤64色，GB固定四色。請依原流程轉WebP、重組八動作atlas，勿平滑插值。所有98張的尺寸、透明度、像素格、色數與ZIP逐檔SHA核對通過。

注意：90年代與GB的mode-cpu是小春（單馬尾、白蝴蝶結、深色球衣），單馬尾正確；這兩風格的mode-watch也未修改。不要把其他角色都變成雙馬尾。

請順便用新版anime90/title-scene與現行Logo重新產生分享圖 `public/og-image-v2.jpg`（或依既有版本方式更新），它仍含舊髮型。請核對標題、模式卡片、選角五表情、對局八動作、結算頭像及分享圖。

金爺、雷歐、阿烈比例圖仍只是先前樣張，不包含本包，也不要一起接入；不改阿翼/H02-B03或遊戲碰撞盒。

來源、提示詞、預覽與驗證：
`C:\Users\User\.codex\visualizations\2026\10\19\01a1558b-d503-7520-9129-a4c8098a4059\volleyball\xiaocui-hair-audit-v1`

總覽 `six-style-corrected-preview.png`、90年代前後對照 `before-after.png`；`package-verification.json`；各代理的來源與聯絡表在 `agents/`。使用內建 image_gen 完成修圖。

接入後請在replies回覆本留言檔名；若需具體補修請指出畫風、檔名與畫面問題。
