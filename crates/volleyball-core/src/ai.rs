//! 電腦玩家：預測球的落點、跑過去、時機對了就跳起來扣殺。
//! 輸出跟真人一樣的 `Input`，所以比賽模擬不用分辨誰是電腦。

use crate::game::{hit_circle, step_ball, Ball, Match, Phase, Input, BALL_R, GROUND, NET_X, START_X};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

/// 電腦的強度：Virtual 系列共用（virtual-room），各款自己決定每種強度的參數（見 cfg）
pub use virtual_room::Difficulty;

struct Cfg {
    error: f64,
    reaction: i32,
    spike: f64,
    dive: f64,
    jump_timing: f64,
}

fn cfg(difficulty: Difficulty) -> Cfg {
    match difficulty {
        Difficulty::Easy => Cfg { error: 110.0, reaction: 18, spike: 0.25, dive: 0.15, jump_timing: 0.5 },
        Difficulty::Normal => Cfg { error: 60.0, reaction: 9, spike: 0.6, dive: 0.45, jump_timing: 0.8 },
        Difficulty::Hard => Cfg { error: 24.0, reaction: 3, spike: 0.95, dive: 0.85, jump_timing: 1.0 },
    }
}

const HIT_HEIGHT: f64 = GROUND - 70.0;

/// 模擬球往後飛，回傳第一次降到 y 高度時的 x 與所需影格
fn predict(ball: &Ball, y: f64) -> (f64, i32) {
    let mut b = ball.clone();
    for t in 1..=240 {
        step_ball(&mut b, 1.0, None);
        if b.vy > 0.0 && b.y >= y {
            return (b.x, t);
        }
    }
    (b.x, 240)
}

struct Plan {
    x: f64,
    frames: i32,
    landing: Option<f64>,
}

pub struct Ai {
    side: usize,
    pub difficulty: Difficulty,
    cfg: Cfg,
    rng: SmallRng,
    wobble: f64,
    think_timer: i32,
    plan: Plan,
    hit_held: bool,
}

impl Ai {
    pub fn new(side: usize, difficulty: Difficulty, seed: u64) -> Self {
        Ai {
            side,
            difficulty,
            cfg: cfg(difficulty),
            rng: SmallRng::seed_from_u64(seed),
            wobble: 0.0,
            think_timer: 0,
            plan: Plan { x: START_X[side], frames: 0, landing: None },
            hit_held: false,
        }
    }

    fn own_side(&self, x: f64) -> bool {
        if self.side == 0 { x < NET_X } else { x > NET_X }
    }

    pub fn think(&mut self, m: &Match) -> Input {
        let me = &m.players[self.side];
        let ball = &m.ball;
        let mut input = Input::default();
        if m.phase != Phase::Rally {
            self.hit_held = false;
            return input;
        }
        let cfg = &self.cfg;

        // 反應速度：每隔幾個影格才重新判斷一次
        self.think_timer -= 1;
        if self.think_timer <= 0 {
            self.think_timer = cfg.reaction;
            self.wobble = self.rng.gen_range(-1.0..1.0) * cfg.error;
            let (lx, frames) = predict(ball, HIT_HEIGHT);
            self.plan = if self.own_side(lx) {
                // 站在球的後方一點，讓球往對面彈；離網越遠站得越後面，球才送得過去
                let back = 20.0 + (lx - NET_X).abs() * 0.045;
                Plan { x: lx - me.toward * back + self.wobble, frames, landing: Some(lx) }
            } else {
                Plan { x: START_X[self.side] + me.toward * 40.0 + self.wobble * 0.5, frames, landing: None }
            };
        }

        let dx = self.plan.x - me.x;
        if dx.abs() > 6.0 {
            if dx > 0.0 {
                input.right = true;
            } else {
                input.left = true;
            }
        }

        let (cx, cy, r) = hit_circle(me);
        let bdx = ball.x - me.x;
        let ball_coming = self.own_side(ball.x) || ball.vx.signum() == -me.toward;

        // 來不及跑到落點時飛撲
        if let Some(landing) = self.plan.landing {
            if me.on_ground && self.plan.frames < 22 && self.own_side(landing) {
                let need = (landing - me.x).abs();
                if need > 80.0 && need < 260.0 && self.rng.gen::<f64>() < cfg.dive * 0.25 {
                    input.hit_pressed = true;
                    input.left = landing < me.x;
                    input.right = landing > me.x;
                    return input;
                }
            }
        }

        // 起跳：球在頭上、正在落下、高度剛好
        let near_net = (me.x - NET_X).abs() < 230.0;
        if me.on_ground
            && ball_coming
            && ball.vy > -2.0
            && bdx.abs() < 45.0
            && ball.y > GROUND - 330.0
            && ball.y < GROUND - 170.0
            && near_net
            && self.rng.gen::<f64>() < cfg.jump_timing * 0.35
        {
            input.up = true;
        }

        // 空中而且球就在旁邊：扣殺
        if !me.on_ground {
            let dist = (ball.x - cx).hypot(ball.y - cy);
            if dist < r + BALL_R + 40.0 && ball.y < cy + 10.0 {
                if !self.hit_held && self.rng.gen::<f64>() < cfg.spike {
                    input.hit_pressed = true;
                    input.hit = true;
                    // 靠網就往下重扣；離網遠的話重扣會掛網，改打平球或高吊
                    let r: f64 = self.rng.gen();
                    if (me.x - NET_X).abs() < 130.0 {
                        input.down = r < 0.75;
                    } else if r < 0.3 {
                        input.up = true;
                    }
                    if self.rng.gen::<f64>() < 0.5 {
                        input.left = me.toward < 0.0;
                        input.right = me.toward > 0.0;
                    }
                }
                self.hit_held = true;
            }
        } else {
            self.hit_held = false;
        }

        input
    }
}
