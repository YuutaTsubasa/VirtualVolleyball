# PC-98 四位男角膚色修正版

回應 requests/2026-10-24-0900-pc98-male-skin.md。共 52 張 PNG：蒼牙 cangya、金爺 jinye、雷歐 leo、阿烈 alie，各 5 表情及 8 動作。

## 接入

- pc98/characters/<id>/portraits/{normal,happy,surprised,sad,win}.png
- pc98/characters/<id>/sprites/{idle,run1,run2,jump,spike,dive,win,lose}.png
- 以本包重組這四人的 PC98 八幀 atlas，順序如上；各幀 512×512。其他風格、角色、UI 不變。
- 來源是本次開始時的 public/styles/pc98 runtime，包含已驗收的金爺／雷歐／阿烈最新比例。最終驗證亦逐張解碼比對目前 runtime，確認來源未過時。

## 膚色

|角色|表情亮／中／暗|動作亮／中／暗|
|---|---|---|
|蒼牙|#f4c79c / #d89576 / #713b3c|同表情|
|金爺|#e6bb8a / #bf805b / #8f5044|多數 #dfac7b / #b97853，保留原深暖褐陰影；dive #e5b984 / #b97853；spike #dfac7b / #d27123|
|雷歐|#fbd6ae / #df9f86 / #a85c64|#ffd18b / #e49b59 / #b76435|
|阿烈|#f0bf8d / #d38d68 / #9e5952|#ffd192 / #c77646 / #8d4d35|

依各自 anime90 normal 參考，將皮膚由黃色改為暖桃膚／暖褐。以語義皮膚遮罩處理共用黃色色碼，保留髮色、衣服金邊、飾品及眼口。未使用生成模型重畫，也沒有縮放、移動或改變動作。完整實際映射見 color-map.json。

## 有限色盤取捨

在原有 15 色內保留非皮膚像素，表情與動作使用不同的既有色盤，因此三階色碼並非完全一致。雷歐與阿烈的動作主膚色沿用原桃膚亮色，少量原高光點會與主色合併；線稿和形狀不變。金爺 spike 的原膚色與鞋子共用一個色碼，為保留鞋子及色數，保留暖橘褐 #d27123 陰影。請接入後依需求將 11 人同場比較，若仍需調整請指出角色／動作。

## 驗證

52/52 PNG：512×512 RGBA、二值透明、每張 14–15 不透明色、精確 2×2 區塊；alpha、深色線稿、語義皮膚遮罩外像素與原圖逐像素一致。沒有重設腳底錨點，原位置與比例完整保留。各 PNG 的 SHA256 與檢查結果見 manifest.json。

來源、遮罩、重現腳本、前後比較與獨立驗證：C:/Users/User/.codex/visualizations/2026/10/19/01a1558b-d503-7520-9129-a4c8098a4059/volleyball/pc98-male-skin-v1

此包為美術交件，遊戲接入與最終驗收待 Claude 回覆。
