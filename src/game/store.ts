import { loadContent } from '../content';
import { createInitialState, createInitialTree, fromJSON, toJSON, dispatch, prune, type Command, type HistoryTree } from '../core';

export const SAVE_KEY = 'tiem-may-nep-save-v1';
export const content = loadContent();
export function freshTree() { return createInitialTree(createInitialState(content, { now: Date.now() }, { latVai: false })); }
export function restoreGame(): { tree: HistoryTree; notice: string; hasSave: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const result = fromJSON(raw, content);
      if (result.ok && !result.tree.nodes[result.tree.headId].snapshot.features.latVai) return { tree: result.tree, notice: 'Đã tiếp tục tiến trình được lưu.', hasSave: true };
      return { tree: freshTree(), notice: 'Bản lưu không hợp lệ. Tiệm đã bắt đầu một câu chuyện mới.', hasSave: false };
    }
    return { tree: freshTree(), notice: '', hasSave: false };
  } catch {
    return { tree: freshTree(), notice: 'Không đọc được bản lưu. Tiệm đã bắt đầu một câu chuyện mới.', hasSave: false };
  }
}
export function execute(tree: HistoryTree, command: Command) {
  const result = dispatch(tree, command, content, { now: Date.now() });
  if (!result.ok) return result;
  return { ...result, tree: prune(result.tree, 200) };
}
export function saveGame(tree: HistoryTree) {
  try { localStorage.setItem(SAVE_KEY, toJSON(tree)); return true; } catch { return false; }
}
