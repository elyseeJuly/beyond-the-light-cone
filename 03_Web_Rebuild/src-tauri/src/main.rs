// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod steamworks;

fn main() {
    // Steamworks 桥接当前为预留桩，构建时验证其类型与编译可用性
    let _steam = steamworks::SteamBridge::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}