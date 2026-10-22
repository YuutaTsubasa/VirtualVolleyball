//! 角色能力值。id 要跟前端 src/lib/game/characters.js 一致（那邊放名字、台詞、圖片）。
//! 速度／跳躍／力量各 1–5，總和固定 10。

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Stats {
    pub speed: f64,
    pub jump: f64,
    pub power: f64,
}

/// (id, 速度, 跳躍, 力量, 隱藏角色)
pub const CHARACTERS: &[(&str, u8, u8, u8, bool)] = &[
    ("xiaocui", 4, 3, 3, false),
    ("yuehua", 2, 4, 4, false),
    ("aming", 3, 2, 5, false),
    ("tangtang", 5, 3, 2, false),
    ("xiaochun", 4, 4, 2, false),
    ("lanjie", 3, 3, 4, false),
    ("cangya", 5, 3, 2, false),
    ("jinye", 2, 3, 5, false),
    ("leo", 3, 4, 3, false),
    ("alie", 3, 2, 5, false),
    ("ayi", 4, 2, 4, true),
];

pub fn is_character(id: &str) -> bool {
    CHARACTERS.iter().any(|c| c.0 == id)
}

/// 能力值（1–5）換成實際數值；不認得的 id 用平均值
pub fn stats_of(id: &str) -> Stats {
    let (s, j, p) = CHARACTERS
        .iter()
        .find(|c| c.0 == id)
        .map(|c| (c.1, c.2, c.3))
        .unwrap_or((3, 3, 4));
    Stats {
        speed: 5.4 + s as f64 * 0.45,
        jump: 15.4 + j as f64 * 0.65,
        power: 0.86 + p as f64 * 0.06,
    }
}

/// 隨機挑一個非隱藏角色（電腦補位用）
pub fn random_character(rng: &mut impl rand::Rng, avoid: &[&str]) -> &'static str {
    let pool: Vec<&str> = CHARACTERS
        .iter()
        .filter(|c| !c.4 && !avoid.contains(&c.0))
        .map(|c| c.0)
        .collect();
    pool[rng.gen_range(0..pool.len())]
}
