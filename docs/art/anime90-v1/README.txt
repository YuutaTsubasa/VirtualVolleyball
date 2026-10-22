虛擬排球王 — 90 年代圖素包 v1
2026-10-23

開啟 preview.html 可選擇左右角色、動作與表情，切換深淺檢視底色；可比較放大尺寸與 150px 遊戲尺寸。
roster-overview.png：全體角色總覽
gameplay-preview.png：球場合成示意
common-assets-overview.png：共用素材總覽
manifest.json：正式圖素清單
verification.json：角色尺寸、RGBA、透明安全邊界、唯一雜湊檢查
preview-verification.json：瀏覽器預覽檢查

交付數量
11 位角色 × 8 張動作 + 5 張半身表情 = 143 張 512×512 RGBA PNG。
11 張動作圖集，各 2048×256，單格 256×256。
27 張共用圖素：3 張環境、10 張介面、10 張圖示、4 張特效。
正式可用 PNG 合計 181 張；總覽、原始生成圖及檢查圖不列入。

角色
xiaocui 小翠、yuehua 月華、aming 阿明、tangtang 糖糖、xiaochun 小春、lanjie 蘭姐。
01-wolf 狼系少年、02-gambler 賭徒大叔、03-prince 金髮王子、04-adventurer 紅髮冒險者。
ayi 阿翼為隱藏角色，採 H01-B01 原本銀色盔甲，沒有換成體育服。
四位新男角使用暫定描述名稱及獨立 ID；沒有擅自覆蓋 VolleyBall 舊角色 ID。
H01-B01 的臉與全身服裝參考來源詳 references/H01-B01-provenance.txt。

圖集
characters/<id>/sprite-sheet.png
由左至右：idle, run1, run2, jump, spike, dive, win, lose。
所有角色面向右；遊戲右側角色可水平翻轉。角色固定在有安全邊界的方格內，不能逐幀去邊後直接套用相同錨點。
原尺寸圖片位於 sprites/ 與 portraits/。
表情順序：normal, happy, surprised, sad, win。
這是 8 個動作關鍵圖，跑步為兩張圖切換，不是完整流暢逐格動畫。
角色視覺頭部比例已調整，但不同姿勢仍有手繪差異。半身圖構圖一致，輪廓非逐像素相同。

共用圖素
environment/court.png 1920×1080：海邊沙地背景，可共用於標題、選角與對戰。
environment/net.png 192×1024：側視球網柱與窄網面，獨立透明圖。
environment/ball.png 256×256：藍黃白排球。
ui/logo.png 1400×420：沿用已修正的「虛擬排球王」標誌。
ui/button-normal.png、button-selected.png、button-disabled.png 640×128：三種按鈕狀態。
ui/dialog-panel.png 960×720：大面板，可用於開房、加入、等待、說明、暫停、結果。
ui/portrait-frame.png、portrait-selected.png 256×256：透明中央角色框。
ui/score-panel.png 800×200：比分底板。
ui/input-field.png 640×128：房號等輸入框底板。
ui/result-banner.png 1000×240：結果標題緞帶。
ui/icons/：keyboard、gamepad、touch、lock、ready、pause。
ui/icons-extra/：sound-on、sound-off、back、settings。
全部圖示為 256×256。
effects/hit-spark.png、score-burst.png 512×512。
effects/sand-puff.png、spike-trail.png 768×256。
特效為獨立靜態圖，可由引擎縮放、旋轉、淡出；沒有假裝為已完成的動畫序列。

頁面組合建議
標題：court + logo + 三種 button。
選角：court + portrait-frame/selected + 角色 portraits + lock。
開設／加入／等待：dialog-panel + input-field + button + ready/back。
對戰：court + net + ball + sprites/sheet + score-panel + pause + effects。
說明／設定：dialog-panel + keyboard/gamepad/touch + sound-on/off + settings。
結果：dialog-panel + result-banner + win/lose + score-burst + button。
介面底圖不含標籤或數字；所有動態文字、分數與碰撞範圍由遊戲程式處理。
鍵鼠／手把／觸控圖示只是視覺圖素，本包未改動輸入邏輯。

製作與來源
使用內建 image_gen，逐張生成；Sharp 僅裁切、縮放、保留 alpha、合成圖集和預覽。
小春沿用先前已確認的完整示範包；其餘依既有角色形象生成排球版本。
共用圖完整提示詞記於 shared-prompts.json；各角色及圖示的提示詞在各自 prompts.json 或 prompts/。
標誌來源：exec-b24109a2-0b79-4301-b88a-dea538271339.png（本對話先前確認版本，非本輪重畫）。
完整工作資料夾另保留來源圖、重建腳本和 H01-B01 參考圖片。
assets.zip 收錄成品、預覽、說明、提示詞與驗證記錄；不含龐大的原始生成圖及機器專用重建腳本。
本次未修改 TaiwanMahjong 或 VolleyBall 的遊戲程式、未替換正式資產、未 commit。

