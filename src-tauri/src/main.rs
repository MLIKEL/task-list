#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backup;

use tauri::Manager;

#[tauri::command]
fn save_backup(content: String, default_name: String) -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("保存任务清单备份")
    .add_filter("任务清单备份", &["json"])
    .set_file_name(default_name)
    .save_file()
  else {
    return Ok(None);
  };

  backup::write_new_backup(&path, &content)?;
  Ok(Some(path.display().to_string()))
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _, _| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .invoke_handler(tauri::generate_handler![save_backup])
    .run(tauri::generate_context!())
    .expect("运行任务清单时发生错误");
}
