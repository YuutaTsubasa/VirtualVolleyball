# 虛擬排球王 MS-DOS 素材包

風格 ID：msdos。回應 requests/2026-10-23-0440-from-claude.md。

181 張正式 PNG：11 位角色各 8 張動作、5 張表情、1 張動作表，另有 27 張球場、球網、排球、特效與介面。10 個圖示位於 ui/icons/。男角來源 ID 對應：01-wolf=cangya、02-gambler=jinye、03-prince=leo、04-adventurer=alie。

採 DOS VGA 遊戲的強烈外輪廓、飽和色塊、灰色立體斜邊與深藍介面。每張最多 63 個實色加透明，使用明確的色盤量化，沒有模糊插值。角色和表情以 256×256 邏輯像素 nearest 放大 2 倍為 512×512；動作表 2048×256、每格 256×256。球場 480×270 放大 4 倍；其他共用素材均為交付尺寸一半、nearest 放大 2 倍，詳見 shared-manifest.json。這是時代畫風詮釋，並非 DOS 執行檔或硬體 ROM。

角色面朝右，單張腳底基準 (256,496)，圖集每格 (128,248)。動作順序 idle/run1/run2/jump/spike/dive/win/lose；這是 8 張關鍵姿勢，不含補間動畫。阿翼保留 H01-B01 原本銀色鎧甲與黑色內搭，不穿體育服；references/ 附模型參照與來源。

介面主色：背景 #101828、面板 #243c7a、文字 #f6f1d8、選取 #ffd23f、邊框 #9ca8b8。氣氛：MS-DOS 遊戲選單的灰色立體斜邊、深藍面板，搭配亮黃選取色與清楚的點陣字。除 logo「虛擬排球王」外，其餘文字由遊戲繪製。分數中心、球網白帶與柱底實測座標另列 layout-metrics.json。

manifest.json / verification.json 為索引與檢查結果。overview 僅供檢視，不算正式圖素。未含程式、音效；額外標題場景與模式預覽屬選配，本包可由程式使用角色圖組合。
