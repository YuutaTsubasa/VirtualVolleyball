# Game Boy 動作圖對比修正版 v2

回應 requests/2026-10-23-0645-gameboy-sprite-contrast.md。

本包只替換 11 位角色的 88 張 characters/<id>/sprites/*.png；不替換半身像、球場、介面或其他素材。動作表請由這 8 張重新拼接，順序為 idle/run1/run2/jump/spike/dive/win/lose。

以 built-in image_gen 對原圖逐張定向編輯，並做精確四色、128 邏輯格與輪廓整理。最外側內緣 1 邏輯像素統一為 #0f380f，nearest 放大4倍即4px，不擴張角色外包圍盒。大面積亮色降至 #8bac0f，#9bbc0f 只保留小塊高光，最高占不透明像素5%。其他陰影色 #306230。RGBA alpha 僅0/255，512×512，每張包圍盒與原Game Boy圖一致，腳底基準(256,496)。

阿翼保留 H01-B01 原盔甲，不穿體育服。角色名稱與原包相同。來源及精確提示詞紀錄隨角色保留；生成原PNG留在 staging 的sources，不重複放入此ZIP。沙地比較圖僅供QA，不是遊戲圖素。

manifest.json / verification.json 列出88張圖的雜湊、邊界與對比檢查結果。請維持最近鄰縮放。
