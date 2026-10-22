//! 房間：左右兩個座位（真人或電腦）、觀戰者、聊天、開始／回大廳。
//! 不碰網路，伺服器（src-tauri/src/server.rs）每 1/60 秒呼叫 `tick()`。

use crate::ai::{Ai, Difficulty};
use crate::characters::{is_character, random_character};
use crate::game::{Input, Match};
use rand::distributions::Alphanumeric;
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SeatKind {
    Human,
    Bot,
}

pub struct Seat {
    pub name: String,
    pub character: String,
    pub kind: SeatKind,
    pub difficulty: Difficulty,
    pub token: String,
    pub connected: bool,
    input: Input,
    hit_seq: u64,
    pending_hit: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// 先拿到幾分獲勝
    pub target: u32,
    /// 開始時補位電腦的強度
    pub difficulty: Difficulty,
}

impl Default for Settings {
    fn default() -> Self {
        Settings { target: 10, difficulty: Difficulty::Normal }
    }
}

#[derive(Clone, Debug, Serialize)]
struct ChatLine {
    seat: Option<usize>,
    name: String,
    text: String,
    sys: bool,
}

const SIDE_NAMES: [&str; 2] = ["左邊", "右邊"];
const MAX_CHAT: usize = 60;

pub struct Room {
    pub seats: [Option<Seat>; 2],
    pub host_seat: Option<usize>,
    pub settings: Settings,
    pub game: Option<Match>,
    ais: [Option<Ai>; 2],
    chat: Vec<ChatLine>,
    rng: SmallRng,
}

impl Default for Room {
    fn default() -> Self {
        Self::new(Settings::default())
    }
}

impl Room {
    pub fn new(settings: Settings) -> Self {
        Room {
            seats: [None, None],
            host_seat: None,
            settings,
            game: None,
            ais: [None, None],
            chat: Vec::new(),
            rng: SmallRng::from_entropy(),
        }
    }

    pub fn playing(&self) -> bool {
        self.game.is_some()
    }

    fn sys(&mut self, text: String) {
        self.chat.push(ChatLine { seat: None, name: String::new(), text, sys: true });
        if self.chat.len() > MAX_CHAT {
            self.chat.remove(0);
        }
    }

    pub fn push_chat(&mut self, seat: Option<usize>, text: &str) {
        let text: String = text.trim().chars().take(300).collect();
        if text.is_empty() {
            return;
        }
        let name = seat
            .and_then(|s| self.seats[s].as_ref())
            .map(|s| s.name.clone())
            .unwrap_or_else(|| "觀眾".into());
        self.chat.push(ChatLine { seat, name, text, sys: false });
        if self.chat.len() > MAX_CHAT {
            self.chat.remove(0);
        }
    }

    fn pick_character(&mut self, wanted: Option<&str>) -> String {
        match wanted {
            Some(c) if is_character(c) => c.to_string(),
            _ => random_character(&mut self.rng, &[]).to_string(),
        }
    }

    /// 真人入席，回傳（座位, 重新連線用的 token）。比賽中不能入席（改成觀戰）。
    pub fn join(&mut self, name: &str, character: Option<&str>) -> Result<(usize, String), String> {
        if self.playing() {
            return Err("比賽進行中".into());
        }
        let seat = self.seats.iter().position(|s| s.is_none()).ok_or("座位已滿")?;
        let name: String = name.trim().chars().take(16).collect();
        let name = if name.is_empty() { format!("玩家{}", seat + 1) } else { name };
        let token: String = (&mut self.rng).sample_iter(&Alphanumeric).take(24).map(char::from).collect();
        let character = self.pick_character(character);
        self.sys(format!("{} 坐到了{}", name, SIDE_NAMES[seat]));
        self.seats[seat] = Some(Seat {
            name,
            character,
            kind: SeatKind::Human,
            difficulty: self.settings.difficulty,
            token: token.clone(),
            connected: false,
            input: Input::default(),
            hit_seq: 0,
            pending_hit: false,
        });
        Ok((seat, token))
    }

    pub fn seat_of_token(&self, token: &str) -> Option<usize> {
        if token.is_empty() {
            return None;
        }
        self.seats
            .iter()
            .position(|s| s.as_ref().is_some_and(|s| s.kind == SeatKind::Human && s.token == token))
    }

    pub fn connect(&mut self, seat: usize) {
        if let Some(s) = self.seats[seat].as_mut() {
            s.connected = true;
        }
    }

    /// 斷線：比賽中由電腦代打，重新連上就還給玩家
    pub fn disconnect(&mut self, seat: usize) {
        let Some(s) = self.seats[seat].as_mut() else { return };
        s.connected = false;
        s.input = Input::default();
        let name = s.name.clone();
        if self.playing() {
            self.sys(format!("{} 斷線了，先由電腦代打", name));
        }
    }

    pub fn add_bot(&mut self, seat: Option<usize>, difficulty: Difficulty) -> Result<usize, String> {
        if self.playing() {
            return Err("比賽進行中".into());
        }
        let seat = match seat {
            Some(s) if s < 2 && self.seats[s].is_none() => s,
            Some(_) => return Err("這個座位有人了".into()),
            None => self.seats.iter().position(|s| s.is_none()).ok_or("座位已滿")?,
        };
        let taken: Vec<String> = self.seats.iter().flatten().map(|s| s.character.clone()).collect();
        let taken: Vec<&str> = taken.iter().map(|s| s.as_str()).collect();
        let character = random_character(&mut self.rng, &taken).to_string();
        self.seats[seat] = Some(Seat {
            name: format!("電腦（{}）", difficulty.label()),
            character,
            kind: SeatKind::Bot,
            difficulty,
            token: String::new(),
            connected: true,
            input: Input::default(),
            hit_seq: 0,
            pending_hit: false,
        });
        Ok(seat)
    }

    /// 離開座位（玩家自己離開或房主移除）。比賽中就換成電腦接手。
    pub fn remove_seat(&mut self, seat: usize) -> Result<(), String> {
        let Some(s) = self.seats.get_mut(seat).and_then(|s| s.as_mut()) else {
            return Err("這個座位沒有人".into());
        };
        let name = s.name.clone();
        if self.game.is_some() {
            s.kind = SeatKind::Bot;
            s.token.clear();
            s.connected = true;
            s.name = format!("電腦（代打 {}）", name);
        } else {
            self.seats[seat] = None;
        }
        if self.host_seat == Some(seat) {
            self.host_seat = None;
        }
        self.sys(format!("{} 離開了座位", name));
        Ok(())
    }

    pub fn set_character(&mut self, seat: usize, id: &str) -> Result<(), String> {
        if self.playing() {
            return Err("比賽進行中不能換角色".into());
        }
        if !is_character(id) {
            return Err("沒有這個角色".into());
        }
        let s = self.seats[seat].as_mut().ok_or("你沒有座位")?;
        s.character = id.to_string();
        Ok(())
    }

    pub fn update_settings(&mut self, settings: Settings) {
        self.settings = Settings { target: settings.target.clamp(1, 99), ..settings };
    }

    /// 玩家輸入：bits 見 `Input::from_bits`，seq 是「按下擊球」的累計次數（避免太快的點擊被漏掉）
    pub fn set_input(&mut self, seat: usize, bits: u32, seq: u64) {
        let Some(s) = self.seats[seat].as_mut() else { return };
        s.input = Input::from_bits(bits & 0b1_1111);
        if seq != s.hit_seq {
            s.hit_seq = seq;
            s.pending_hit = true;
        }
    }

    /// 開始（或再來一場）：空位補電腦
    pub fn start(&mut self) -> Result<(), String> {
        for i in 0..2 {
            if self.seats[i].is_none() {
                self.add_bot(Some(i), self.settings.difficulty)?;
            }
        }
        let chars: Vec<String> = self.seats.iter().flatten().map(|s| s.character.clone()).collect();
        self.game = Some(Match::new([&chars[0], &chars[1]], self.settings.target));
        self.ais = [None, None];
        self.sys("比賽開始！".into());
        Ok(())
    }

    pub fn reset_to_lobby(&mut self) {
        self.game = None;
        self.ais = [None, None];
    }

    /// 前進一個影格。比賽中回傳 true。
    pub fn tick(&mut self) -> bool {
        let Some(game) = self.game.as_mut() else { return false };
        let mut inputs = [Input::default(); 2];
        for i in 0..2 {
            let Some(seat) = self.seats[i].as_mut() else { continue };
            if seat.kind == SeatKind::Human && seat.connected {
                self.ais[i] = None;
                inputs[i] = seat.input;
                inputs[i].hit_pressed = std::mem::take(&mut seat.pending_hit);
            } else {
                let difficulty = seat.difficulty;
                let seed = self.rng.gen();
                inputs[i] = self.ais[i].get_or_insert_with(|| Ai::new(i, difficulty, seed)).think(game);
            }
        }
        game.step(inputs);
        let over = game.events.iter().find_map(|e| match e {
            crate::game::Event::Over { side } => Some(*side),
            _ => None,
        });
        if let Some(side) = over {
            if let Some(s) = self.seats[side].as_ref() {
                let text = format!("{} 獲勝！（{} − {}）", s.name, game.score[0], game.score[1]);
                self.sys(text);
            }
        }
        true
    }

    /// 大廳／房間資訊（有變動時送）
    pub fn view(&self, you: Option<usize>) -> Value {
        let seats: Vec<Value> = self
            .seats
            .iter()
            .map(|s| {
                s.as_ref().map_or(Value::Null, |s| {
                    json!({
                        "name": s.name,
                        "character": s.character,
                        "kind": s.kind,
                        "difficulty": s.difficulty,
                        "connected": s.connected,
                    })
                })
            })
            .collect();
        json!({
            "phase": if self.playing() { "playing" } else { "lobby" },
            "seats": seats,
            "host_seat": self.host_seat,
            "you": you,
            "settings": self.settings,
            "chat": self.chat,
        })
    }

    /// 比賽畫面（每個影格送）
    pub fn frame(&self) -> Option<Value> {
        self.game.as_ref().and_then(|g| serde_json::to_value(g).ok())
    }
}
