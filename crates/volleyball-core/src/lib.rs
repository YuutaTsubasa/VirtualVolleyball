//! 虛擬台麻館沙灘排球的比賽引擎。
//! - `game`：物理與規則（確定性，同樣輸入同樣結果）
//! - `ai`：電腦玩家
//! - `room`：連線房間（座位、電腦補位、聊天）
//! - `characters`：角色能力值

pub mod ai;
pub mod characters;
pub mod game;
pub mod room;

#[cfg(test)]
mod tests {
    use crate::ai::{Ai, Difficulty};
    use crate::game::{Event, Match, Phase};
    use crate::room::{Room, Settings};

    fn play(a: Difficulty, b: Difficulty, target: u32, seed: u64) -> (Match, u32) {
        let mut m = Match::new(["xiaochun", "aming"], target);
        let mut ais = [Ai::new(0, a, seed), Ai::new(1, b, seed + 1)];
        let mut rallies = 0;
        for _ in 0..60 * 60 * 40 {
            let inputs = [ais[0].think(&m), ais[1].think(&m)];
            m.step(inputs);
            rallies += m.events.iter().filter(|e| matches!(e, Event::Score { .. })).count() as u32;
            if m.phase == Phase::Over {
                break;
            }
        }
        (m, rallies)
    }

    #[test]
    fn cpu_matches_finish() {
        for seed in 0..3 {
            let (m, rallies) = play(Difficulty::Normal, Difficulty::Normal, 10, seed);
            assert_eq!(m.phase, Phase::Over, "比賽應該打得完");
            assert_eq!(rallies, m.score[0] + m.score[1]);
            assert_eq!(m.score[m.winner.unwrap()], 10);
        }
    }

    #[test]
    fn harder_cpu_wins_more() {
        let mut hard_wins = 0;
        for seed in 0..6 {
            let (m, _) = play(Difficulty::Hard, Difficulty::Easy, 7, seed * 10);
            if m.winner == Some(0) {
                hard_wins += 1;
            }
        }
        assert!(hard_wins >= 5, "困難應該幾乎都贏簡單，實際 {}/6", hard_wins);
    }

    #[test]
    fn room_fills_bots_and_plays() {
        let mut room = Room::new(Settings { target: 3, ..Settings::default() });
        let (seat, token) = room.join("悠太", Some("xiaocui")).unwrap();
        room.connect(seat);
        assert_eq!(room.seat_of_token(&token), Some(seat));
        room.start().unwrap();
        assert!(room.join("晚到的人", None).is_err());
        // 玩家斷線：電腦接手，比賽仍然打得完
        room.disconnect(seat);
        for _ in 0..60 * 60 * 20 {
            room.tick();
            if room.game.as_ref().unwrap().phase == Phase::Over {
                break;
            }
        }
        assert_eq!(room.game.as_ref().unwrap().phase, Phase::Over);
        let frame = room.frame().unwrap();
        assert!(frame["players"][0]["onGround"].is_boolean());
        assert_eq!(frame["players"][0]["character"], "xiaocui");
        room.reset_to_lobby();
        assert_eq!(room.view(Some(0))["phase"], "lobby");
    }
}
