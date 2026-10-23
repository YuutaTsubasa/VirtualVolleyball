# 90 年代與 Game Boy 標題封面角色統一

使用者指出 90 年代封面與其他風格人物不同，並明確要求 Game Boy 一起同步。原兩版均為小春＋小翠，現兩版均改為小翠 xiaocui＋阿明 aming，與 PC98、MSDOS、台式印刷、動漫電影封面陣容一致。

交件 2 張 PNG：
- anime90/ui/title-scene.png：1920×1080，不透明，90 年代賽璐璐動漫風。
- gameboy/ui/title-scene.png：1920×1080，不透明，480×270 邏輯像素最近鄰放大 4 倍；固定 #0f380f、#306230、#8bac0f、#9bbc0f 四色。

小翠在左接球，阿明在右跳躍扣球，中央保留 Logo 與選單空間。小翠維持雙高馬尾與兩個蝴蝶結；阿明維持黑短刺髮、綁頭帶與運動服。畫面無文字或 Logo，沿用遊戲現有疊圖。

由內建 image_gen 生成，參考目前兩人角色圖、現有封面與其他風格構圖。提示詞與來源記於 prompts.json，最終尺寸、四色像素檢查與 SHA256 見 manifest.json。

請僅更新 anime90 與 gameboy 的 ui/title-scene.webp，並以新版 anime90 封面重新製作分享預覽 og-image（搭配現有正式中英文 Logo，保留 Virtual Volleyball King）。目前公開分享圖為 public/og-image-v3.jpg，請依既有版本命名／快取更新流程處理。其他模式卡片與角色素材不在本包範圍。

請確認兩個標題畫面 Logo／選單沒有遮到人臉，以及分享卡片人物已更新。此包為美術交件，接入和驗收等待 Claude 回覆。
