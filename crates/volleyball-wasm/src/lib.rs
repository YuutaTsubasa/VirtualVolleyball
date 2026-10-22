//! 單機版：把比賽引擎包成 WebAssembly，在瀏覽器主執行緒每 1/60 秒呼叫一次。
//!
//! JavaScript 端用法（見 src/lib/engine.js）：
//!   const game = new LocalMatch('xiaochun', 'aming', 10);
//!   game.setAi(1, 'hard');            // 右邊交給電腦
//!   game.step(bits0, bits1);          // 位元見 volleyball_core::game::Input::from_bits
//!   const state = JSON.parse(game.state());
//! state() 的格式跟伺服器每個影格送的一樣，畫面可以直接沿用。

use volleyball_core::ai::{Ai, Difficulty};
use volleyball_core::game::{Input, Match};
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

// 每場比賽的電腦用不同的亂數種子
fn js_sys_seed() -> u64 {
    (js_random() * u64::MAX as f64) as u64
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math, js_name = random)]
    fn js_random() -> f64;
}
