# 小翠雙馬尾修正包

本包只替換 Volleyball 小翠（xiaocui）的髮型錯誤素材。正式設定是兩側各一束長馬尾、兩個粉紅蝴蝶結；修正後遠側也能清楚看出長髮束與髮尾。

## 內容

- 六種風格，各五張表情與八張動作：78 張。
- anime90 / gameboy：各兩張 UI（title-scene、mode-versus）：4 張。
- pc98 / msdos / taiwan-print / modern-paint：各四張 UI（title-scene、mode-cpu、mode-versus、mode-watch）：16 張。
- 合計 98 張 PNG；manifest.json 逐檔列出尺寸、SHA-256、透明度、色數、像素格與輪廓範圍。

## 接入

每個風格目錄沿用既有美術包結構。角色正式 ID 為 xiaocui；請將八張動作依 idle、run1、run2、jump、spike、dive、win、lose 合成既有 sprite atlas，並依原流程轉 WebP。

角色圖 512×512 RGBA，動作面向右，錨點 (256,496)。逐姿勢高度盡量保留現行圖，不改遊戲碰撞盒或數值。PC-98 / MS-DOS 角色為 2 倍像素、Game Boy 為 4 倍像素；像素風 UI 為 4 倍像素。請勿用平滑縮放再插值。

UI 標題圖 1920×1080；模式圖 1200×900。保留原有主體位置與中央選單空間。90 年代及 Game Boy 的 mode-cpu 是小春，單馬尾是正確設定，故未交這兩張；這兩種風格的 mode-watch 也未需小翠修正。

請一併以新版 anime90/ui/title-scene.png 與現行英文副標 Logo 重新產生 public/og-image-v2.jpg（或依專案快取版本方式更新），避免分享縮圖繼續出現錯誤髮型。標題、模式卡片、角色選擇、對局八動作與結果畫面的頭像都需確認讀取新圖。

本包不包含其他角色的修正。金爺、雷歐、阿烈的比例目前仍是先前的樣張階段，不能與此包一起替換；阿翼及 H02-B03 也未變動。

## 產製

使用內建 image_gen 修圖，Sharp 僅進行切圖、等比縮放、調色盤與整數倍輸出。完整提示詞在 prompts/。原圖與檢查預覽保存在交件留言提供的 xiaocui-hair-audit-v1 工作目錄。
