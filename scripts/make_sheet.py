"""把 ChatGPT 畫的單張姿勢圖組成遊戲用的 sprite sheet。

用法：
    python scripts/make_sheet.py art/xiaocui public/sprites/xiaocui.png

art/xiaocui/ 裡放這 8 張透明背景 PNG（檔名固定，缺的會用 idle 代替）：
    idle run1 run2 jump spike dive win lose

做的事：
1. 裁掉每張圖的透明邊。
2. 以 idle 的高度為準，所有姿勢用「同一個比例」縮放（角色大小才會一致）。
3. 每格 256×256，腳底對齊格子底部、水平置中，橫排成一條 2048×256 的圖。
"""

import sys
from pathlib import Path

from PIL import Image

FRAMES = ['idle', 'run1', 'run2', 'jump', 'spike', 'dive', 'win', 'lose']
CELL = 256
IDLE_HEIGHT = 236  # idle 姿勢在格子裡的高度，留一點頭頂空間


def load(folder: Path, name: str):
    path = folder / f'{name}.png'
    if not path.exists():
        return None
    img = Image.open(path).convert('RGBA')
    box = img.getbbox()
    return img.crop(box) if box else img


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    folder, out = Path(sys.argv[1]), Path(sys.argv[2])
    idle = load(folder, 'idle')
    if idle is None:
        sys.exit(f'找不到 {folder / "idle.png"}')
    scale = IDLE_HEIGHT / idle.height

    sheet = Image.new('RGBA', (CELL * len(FRAMES), CELL), (0, 0, 0, 0))
    for i, name in enumerate(FRAMES):
        img = load(folder, name) or idle
        w, h = round(img.width * scale), round(img.height * scale)
        # 太大的姿勢（例如飛撲很寬）再縮到塞得進格子
        fit = min(1, CELL / w, CELL / h)
        w, h = round(w * fit), round(h * fit)
        img = img.resize((w, h), Image.LANCZOS)
        sheet.alpha_composite(img, (i * CELL + (CELL - w) // 2, CELL - h))
        print(f'{name:6} {"(用 idle 代替)" if load(folder, name) is None else ""}')

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, optimize=True)
    print(f'完成：{out}')


if __name__ == '__main__':
    main()
