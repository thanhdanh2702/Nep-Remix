import { loadContent } from '../content';
import { createInitialState, createInitialTree, fromJSON, toJSON, dispatch, prune, type Command, type HistoryTree } from '../core';

export const SAVE_KEY = 'tiem-may-nep-save-v1';
export const SAVE_BACKUP_KEY = `${SAVE_KEY}-backup`;
export const content = loadContent();
let protectedSave: string | null = null;
export type RestoreStatus = 'empty' | 'restored' | 'migrated' | 'invalid' | 'unavailable';
export function freshTree() { return createInitialTree(createInitialState(content, { now: Date.now() }, { latVai: false })); }
export function restoreGame(): { tree: HistoryTree; notice: string; hasSave: boolean; status: RestoreStatus; reason?: string } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    protectedSave = raw;
    if (raw) {
      const result = fromJSON(raw, content);
      if (result.ok && !result.tree.nodes[result.tree.headId].snapshot.features.latVai) {
        if (!result.migrated) protectedSave = null;
        return { tree: result.tree, notice: 'Đã tiếp tục tiến trình được lưu.', hasSave: true, status: result.migrated ? 'migrated' : 'restored' };
      }
      return { tree: freshTree(), notice: 'Bản lưu không hợp lệ. Bản gốc được giữ lại; chưa lưu câu chuyện mới.', hasSave: false, status: 'invalid', reason: !result.ok ? result.reason : 'Lật vải đang tắt.' };
    }
    return { tree: freshTree(), notice: '', hasSave: false, status: 'empty' };
  } catch {
    return { tree: freshTree(), notice: 'Không đọc được bản lưu. Chưa thể lưu tiến trình.', hasSave: false, status: 'unavailable' };
  }
}
export function execute(tree: HistoryTree, command: Command) {
  const result = dispatch(tree, command, content, { now: Date.now() });
  if (!result.ok) return result;
  return { ...result, tree: prune(result.tree, 200) };
}
export function saveGame(tree: HistoryTree): boolean {
  try {
    // Check existing bytes even before restoreGame, and preserve rather than overwrite invalid saves.
    const existing = localStorage.getItem(SAVE_KEY);
    if (existing) {
      const loaded = fromJSON(existing, content);
      if (!loaded.ok) return false;
      if (loaded.migrated || protectedSave === existing) localStorage.setItem(SAVE_BACKUP_KEY, existing);
    }
    localStorage.setItem(SAVE_KEY, toJSON(tree));
    protectedSave = null;
    return true;
  } catch { return false; }
}
