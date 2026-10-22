// 遊戲全部在前端（Svelte + Canvas）跑，這裡只負責開視窗。
// 之後要做連線對戰時，可以比照 TaiwanMahjong 在這裡開伺服器。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
