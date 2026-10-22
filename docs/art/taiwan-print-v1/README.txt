虛擬排球王 — 台灣彩色印刷風格素材包
完成：11 位角色，每位 8 動作及 5 表情；11 張圖集；27 張環境、UI、圖示及特效，共 181 張正式 PNG，完整性與尺寸驗證通過。
UI 美術：多彩套色海報、暖紙色亮部、網點陰影與粗墨邊框；人物外圍為真正透明，並非紙色矩形。
CSS theme HEX: ink #102044, teal #128C96, vermilion #E94B32, cream #FFF1C2, gold #F6C334。
所有圖像使用 built-in image_gen 逐張生成；Sharp 僅機械裁切、縮放與圖集/預覽合成。
原始生成圖保留 sources/，完整實際提示詞保留 prompts/，即時進度為 progress.jsonl。
阿翼保留 H01-B01 原銀色騎士盔甲；不換體育服。
正式檔名與尺寸依 manifest.json；驗證結果以 verification.json 為準。
10 個圖示全部位於 ui/icons/。
本套圖為動作關鍵圖，非完整流暢逐格動畫。
交付規格：143 張角色單圖（512×512 RGBA）＋11 張橫向八格圖集（2048×256）＋27 張共用素材＝181 張正式 PNG；sources 與 overview 不計入。
圖集順序：idle, run1, run2, jump, spike, dive, win, lose；每格 256×256，透明留白至少 8px。
計分板 800×200：左側數字中心 (0.27125, 0.51)，右側中心 (0.73375, 0.51)，為最終空白內面板的視覺中心。
球網 192×1024：白色上帶靠柱接點頂邊 y=203；網柱最後可見像素 y=1015，底緣 exclusive y=1016。詳見 layout-metrics.json。
男性舊 ID 對應：01-wolf=cangya、02-gambler=jinye、03-prince=leo、04-adventurer=alie；檔案保留原素材包 ID。
Alpha 收尾：<=8 歸零、>=245 歸255；保留其餘抗鋸齒透明度與所有 RGB，原始生成來源不變。
