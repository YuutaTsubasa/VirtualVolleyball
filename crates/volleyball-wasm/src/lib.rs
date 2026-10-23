//! 把比賽引擎包成 WebAssembly，在瀏覽器裡跑：
//! - `LocalMatch`：單機版，在主執行緒每 1/60 秒呼叫一次
//! - `HostRoom`：線上房間的房主（瀏覽器就是伺服器），在 Web Worker 裡跑（見 src/lib/local/host-worker.js）
//!
//! LocalMatch 的用法（見 src/lib/engine.js）：
//!   const game = new LocalMatch('xiaochun', 'aming', 10);
//!   game.setAi(1, 'hard');            // 右邊交給電腦
//!   game.step(bits0, bits1);          // 位元見 volleyball_core::game::Input::from_bits
//!   const state = JSON.parse(game.state());
//! state() 的格式跟伺服器每個影格送的一樣，畫面可以直接沿用。

use volleyball_core::ai::{Ai, Difficulty};
use volleyball_core::game::{Input, Match};
use volleyball_core::protocol::{self, Conn};
use volleyball_core::room::Room;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct LocalMatch {
    game: Match,
    ais: [Option<Ai>; 2],
    seed: u64,
}

#[wasm_bindgen]
impl LocalMatch {
    #[wasm_bindgen(constructor)]
    pub fn new(left: &str, right: &str, target: u32) -> LocalMatch {
        LocalMatch { game: Match::new([left, right], target), ais: [None, None], seed: js_sys_seed() }
    }

    /// 把一邊交給電腦：difficulty = easy | normal | hard
    #[wasm_bindgen(js_name = setAi)]
    pub fn set_ai(&mut self, side: usize, difficulty: &str) {
        let d: Difficulty = serde_json::from_value(serde_json::Value::String(difficulty.into())).unwrap_or_default();
        self.seed = self.seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        self.ais[side & 1] = Some(Ai::new(side & 1, d, self.seed));
    }

    pub fn step(&mut self, bits0: u32, bits1: u32) {
        let mut inputs = [Input::from_bits(bits0), Input::from_bits(bits1)];
        for (i, ai) in self.ais.iter_mut().enumerate() {
            if let Some(ai) = ai {
                inputs[i] = ai.think(&self.game);
            }
        }
        self.game.step(inputs);
    }

    pub fn state(&self) -> String {
        serde_json::to_string(&self.game).unwrap_or_default()
    }
}

/// 線上房間：跟區網伺服器（src-tauri/src/server.rs）一樣的房間與訊息，只是不碰網路。
/// 連線用數字 id（0 是房主自己），JS 把收到的 JSON 交給 `message()`，
/// 每格呼叫 `tick()` 拿影格，再用 `drain()` 拿要送給各連線的訊息。
#[wasm_bindgen]
pub struct HostRoom {
    room: Room,
    host_key: String,
    conns: BTreeMap<u32, Conn>,
    outbox: Vec<Value>,
    /// 大廳資訊有變，下次 drain() 要送給每個人
    dirty: bool,
}

#[wasm_bindgen]
impl HostRoom {
    #[wasm_bindgen(constructor)]
    pub fn new(host_key: &str) -> HostRoom {
        HostRoom { room: Room::default(), host_key: host_key.into(), conns: BTreeMap::new(), outbox: Vec::new(), dirty: false }
    }

    pub fn connect(&mut self, id: u32) {
        self.conns.insert(id, Conn::default());
    }

    /// 連線中斷：比賽中由電腦代打，拿 token 重新連上就還給玩家
    pub fn disconnect(&mut self, id: u32) {
        if let Some(mut conn) = self.conns.remove(&id) {
            self.dirty |= protocol::drop_conn(&mut self.room, &mut conn);
        }
    }

    /// 收到 id 傳來的一則訊息（JSON 文字）
    pub fn message(&mut self, id: u32, text: &str) {
        let Some(conn) = self.conns.get_mut(&id) else { return };
        let v: Value = serde_json::from_str(text).unwrap_or(Value::Null);
        let (replies, changed) = protocol::handle(&mut self.room, &self.host_key, conn, &v);
        for r in replies {
            self.outbox.push(json!({"to": id, "msg": r}));
        }
        self.dirty |= changed;
        // 跟伺服器一樣：除了輸入，其他訊息都回一份大廳資訊
        if conn.hello && v.get("type").and_then(|x| x.as_str()) != Some("input") && !changed {
            self.outbox.push(json!({"to": id, "msg": protocol::room_message(&self.room, conn)}));
        }
    }

    /// 前進一格；比賽中回傳這一格的比賽狀態（JSON 文字），否則 undefined
    pub fn tick(&mut self) -> Option<String> {
        if !self.room.tick() {
            return None;
        }
        self.dirty |= protocol::just_ended(&self.room);
        self.room.frame().map(|f| f.to_string())
    }

    /// 取出要送的訊息：JSON 陣列 [{ to: 連線 id, msg }]
    pub fn drain(&mut self) -> String {
        if std::mem::take(&mut self.dirty) {
            for (id, conn) in &self.conns {
                if conn.hello {
                    self.outbox.push(json!({"to": id, "msg": protocol::room_message(&self.room, conn)}));
                }
            }
        }
        Value::Array(std::mem::take(&mut self.outbox)).to_string()
    }
}

// 每場比賽的電腦用不同的亂數種子
fn js_sys_seed() -> u64 {
    (js_random() * u64::MAX as f64) as u64
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math, js_name = random)]
    fn js_random() -> f64;
}
