/**
 * Open URL in default browser using Tauri shell plugin
 * This is required in Tauri 2.0 since target="_blank" doesn't work
 */
import { open } from '@tauri-apps/plugin-shell';

export async function openUrl(url: string): Promise<void> {
  try {
    await open(url);
  } catch (error) {
    console.error('Failed to open URL:', error);
    // Fallback: try window.open (won't work in Tauri but useful for dev)
    window.open(url, '_blank');
  }
}

export default openUrl;
