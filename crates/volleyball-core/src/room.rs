//! 房間：左右兩個座位（真人或電腦）、觀戰者、聊天、開始／回大廳。
//! 座位、房主、聊天這些共通的部分在 VirtualCore 的 virtual-room（`Lobby`），這裡只放排球的比賽。
//! 不碰網路，伺服器（VirtualCore 的 virtual-lan）每 1/60 秒呼叫 `tick()`。

use crate::ai::{Ai, Difficulty};
use crate::characters::{is_character, random_character};
use crate::game::{Event, Input, Match};
use rand::rngs::SmallRng;
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::ops::{Deref, DerefMut};
use virtual_room::{Game, Lobby, RoomGame};

pub use virtual_room::{Seat, SeatKind};

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

/// 每個座位的輸入
#[derive(Default)]
pub struct SeatInput {
    input: Input,
    hit_seq: u64,
    pending_hit: bool,
}

const SIDE_NAMES: [&str; 2] = ["左邊", "右邊"];

/// 排球的房間規則
pub struct Volleyball;

impl Game for Volleyball {
    type Settings = Settings;
    type SeatState = SeatInput;
    const SEATS: usize = 2;

    fn joined_text(name: &str, seat: usize) -> String {
        format!("{} 坐到了{}", name, SIDE_NAMES[seat])
    }
    fn is_character(id: &str) -> bool {
        is_character(id)
    }
    fn random_character(rng: &mut SmallRng, avoid: &[&str]) -> &'static str {
        random_character(rng, avoid)
    }
    fn clamp_settings(settings: Settings) -> Settings {
        Settings { target: settings.target.clamp(1, 99), ..settings }
    }
    fn seat_difficulty(settings: &Settings) -> Difficulty {
        settings.difficulty
    }
    fn on_disconnect(state: &mut SeatInput) {
        state.input = Input::default();
    }
}

pub struct Room {
    pub lobby: Lobby<Volleyball>,
    pub game: Option<Match>,
    ais: [Option<Ai>; 2],
}

impl Default for Room {
    fn default() -> Self {
        Self::new(Settings::default())
    }
}

// 座位、聊天、入席這些直接用大廳的（room.join(…)、room.seats…）
impl Deref for Room {
    type Target = Lobby<Volleyball>;
    fn deref(&self) -> &Lobby<Volleyball> {
        &self.lobby
    }
}

impl DerefMut for Room {
    fn deref_mut(&mut self) -> &mut Lobby<Volleyball> {
        &mut self.lobby
    }
}

impl Room {
    pub fn new(settings: Settings) -> Self {
        Room { lobby: Lobby::new(settings), game: None, ais: [None, None] }
    }

    /// 玩家輸入：bits 見 `Input::from_bits`，seq 是「按下擊球」的累計次數（避免太快的點擊被漏掉）
    pub fn set_input(&mut self, seat: usize, bits: u32, seq: u64) {
        let Some(s) = self.lobby.seats.get_mut(seat).and_then(|s| s.as_mut()) else { return };
        s.state.input = Input::from_bits(bits & 0b1_1111);
        if seq != s.state.hit_seq {
            s.state.hit_seq = seq;
            s.state.pending_hit = true;
        }
    }
}

impl RoomGame for Room {
    type Rules = Volleyball;

    fn lobby(&self) -> &Lobby<Volleyball> {
        &self.lobby
    }
    fn lobby_mut(&mut self) -> &mut Lobby<Volleyball> {
        &mut self.lobby
    }

    /// 開始（或再來一場）：空位補電腦
    fn start(&mut self) -> Result<(), String> {
        self.lobby.playing = false;
        for i in 0..2 {
            if self.lobby.seats[i].is_none() {
                let d = self.lobby.settings.difficulty;
                self.lobby.add_bot(Some(i), d)?;
            }
        }
        let chars: Vec<String> = self.lobby.seats.iter().flatten().map(|s| s.character.clone()).collect();
        self.game = Some(Match::new([&chars[0], &chars[1]], self.lobby.settings.target));
        self.ais = [None, None];
        self.lobby.playing = true;
        self.lobby.sys("比賽開始！");
        Ok(())
    }

    fn reset_to_lobby(&mut self) {
        self.game = None;
        self.ais = [None, None];
        self.lobby.playing = false;
    }

    fn input(&mut self, seat: usize, msg: &Value) {
        let bits = msg.get("b").and_then(|x| x.as_u64()).unwrap_or(0) as u32;
        let seq = msg.get("s").and_then(|x| x.as_u64()).unwrap_or(0);
        self.set_input(seat, bits, seq);
    }

    /// 前進一個影格。比賽中回傳 true（每格都送畫面）。
    fn tick(&mut self) -> bool {
        let Some(game) = self.game.as_mut() else { return false };
        let mut inputs = [Input::default(); 2];
        for i in 0..2 {
            let Some(seat) = self.lobby.seats[i].as_mut() else { continue };
            if seat.is_live_human() {
                self.ais[i] = None;
                inputs[i] = seat.state.input;
                inputs[i].hit_pressed = std::mem::take(&mut seat.state.pending_hit);
            } else {
                let difficulty = seat.difficulty;
                let seed = self.lobby.rng.gen();
                inputs[i] = self.ais[i].get_or_insert_with(|| Ai::new(i, difficulty, seed)).think(game);
            }
        }
        game.step(inputs);
        let over = game.events.iter().find_map(|e| match e {
            Event::Over { side } => Some(*side),
            _ => None,
        });
        if let Some(side) = over {
            if let Some(s) = self.lobby.seats[side].as_ref() {
                let text = format!("{} 獲勝！（{} − {}）", s.name, game.score[0], game.score[1]);
                self.lobby.sys(text);
            }
        }
        true
    }

    /// 比賽畫面（每個影格送）
    fn frame(&self) -> Option<Value> {
        self.game.as_ref().and_then(|g| serde_json::to_value(g).ok())
    }

    /// 這一格比賽剛結束（大廳資訊要更新：聊天多了「獲勝」那一行）
    fn just_ended(&mut self) -> bool {
        self.game.as_ref().is_some_and(|g| g.events.iter().any(|e| matches!(e, Event::Over { .. })))
    }
}
