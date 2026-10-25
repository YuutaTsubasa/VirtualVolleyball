//! 比賽模擬：只管物理與規則。每次 `step()` 前進固定 1/60 秒。
//! 伺服器（連線對戰）與 WebAssembly（單機）都跑這一份，前端只負責畫。
//!
//! 欄位名稱用 camelCase 序列化，前端 src/lib/game/render.js 直接讀。

use crate::characters::{stats_of, Stats};
use serde::Serialize;

pub const W: f64 = 960.0;
pub const H: f64 = 540.0;
pub const GROUND: f64 = 470.0;
pub const NET_X: f64 = W / 2.0;
pub const NET_W: f64 = 14.0;
pub const NET_TOP: f64 = 290.0;

pub const BALL_R: f64 = 24.0;
const BALL_G: f64 = 0.32;
const BALL_MAX_SPEED: f64 = 26.0;
const NET_BOUNCE: f64 = 0.85;

const PLAYER_G: f64 = 0.85;
pub const PLAYER_HALF_W: f64 = 34.0;
const HIT_COOLDOWN: i32 = 10;
const SPIKE_WINDOW: i32 = 14;
const DIVE_FRAMES: i32 = 20;
const RECOVER_FRAMES: i32 = 16;

const READY_FRAMES: i32 = 50;
const POINT_FRAMES: i32 = 90;

pub const START_X: [f64; 2] = [160.0, W - 160.0];

/// 一個玩家在這個影格的輸入
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Input {
    pub left: bool,
    pub right: bool,
    pub up: bool,
    pub down: bool,
    pub hit: bool,
    /// 這個影格「剛按下」擊球
    pub hit_pressed: bool,
}

impl Input {
    /// 前端傳來的位元：1 左、2 右、4 上、8 下、16 擊球（按住）、32 擊球（剛按下）
    pub fn from_bits(b: u32) -> Self {
        Input {
            left: b & 1 != 0,
            right: b & 2 != 0,
            up: b & 4 != 0,
            down: b & 8 != 0,
            hit: b & 16 != 0,
            hit_pressed: b & 32 != 0,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PlayerState {
    Normal,
    Dive,
    Recover,
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Ready,
    Rally,
    Point,
    Over,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    pub side: usize,
    pub character: String,
    #[serde(skip)]
    pub stats: Stats,
    /// 對手場地的方向（左邊 +1、右邊 -1）
    pub toward: f64,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub on_ground: bool,
    pub state: PlayerState,
    #[serde(skip)]
    pub timer: i32,
    pub spike_timer: i32,
    #[serde(skip)]
    pub hit_cooldown: i32,
    /// 起跳用的「上」還按著（沒放開過）：這時候扣殺不算高吊，要放開再按才算
    #[serde(skip)]
    pub jump_up_held: bool,
    /// 給畫面用的計時
    pub anim: u32,
    /// 上一次擊球後經過的影格（畫揮手動作用）
    pub last_hit: u32,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct Ball {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub spin: f64,
    pub angle: f64,
    /// 扣殺出去的球（畫火焰尾巴）
    pub power: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Event {
    Whistle,
    Jump { side: usize },
    Land { side: usize, x: f64 },
    Dive { side: usize },
    Hit { side: usize, x: f64, y: f64 },
    Spike { side: usize, x: f64, y: f64 },
    Net,
    Wall,
    Ground { x: f64 },
    Score { side: usize },
    Over { side: usize },
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    pub target: u32,
    pub players: [Player; 2],
    pub ball: Ball,
    pub score: [u32; 2],
    pub server: usize,
    pub phase: Phase,
    pub timer: i32,
    pub last_scorer: Option<usize>,
    pub winner: Option<usize>,
    pub frame: u64,
    pub events: Vec<Event>,
}

/// 玩家的擊球判定圓（站著跟飛撲時不一樣）
pub fn hit_circle(p: &Player) -> (f64, f64, f64) {
    if p.state == PlayerState::Dive {
        (p.x, p.y - 32.0, 44.0)
    } else {
        (p.x, p.y - 62.0, 50.0)
    }
}

fn create_player(side: usize, character: &str) -> Player {
    Player {
        side,
        character: character.to_string(),
        stats: stats_of(character),
        toward: if side == 0 { 1.0 } else { -1.0 },
        x: START_X[side],
        y: GROUND,
        vx: 0.0,
        vy: 0.0,
        on_ground: true,
        state: PlayerState::Normal,
        timer: 0,
        spike_timer: 0,
        hit_cooldown: 0,
        jump_up_held: false,
        anim: 0,
        last_hit: 99,
    }
}

impl Match {
    pub fn new(characters: [&str; 2], target: u32) -> Self {
        let mut m = Match {
            target: target.max(1),
            players: [create_player(0, characters[0]), create_player(1, characters[1])],
            ball: Ball::default(),
            score: [0, 0],
            server: 0,
            phase: Phase::Ready,
            timer: READY_FRAMES,
            last_scorer: None,
            winner: None,
            frame: 0,
            events: Vec::new(),
        };
        m.reset_rally();
        m
    }

    fn reset_rally(&mut self) {
        for p in &mut self.players {
            p.x = START_X[p.side];
            p.y = GROUND;
            p.vx = 0.0;
            p.vy = 0.0;
            p.on_ground = true;
            p.state = PlayerState::Normal;
            p.timer = 0;
            p.spike_timer = 0;
            p.hit_cooldown = 0;
            p.last_hit = 99;
        }
        self.ball = Ball { x: START_X[self.server], y: 140.0, ..Ball::default() };
        self.phase = Phase::Ready;
        self.timer = READY_FRAMES;
    }

    pub fn step(&mut self, inputs: [Input; 2]) {
        self.events.clear();
        self.frame += 1;

        if self.phase == Phase::Over {
            for i in 0..2 {
                self.update_player(i, Input::default());
            }
            return;
        }

        if self.phase == Phase::Ready {
            self.timer -= 1;
            if self.timer <= 0 {
                self.phase = Phase::Rally;
                self.events.push(Event::Whistle);
            }
            return;
        }

        for i in 0..2 {
            self.update_player(i, inputs[i]);
        }

        if self.phase == Phase::Rally {
            // 分兩小步走，快球也不會穿過球網或人
            for _ in 0..2 {
                step_ball(&mut self.ball, 0.5, Some(&mut self.events));
                for i in 0..2 {
                    self.collide_player_ball(i, inputs[i]);
                }
                if self.ball.y + BALL_R >= GROUND {
                    self.land_ball();
                    break;
                }
            }
        } else if self.phase == Phase::Point {
            // 球落地後慢慢彈一下，讓大家看清楚
            let b = &mut self.ball;
            b.vy += BALL_G;
            b.x += b.vx;
            b.y += b.vy;
            b.vx *= 0.96;
            if b.y + BALL_R >= GROUND {
                b.y = GROUND - BALL_R;
                b.vy = -b.vy.abs() * 0.35;
            }
            self.timer -= 1;
            if self.timer <= 0 {
                self.finish_point();
            }
        }

        self.ball.angle += self.ball.spin;
    }

    fn update_player(&mut self, i: usize, input: Input) {
        let frozen = self.phase == Phase::Over;
        let p = &mut self.players[i];
        p.anim = p.anim.wrapping_add(1);
        p.last_hit = p.last_hit.saturating_add(1);
        if p.hit_cooldown > 0 {
            p.hit_cooldown -= 1;
        }
        if p.spike_timer > 0 {
            p.spike_timer -= 1;
        }

        let dir = (input.right as i32 - input.left as i32) as f64;
        if !input.up {
            p.jump_up_held = false;
        }

        match p.state {
            PlayerState::Dive => {
                p.timer -= 1;
                if p.timer <= 0 && p.on_ground {
                    p.state = PlayerState::Recover;
                    p.timer = RECOVER_FRAMES;
                }
            }
            PlayerState::Recover => {
                p.vx = 0.0;
                p.timer -= 1;
                if p.timer <= 0 {
                    p.state = PlayerState::Normal;
                }
            }
            PlayerState::Normal if !frozen => {
                p.vx = dir * p.stats.speed;
                if p.on_ground && input.hit_pressed && dir != 0.0 && !input.up {
                    // 飛撲救球
                    p.state = PlayerState::Dive;
                    p.timer = DIVE_FRAMES;
                    p.vx = dir * p.stats.speed * 2.0;
                    p.vy = -5.0;
                    p.on_ground = false;
                    self.events.push(Event::Dive { side: i });
                } else if p.on_ground && input.up {
                    p.vy = -p.stats.jump;
                    p.on_ground = false;
                    p.jump_up_held = true;
                    self.events.push(Event::Jump { side: i });
                    // 跳和擊球同時按：起跳就準備扣殺
                    if input.hit_pressed {
                        p.spike_timer = SPIKE_WINDOW;
                        p.last_hit = 0;
                    }
                } else if !p.on_ground && input.hit_pressed {
                    p.spike_timer = SPIKE_WINDOW;
                    p.last_hit = 0;
                } else if !p.on_ground && input.hit {
                    // 在空中按住擊球：一直準備扣殺到碰到球（觸控很難抓準按的時機）
                    p.spike_timer = p.spike_timer.max(SPIKE_WINDOW);
                }
            }
            PlayerState::Normal => p.vx = 0.0,
        }

        p.vy += PLAYER_G;
        p.x += p.vx;
        p.y += p.vy;
        if p.y >= GROUND {
            if !p.on_ground {
                self.events.push(Event::Land { side: i, x: p.x });
            }
            p.y = GROUND;
            p.vy = 0.0;
            p.on_ground = true;
            if p.state == PlayerState::Dive {
                p.vx *= 0.8;
            }
        }

        let (min_x, max_x) = if p.side == 0 {
            (PLAYER_HALF_W, NET_X - NET_W / 2.0 - PLAYER_HALF_W)
        } else {
            (NET_X + NET_W / 2.0 + PLAYER_HALF_W, W - PLAYER_HALF_W)
        };
        p.x = p.x.clamp(min_x, max_x);
    }

    fn collide_player_ball(&mut self, i: usize, input: Input) {
        let p = &mut self.players[i];
        if p.hit_cooldown > 0 {
            return;
        }
        let b = &mut self.ball;
        let (cx, cy, r) = hit_circle(p);
        let dx = b.x - cx;
        let dy = b.y - cy;
        let dist = dx.hypot(dy);
        if dist >= r + BALL_R {
            return;
        }

        p.hit_cooldown = HIT_COOLDOWN;
        p.last_hit = 0;

        if !p.on_ground && p.spike_timer > 0 && p.state == PlayerState::Normal {
            // 扣殺：方向鍵決定球路（上＝高吊、下＝重扣、往前＝更快）
            let dir = (input.right as i32 - input.left as i32) as f64;
            let forward = if dir == p.toward { 1.0 } else if dir == -p.toward { -1.0 } else { 0.0 };
            b.vx = p.toward * (15.0 + forward * 5.0) * p.stats.power;
            // 起跳時按的「上」一直沒放開的話不算高吊（用搖桿往上推起跳、推著不放是常見的情況）
            let lob = input.up && !p.jump_up_held;
            b.vy = (if lob { -9.0 } else if input.down { 13.0 } else { 3.0 }) * p.stats.power;
            b.power = true;
            p.spike_timer = 0;
            self.events.push(Event::Spike { side: i, x: b.x, y: b.y });
        } else {
            b.vx = (dx * 0.15).clamp(-9.0, 9.0) + p.vx * 0.15;
            // 正上方接球時稍微往對面送，避免永遠垂直彈
            if b.vx.abs() < 0.6 {
                b.vx = p.toward * 0.8;
            }
            b.vy = if p.state == PlayerState::Dive { -13.0 } else { -b.vy.abs().clamp(12.0, 15.0) };
            b.power = false;
            self.events.push(Event::Hit { side: i, x: b.x, y: b.y });
        }

        let speed = b.vx.hypot(b.vy);
        if speed > BALL_MAX_SPEED {
            b.vx *= BALL_MAX_SPEED / speed;
            b.vy *= BALL_MAX_SPEED / speed;
        }
        b.spin = b.vx * 0.02;

        // 把球推出判定圓外
        let (nx, ny) = if dist == 0.0 { (0.0, -1.0) } else { (dx / dist, dy / dist) };
        b.x = cx + nx * (r + BALL_R + 1.0);
        b.y = cy + ny * (r + BALL_R + 1.0);
    }

    fn land_ball(&mut self) {
        let b = &mut self.ball;
        b.y = GROUND - BALL_R;
        let scorer = if b.x < NET_X { 1 } else { 0 };
        let x = b.x;
        b.vy = -b.vy.abs() * 0.45;
        b.vx *= 0.5;
        b.power = false;
        self.last_scorer = Some(scorer);
        self.phase = Phase::Point;
        self.timer = POINT_FRAMES;
        self.score[scorer] += 1;
        self.events.push(Event::Ground { x });
        self.events.push(Event::Score { side: scorer });
    }

    fn finish_point(&mut self) {
        let Some(scorer) = self.last_scorer else { return };
        if self.score[scorer] >= self.target {
            self.phase = Phase::Over;
            self.winner = Some(scorer);
            self.events.push(Event::Over { side: scorer });
            return;
        }
        self.server = scorer;
        self.reset_rally();
    }
}

/// 球的運動（電腦預測落點也用這個），dt = 1 是一整個影格
pub fn step_ball(b: &mut Ball, dt: f64, mut events: Option<&mut Vec<Event>>) {
    b.vy += BALL_G * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if b.x < BALL_R {
        b.x = BALL_R;
        b.vx = b.vx.abs();
        if let Some(e) = events.as_deref_mut() {
            e.push(Event::Wall);
        }
    } else if b.x > W - BALL_R {
        b.x = W - BALL_R;
        b.vx = -b.vx.abs();
        if let Some(e) = events.as_deref_mut() {
            e.push(Event::Wall);
        }
    }

    // 球網：圓與長方形碰撞，往法線方向反彈
    let left = NET_X - NET_W / 2.0;
    let right = NET_X + NET_W / 2.0;
    let cx = b.x.clamp(left, right);
    let cy = b.y.clamp(NET_TOP, GROUND);
    let (mut dx, mut dy) = (b.x - cx, b.y - cy);
    let d2 = dx * dx + dy * dy;
    if d2 < BALL_R * BALL_R {
        let mut d = d2.sqrt();
        if d == 0.0 {
            dx = if b.vx > 0.0 { -1.0 } else { 1.0 };
            dy = 0.0;
            d = 1.0;
        }
        let (nx, ny) = (dx / d, dy / d);
        b.x = cx + nx * BALL_R;
        b.y = cy + ny * BALL_R;
        let vn = b.vx * nx + b.vy * ny;
        if vn < 0.0 {
            b.vx -= (1.0 + NET_BOUNCE) * vn * nx;
            b.vy -= (1.0 + NET_BOUNCE) * vn * ny;
            b.power = false;
            // 落在網子正上方時往旁邊滑，免得球停在網上
            if ny < -0.7 && b.vx.abs() < 1.5 {
                b.vx += if b.x >= NET_X { 1.5 } else { -1.5 };
            }
            if let Some(e) = events {
                e.push(Event::Net);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(up: bool, hit: bool, hit_pressed: bool) -> Input {
        Input { up, hit, hit_pressed, ..Input::default() }
    }

    /// 左邊的人照 frames 給的輸入起跳，最後一格把球放到他身邊，回傳碰球那一格的事件與球速
    fn jump_and_touch(frames: &[Input]) -> (bool, Ball) {
        let mut m = Match::new(["xiaocui", "aming"], 10);
        m.phase = Phase::Rally;
        let (last, before) = frames.split_last().unwrap();
        for &inp in before {
            // 球放遠一點，免得提早碰到
            m.ball = Ball { x: 800.0, y: 100.0, ..Ball::default() };
            m.step([inp, Input::default()]);
        }
        let p = &m.players[0];
        assert!(!p.on_ground, "碰球時應該還在空中");
        let (cx, cy, _) = hit_circle(p);
        m.ball = Ball { x: cx + 20.0, y: cy - 40.0, ..Ball::default() };
        m.step([*last, Input::default()]);
        let spiked = m.events.iter().any(|e| matches!(e, Event::Spike { .. }));
        (spiked, m.ball.clone())
    }

    #[test]
    fn holding_jump_up_still_spikes_instead_of_lobbing() {
        // 搖桿往上推起跳、一直推著，空中按擊球：要是扣殺（往下打），不是高吊
        let mut f = vec![input(true, false, false); 8];
        f.push(input(true, true, true));
        f.push(input(true, true, false));
        let (spiked, b) = jump_and_touch(&f);
        assert!(spiked);
        assert!(b.vy > 0.0, "不應該變成高吊，vy = {}", b.vy);
    }

    #[test]
    fn releasing_and_pressing_up_again_lobs() {
        let mut f = vec![input(true, false, false)];
        f.extend(vec![input(false, false, false); 5]);
        f.push(input(true, true, true));
        f.push(input(true, true, false));
        let (spiked, b) = jump_and_touch(&f);
        assert!(spiked);
        assert!(b.vy < 0.0, "放開再按上應該是高吊，vy = {}", b.vy);
    }

    #[test]
    fn jump_and_hit_in_the_same_frame_spikes() {
        let mut f = vec![input(true, true, true)];
        f.extend(vec![input(false, false, false); 6]);
        let (spiked, _) = jump_and_touch(&f);
        assert!(spiked, "同時按跳和擊球應該準備扣殺");
    }

    #[test]
    fn holding_hit_in_the_air_keeps_spike_ready() {
        // 很早就按下擊球而且一直按著，超過 SPIKE_WINDOW 才碰到球
        let mut f = vec![input(true, false, false), input(false, true, true)];
        f.extend(vec![input(false, true, false); SPIKE_WINDOW as usize + 6]);
        let (spiked, _) = jump_and_touch(&f);
        assert!(spiked, "空中按住擊球應該一直準備扣殺");
    }

    #[test]
    fn tapping_hit_too_early_is_a_normal_hit() {
        let mut f = vec![input(true, false, false), input(false, true, true)];
        f.extend(vec![input(false, false, false); SPIKE_WINDOW as usize + 6]);
        let (spiked, _) = jump_and_touch(&f);
        assert!(!spiked, "按一下就放開、太早按的話只是普通擊球");
    }
}
