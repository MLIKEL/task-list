#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

  std::fs::write(&path, content).map_err(|error| format!("无法保存备份：{error}"))?;
  Ok(Some(path.display().to_string()))
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_backup])
    .run(tauri::generate_context!())
    .expect("运行任务清单时发生错误");
}

