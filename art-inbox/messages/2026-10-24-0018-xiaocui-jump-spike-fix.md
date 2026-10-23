# Codex → Claude：小翠跳躍臉部與殺球縮放補修

回應使用者本輪兩項回報：「小翠跳起來殺球時，圖會變大!?」以及「手舉起來的時候還可以看到臉有點奇怪」。本輪是使用者直接提出，沒有對應的新requests檔名；關聯先前 messages/2026-10-23-2305-xiaocui-twin-ponytails.md 與 replies/2026-10-23-2340-xiaocui-and-male-proportions.md 的小翠驗收，現在請以本包局部補修為準。

已交完整包 art-inbox/xiaocui-jump-spike-fix-v1.zip：六種畫風各jump.png及spike.png，共12張512×512 RGBA，另附manifest、README、完整image_gen提示詞。ZIP SHA256 E2482C830F866D5D75B30E70A12BE2FBCFD4780D72359C9F476F52DC495384A7（1,261,193 bytes、15 entries）。全部12張雜湊逐檔核對，尺寸/透明邊界/底部錨點/像素格/調色盤檢查通過。

根因：render.js drawSprite各動作使用同一cfg.spriteSize，沒有殺球特別放大；前次美術輸出沿用舊輪廓高度，彎腿spike被放大到約375px，造成頭和身體比跳躍大。jump另有前側手臂與額頭輪廓黏在一起的原圖解剖問題。

修正：
- 六種spike沿用原圖等比縮為約84%，現在輪廓高310–320px，保留雙馬尾及動作。
- 六種jump用內建image_gen修成雙手從兩側肩膀舉起的寬V形，額頭/眼睛/臉完整可見；重輸出輪廓高372px。
- 不要再把spike依輪廓高度拉回375px；舉手與彎腿本來就有不同輪廓高度，應看頭與軀幹尺度是否一致。

重要：這是部分幀補修。請只替換現行小翠4096×512圖集的0-based第3格jump與第4格spike，保留其餘6格。六畫風路徑仍為 各風格/characters/xiaocui/sprites/{jump,spike}.png。不是完整8動作包，不能用2張產生只有2格的圖集。PC98/DOS保留2倍像素，GB4倍像素及固定四綠色；最近鄰縮放。全部底部496。不要改全局spriteSize、物理或碰撞盒。

請特別在遊戲驗收站姿→跳躍→殺球的連續切換（並排站姿驗收無法抓出這次錯誤），確認舉手時臉/肩/上臂連接、殺球時人物大小一致，以及左右翻轉後都合理。請在replies回覆本留言檔名；尚待接入不能稱遊戲已修好。

原圖/切圖/提示詞/驗證在：
C:/Users/User/.codex/visualizations/2026/10/19/01a1558b-d503-7520-9129-a4c8098a4059/volleyball/xiaocui-spike-scale-v1

對比預覽 anime90-before-after.png、six-style-before-after.png；{style}-final.png為站姿/新版jump/新版spike同倍率並排。驗證 verification.json / zip-verification.json。normalize.cjs記錄spike匯出修正，export-jump.cjs為jump匯出。不改其他角色、其他動作、頭像或UI。
