use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

pub fn write_new_backup(path: &Path, content: &str) -> Result<(), String> {
    let parent = path.parent().ok_or_else(|| "无法确定备份目录。".to_string())?;
    let file_name = path.file_name().and_then(|name| name.to_str()).unwrap_or("backup.json");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("无法创建临时备份文件：{error}"))?
        .as_nanos();
    let temporary = parent.join(format!(".{file_name}.{nonce}.tmp"));

    let result = (|| -> std::io::Result<()> {
        let mut file = OpenOptions::new().write(true).create_new(true).open(&temporary)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        if path.exists() {
            return Err(std::io::Error::new(std::io::ErrorKind::AlreadyExists, "同名备份已存在，请换一个文件名"));
        }
        fs::rename(&temporary, path)?;
        Ok(())
    })();

    if let Err(error) = result {
        let _ = fs::remove_file(&temporary);
        return Err(format!("无法保存备份：{error}"));
    }
    Ok(())
}
