//! Saving exported files from the standalone app.
//!
//! Desktop: opens a native save dialog (tauri-plugin-dialog) and writes the
//! file where the user chooses.
//! Android: writes the file to the app cache and hands it to
//! tauri-plugin-sharekit, which opens the system share sheet (the dialog
//! plugin does not provide a save dialog on mobile).

/// Opens a native save dialog and writes the file to the chosen location.
#[cfg(desktop)]
fn save_with_dialog(app: &tauri::AppHandle, filename: &str, data_b64: &str) -> Result<(), String> {
  use base64::Engine;
  use tauri_plugin_dialog::DialogExt;

  let bytes = base64::engine::general_purpose::STANDARD
    .decode(data_b64)
    .map_err(|e| format!("Invalid base64 data: {e}"))?;

  let mut dialog = app.dialog().file().set_file_name(filename);

  if let Some(ext) = filename.rsplit_once('.').map(|(_, ext)| ext) {
    dialog = dialog.add_filter("File", &[ext]);
  }

  // Sync commands run off the main thread, so the blocking variant is fine
  let Some(path) = dialog.blocking_save_file() else {
    return Ok(()); // user cancelled
  };

  let path = path
    .into_path()
    .map_err(|e| format!("Invalid save path: {e}"))?;
  std::fs::write(&path, bytes).map_err(|e| format!("Failed to write {}: {e}", path.display()))?;

  Ok(())
}

/// Writes the file into the app cache directory and opens the Android share
/// sheet via tauri-plugin-sharekit.
#[cfg(target_os = "android")]
async fn share_file_from_cache(
  app: &tauri::AppHandle,
  filename: &str,
  mime: &str,
  bytes: &[u8],
) -> Result<(), String> {
  use tauri::{Manager, WebviewWindow};
  use tauri_plugin_sharekit::ShareExt;

  let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
  std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
  let path = cache_dir.join(filename);
  std::fs::write(&path, bytes).map_err(|e| format!("Failed to write {}: {e}", path.display()))?;

  let window: WebviewWindow<_> = app.webview_windows().values().next().unwrap().clone();
  app
    .share()
    .share_file(
      window,
      format!("file://{}", path.display()),
      tauri_plugin_sharekit::ShareFileOptions {
        mime_type: Some(mime.to_string()),
        title: Some(filename.to_string()),
        position: None,
      },
    )
    .await
    .map_err(|e| e.to_string())
}

/// Saves an exported file through the OS.
#[tauri::command]
pub async fn export_file(
  app: tauri::AppHandle,
  filename: String,
  mime: String,
  data_b64: String,
) -> Result<(), String> {
  #[cfg(target_os = "android")]
  {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
      .decode(&data_b64)
      .map_err(|e| format!("Invalid base64 data: {e}"))?;
    return share_file_from_cache(&app, &filename, &mime, &bytes).await;
  }

  #[cfg(not(target_os = "android"))]
  {
    let _ = mime;
    return save_with_dialog(&app, &filename, &data_b64);
  }
}
