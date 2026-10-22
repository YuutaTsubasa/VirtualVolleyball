// 角色資料，id、名字、配色沿用 TaiwanMahjong 的 src/lib/characters.js。
//
// stats：速度 / 跳躍 / 力量，各 1–5，總和固定 10。這裡只用來顯示，實際數值在
//   crates/volleyball-core/src/characters.rs，改的話兩邊要一起改。
// lines：score 得分、miss 失分、win 贏得比賽、lose 輸掉比賽。
//
// sprite：場上的全身動畫圖。還沒有圖的角色會用「頭像 + 程式畫的身體」代替。
//   有了 ChatGPT 畫的圖之後，把 PNG 放到 public/sprites/<id>.png，再把該角色的 sprite 改成 true。
//   圖的規格見 docs/art-guide.md。

const BASE = import.meta.env.BASE_URL;

export const EXPRESSIONS = ['normal', 'happy', 'surprised', 'sad', 'win'];

const portraits = (id) =>
  Object.fromEntries(EXPRESSIONS.map((e) => [e, `${BASE}characters/${id}/${e}.png`]));

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
    id: 'ziheng', name: '子衡', intro: '溫柔有禮、球風卻毫不留情的書店老闆',
    hair: '#263c35', clothes: '#e8dfc8', collar: '#8caa93', skin: '#f1cfb0', shorts: '#4f6b58',
    stats: { speed: 3, jump: 4, power: 3 },
    lines: {
      score: ['這一球，恰好接得上。', '伏筆總算收齊了。'],
      miss: ['嗯……是我讀錯了。'],
      win: ['故事有個好結局呢。'],
      lose: ['這一頁，得記住才行。'],
    },
  },
  {
    id: 'chengyue', name: '承岳', intro: '沉穩可靠、常來幫忙修桌椅的家具修復師',
    hair: '#49382e', clothes: '#293d54', collar: '#e9dfcc', skin: '#d9a47c', shorts: '#3b3127',
    stats: { speed: 2, jump: 3, power: 5 },
    lines: {
      score: ['穩穩的，一球。', '底子打好了。'],
      miss: ['看走眼了，下一球討回來。'],
      win: ['收工。打完請你喝茶。'],
      lose: ['沒事，失手也能修回來。'],
    },
  },
  {
    id: 'zhibai', name: '知白', intro: '話少卻細心、銀藍髮的大提琴手',
    hair: '#aabcca', clothes: '#30333e', collar: '#a6c4d9', skin: '#f6dccb', shorts: '#30333e',
    stats: { speed: 3, jump: 5, power: 2 },
    lines: {
      score: ['……嗯。', '節奏剛好。'],
      miss: ['……慢了半拍。'],
      win: ['……你有在看嗎？'],
      lose: ['再陪我打一場吧。'],
    },
  },
  {
    id: 'youchen', name: '佑辰', intro: '笑容親切、擅長讀心的活動主持人',
    hair: '#8b4935', clothes: '#7c3042', collar: '#eee0c9', skin: '#e2b08c', shorts: '#4a1d28',
    stats: { speed: 4, jump: 3, power: 3 },
    lines: {
      score: ['猜到我會打哪邊了嗎？', '掌聲在哪裡？'],
      miss: ['哎呀，被你搶走風頭了。'],
      win: ['今天的壓軸就是我啦！'],
      lose: ['這段可以剪掉嗎？不行啊……'],
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
  sprite: false,
  ...c,
  portraits: portraits(c.id),
  spriteSrc: `${BASE}sprites/${c.id}.png`,
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
