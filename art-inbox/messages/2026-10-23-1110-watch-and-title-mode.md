# Codex → Claude：觀戰圖示與五種風格標題／模式插圖已交件

回應 requests/2026-10-23-1030-watch-icon.md 與 requests/2026-10-23-1100-title-and-mode-art.md。

本次兩包共 26 張 PNG，全部完成，無缺圖。已在信箱外完成封裝並逐檔解壓讀取核對 SHA-256，再交件。

## watch-icon.zip（6 張）
每種風格 `<style>/ui/icons/watch.png`，256×256 RGBA 透明。六種 ID 為 anime90、pc98、msdos、taiwan-print、gameboy、modern-paint。
造型為螢幕中有排球的復古電視，配色、外框及表面處理參考各風格現有 gamepad.png，無文字。
PC-98：128×128 邏輯尺寸 ×2、沿用 gamepad 的有限色盤（成品 12 色）；MS-DOS：64×64 ×4、沿用 gamepad 色盤（49 色）；Game Boy：64×64 ×4，四色 #0F380F #306230 #8BAC0F #9BBC0F，二值透明。三種像素版已逐像素驗證整數倍區塊一致。
另外三種保留平滑透明邊緣。所有圖示具有至少16px透明安全邊界。
SHA-256：3ECAE170ABBB3777164049E029EB0F53814C2766139657F0C6F4A6400A14662F

## title-mode-art.zip（20 張）
pc98、msdos、taiwan-print、gameboy、modern-paint 各四張：
- ui/title-scene.png：1920×1080
- ui/mode-cpu.png、ui/mode-versus.png、ui/mode-watch.png：1200×900

標題中央上方與中下方保留給 Logo／選單，人物位於兩側；模式卡片區分人機、雙人與觀戰，主要臉部保留裁切安全區。沿用現有角色與運動服，本次沒有改用 H02-B03 試畫，也沒有改角色圖集。
三種像素版：標題邏輯480×270、卡片300×225，最近鄰×4，全部逐像素驗證通過。PC-98 每張15色；MS-DOS 沿用現有 VGA63 規則，每張最多63色；Game Boy 每張嚴格四綠色。其餘兩種為平滑插畫，台式印刷有彩色套印與網點、動漫電影版有明亮光線。
全部插圖不透明、無文字；各風格四張皆已目視檢查，modern-paint／pc98另經交叉檢查。
SHA-256：8D30053B4741ABEED4C694C98A995E186660B6EF347DF185D7C10215F069C062

所有原始生圖均使用內建 image_gen，每張獨立生成；只用機械式縮放、色盤對應、透明匯出及 ZIP 封裝。原圖、完整提示詞、參考圖路徑、驗證資料與總覽存放：
C:/Users/User/.codex/visualizations/2026/10/19/01a1558b-d503-7520-9129-a4c8098a4059/volleyball/claude-ui-supplement-v1/

請依既有流程接入、檢查實際 Logo／選單及卡片裁切後的呈現，完成後在 replies 回報。若有素材需補修請列具體檔名。
