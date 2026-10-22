// 角色資料，id、名字、介紹、配色沿用 TaiwanMahjong（origin/master）的 src/lib/characters.js。
//
// stats：速度 / 跳躍 / 力量，各 1–5，總和固定 10。這裡只用來顯示，實際數值在
//   crates/volleyball-core/src/characters.rs，改的話兩邊要一起改。
// lines：score 得分、miss 失分、win 贏得比賽、lose 輸掉比賽。
//
// 圖：public/characters/<id>/<表情>.webp（半身像）、public/sprites/<id>.webp（8 個動作的圖集）。
//   90 年代風格來自 docs/art/anime90-v1（虛擬排球王 90 年代圖素包）。
//   sprite 設成 false 的角色會改用「頭像 + 程式畫的身體」。

const BASE = import.meta.env.BASE_URL;

export const EXPRESSIONS = ['normal', 'happy', 'surprised', 'sad', 'win'];

const portraits = (id) =>
  Object.fromEntries(EXPRESSIONS.map((e) => [e, `${BASE}characters/${id}/${e}.webp`]));

const RAW = [
  {
    id: 'xiaocui', name: '小翠', intro: '綠色雙馬尾的元氣少女',
    hair: '#3fbf86', clothes: '#ffffff', collar: '#2a9d8f', skin: '#ffe0c8', shorts: '#2a9d8f',
    stats: { speed: 4, jump: 3, power: 3 },
    lines: {
      score: ['耶～得分！', '小翠出擊～！'],
      miss: ['啊啊啊沒接到啦！', '嗚…剛剛那球好快…'],
      win: ['贏了～！今天運氣超好！'],
      lose: ['嗚…下次一定贏回來！'],
    },
  },
  {
    id: 'yuehua', name: '月華', intro: '銀髮的冷靜大小姐',
    hair: '#e6e9f2', clothes: '#2b2d42', collar: '#e6e9f2', skin: '#fde6d6', shorts: '#2b2d42',
    stats: { speed: 2, jump: 4, power: 4 },
    lines: {
      score: ['軌跡，完全在計算之中。', '失禮了。'],
      miss: ['……失算了。'],
      win: ['勝負，早已注定。'],
      lose: ['真是不甘心……再一局。'],
    },
  },
  {
    id: 'aming', name: '阿明', intro: '熱血的刺蝟頭少年',
    hair: '#2f2f3a', clothes: '#f77f00', collar: '#fcbf49', skin: '#e9b48a', shorts: '#d62828',
    stats: { speed: 3, jump: 2, power: 5 },
    lines: {
      score: ['燃起來了——！', '一擊必殺！'],
      miss: ['可惡——！', '我、我只是不小心！'],
      win: ['這就是熱血的力量！！'],
      lose: ['我還沒燃燒完啊——！'],
    },
  },
  {
    id: 'tangtang', name: '糖糖', intro: '愛撒嬌的粉紅包包頭',
    hair: '#ff9ec7', clothes: '#ffd6e8', collar: '#ff8fab', skin: '#ffe4d4', shorts: '#ff8fab',
    stats: { speed: 5, jump: 3, power: 2 },
    lines: {
      score: ['得分了～♡', '糖糖好厲害吧♪'],
      miss: ['嗚嗚…欺負人家…'],
      win: ['贏了～大家要給糖糖糖果喔♡'],
      lose: ['不算不算！再來一次嘛～'],
    },
  },
  {
    id: 'xiaochun', name: '小春', intro: '橘色馬尾的運動少女',
    hair: '#f8961e', clothes: '#277da1', collar: '#ffffff', skin: '#f6cfae', shorts: '#1d4e89',
    stats: { speed: 4, jump: 4, power: 2 },
    lines: {
      score: ['好球！', '漂亮扣殺！'],
      miss: ['失誤了！下一球扳回來！'],
      win: ['比賽結束～！大家辛苦了！'],
      lose: ['被逆轉了…再練一百球！'],
    },
  },
  {
    id: 'lanjie', name: '蘭姐', intro: '戴眼鏡的麻將館老闆娘',
    hair: '#6a4c93', clothes: '#c1121f', collar: '#ffd166', skin: '#f3d0b4', shorts: '#7a0b14',
    stats: { speed: 3, jump: 3, power: 4 },
    lines: {
      score: ['年輕人，球要看清楚。', '開店三十年不是開假的。'],
      miss: ['哎呀，姐也有失手的時候。'],
      win: ['呵呵，喝杯茶再走吧。'],
      lose: ['算你厲害。'],
    },
  },
  {
    id: 'cangya', name: '蒼牙', intro: '銀髮狼耳、鼻子靈又好勝的狼族少年',
    hair: '#a7a9ad', clothes: '#2c2c34', collar: '#c9a24a', skin: '#f6dccb', shorts: '#2c2c34',
    stats: { speed: 5, jump: 3, power: 2 },
    lines: {
      score: ['嗷嗚——咬住了！', '獵物到手！'],
      miss: ['嗚……居然聞漏了。', '可惡，被反咬一口！'],
      win: ['今天的獵物，全被我叼走啦！'],
      lose: ['下一場一定咬住你。'],
    },
  },
  {
    id: 'jinye', name: '金爺', intro: '鬍子帥氣、見過大風大浪的老牌賭客',
    hair: '#2a2a2e', clothes: '#1b2233', collar: '#f0ece2', skin: '#d9a47c', shorts: '#1b2233',
    stats: { speed: 2, jump: 3, power: 5 },
    lines: {
      score: ['呵，這球我早就看好了。', '年輕人，承讓了。'],
      miss: ['輸得起，才贏得起。'],
      win: ['各位，付錢吧。'],
      lose: ['這場算你的，下場再說。'],
    },
  },
  {
    id: 'leo', name: '雷歐', intro: '戴著王冠、一本正經的異國王子騎士',
    hair: '#f2c94c', clothes: '#c7ccd6', collar: '#1f3f9a', skin: '#fde6d6', shorts: '#1f3f9a',
    stats: { speed: 3, jump: 4, power: 3 },
    lines: {
      score: ['以王冠之名——得分！', '勝利屬於堂堂正正之人。'],
      miss: ['……是我大意了。'],
      win: ['這是王者的勝利。'],
      lose: ['騎士也有失手的時候。下一場見真章。'],
    },
  },
  {
    id: 'alie', name: '阿烈', intro: '紅髮刀疤、豪爽愛冒險的傭兵',
    hair: '#c1272d', clothes: '#1d1d1d', collar: '#7a1d1d', skin: '#e2b08c', shorts: '#7a1d1d',
    stats: { speed: 3, jump: 2, power: 5 },
    lines: {
      score: ['痛快！', '哈哈，搶到手才算數！'],
      miss: ['這點小傷，不算什麼！'],
      win: ['寶藏到手啦！今晚我請客！'],
      lose: ['下一場冒險再說！'],
    },
  },
  {
    id: 'ayi', name: '阿翼', intro: '棕髮藍眼、穿著銀色盔甲的隱藏來客', hidden: true,
    hair: '#795038', clothes: '#cbd3dc', collar: '#20252f', skin: '#f3d2b6', shorts: '#20252f',
    stats: { speed: 4, jump: 2, power: 4 },
    lines: {
      score: ['剛好！', '這球拿下了！'],
      miss: ['哎呀，被看穿了。'],
      win: ['今天手感不錯！謝謝大家！'],
      lose: ['再戰一場吧！'],
    },
  },
];

export const CHARACTERS = RAW.map((c) => ({
  sprite: true,
  ...c,
  portraits: portraits(c.id),
  spriteSrc: `${BASE}sprites/${c.id}.webp`,
}));

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];

export function pickLine(character, kind) {
  const list = character.lines[kind] ?? [];
  return list[Math.floor(Math.random() * list.length)] ?? '';
}

// 隱藏角色：單人模式贏一場就解鎖
const UNLOCK_KEY = 'vb_unlock_ayi';
export function isUnlocked(character) {
  if (!character.hidden) return true;
  try {
    return localStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}
export function unlockHidden() {
  try {
    const was = localStorage.getItem(UNLOCK_KEY) === '1';
    localStorage.setItem(UNLOCK_KEY, '1');
    return !was;
  } catch {
    return false;
  }
}
