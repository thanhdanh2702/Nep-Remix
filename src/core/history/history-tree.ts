import type { Command, DomainEvent } from '../command.ts';
import type { ChapterId } from '../../content/schema.ts';
import type { GameState, ContextOptions } from '../state.ts';
import type { GameContent } from '../../content/index.ts';
import { runCommand, defaultRegistry } from '../registry.ts';
import { validateState } from '../invariants.ts';

// ==========================================
// 1. History Node and Tree Structure
// ==========================================

export interface HistoryNode {
  id: string;
  parentId: string | null;
  childIds: string[];
  command: Command | null; // null at root node
  snapshot: GameState; // immutable snapshot of game state
  lastVisitedChildId?: string | null;
  label?: string;
  createdAt: string; // from ctx, no Date.now()
}

export interface HistoryTree {
  replayOfChapter?: ChapterId;
  nodes: Record<string, HistoryNode>;
  rootId: string;
  headId: string;
  version: string;
}

function getTimestamp(ctx?: ContextOptions): string {
  if (typeof ctx?.now === 'function') {
    const res = ctx.now();
    return typeof res === 'number' ? new Date(res).toISOString() : String(res);
  }
  if (typeof ctx?.now === 'number') {
    return new Date(ctx.now).toISOString();
  }
  if (typeof ctx?.now === 'string') {
    return ctx.now;
  }
  return '1970-01-01T00:00:00.000Z';
}

// ==========================================
// 2. Factory: createInitialTree
// ==========================================

export function createInitialTree(
  initialState: GameState,
  ctx?: ContextOptions,
  version = '1.0.0'
): HistoryTree {
  const rootId = 'node-root';
  const rootNode: HistoryNode = {
    id: rootId,
    parentId: null,
    childIds: [],
    command: null,
    snapshot: initialState,
    lastVisitedChildId: null,
    label: 'Khởi đầu trò chơi',
    createdAt: getTimestamp(ctx)
  };

  return {
    nodes: {
      [rootId]: rootNode
    },
    rootId,
    headId: rootId,
    version
  };
}

// ==========================================
// 3. Tree Operations (Pure & Immutable)
// ==========================================

export interface DispatchSuccess {
  ok: true;
  tree: HistoryTree;
  events: DomainEvent[];
  nodeId: string;
}

export interface DispatchFailure {
  ok: false;
  reason: string;
  tree: HistoryTree;
}

export type DispatchResult = DispatchSuccess | DispatchFailure;

/**
 * Executes a command on the current head's snapshot.
 * If successful, creates a new child node, updates parent, and advances headId.
 * If failed, returns original tree with error reason.
 */
export function dispatch(
  tree: HistoryTree,
  cmd: Command,
  content: GameContent,
  ctx?: ContextOptions,
  label?: string
): DispatchResult {
  const currentHead = tree.nodes[tree.headId];
  if (!currentHead) {
    return {
      ok: false,
      reason: `Head node '${tree.headId}' does not exist in history tree.`,
      tree
    };
  }

  // Execute command pipeline
  const result = runCommand(currentHead.snapshot, cmd, content, defaultRegistry);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      tree
    };
  }

  const newNodeIndex = Math.max(1, ...Object.keys(tree.nodes).map(id => Number(/^node-(\d+)-/.exec(id)?.[1] ?? 0))) + 1;
  const safeType = cmd.type.replace(/\//g, '_');
  const newNodeId = `node-${newNodeIndex}-${safeType}`;

  const newNode: HistoryNode = {
    id: newNodeId,
    parentId: currentHead.id,
    childIds: [],
    command: cmd,
    snapshot: result.state,
    lastVisitedChildId: null,
    label,
    createdAt: getTimestamp(ctx)
  };

  const updatedHead: HistoryNode = {
    ...currentHead,
    childIds: [...currentHead.childIds, newNodeId],
    lastVisitedChildId: newNodeId
  };

  const nextTree: HistoryTree = {
    ...tree,
    headId: newNodeId,
    nodes: {
      ...tree.nodes,
      [currentHead.id]: updatedHead,
      [newNodeId]: newNode
    }
  };

  return {
    ok: true,
    tree: nextTree,
    events: result.events ?? [],
    nodeId: newNodeId
  };
}

/**
 * Moves headId to parent node (if exists) and records lastVisitedChildId.
 * Does NOT delete any nodes.
 */
function preservesClaims(tree: HistoryTree, target: GameState): boolean {
  // Claim markers in any branch are irreversible, including legacy snapshots.
  return Object.values(tree.nodes).every(node =>
    Object.entries(node.snapshot.journey).every(([id, progress]) => !progress.claimed || target.journey[id as ChapterId]?.claimed)
    && (node.snapshot.claimedRewardIds ?? []).every(id => target.claimedRewardIds?.includes(id)));
}

export function undo(tree: HistoryTree): { ok: boolean; tree: HistoryTree; reason?: string } {
  const currentHead = tree.nodes[tree.headId];
  if (!currentHead || !currentHead.parentId) {
    return {
      ok: false,
      reason: 'Already at root node; cannot undo further.',
      tree
    };
  }

  const parent = tree.nodes[currentHead.parentId];
  if (!parent) {
    return {
      ok: false,
      reason: `Parent node '${currentHead.parentId}' not found.`,
      tree
    };
  }

  if (!preservesClaims(tree, parent.snapshot)) return { ok: false, tree, reason: 'Cannot undo a claimed reward.' };

  const updatedParent: HistoryNode = {
    ...parent,
    lastVisitedChildId: currentHead.id
  };

  const nextTree: HistoryTree = {
    ...tree,
    headId: parent.id,
    nodes: {
      ...tree.nodes,
      [parent.id]: updatedParent
    }
  };

  return {
    ok: true,
    tree: nextTree
  };
}

/**
 * Moves headId to lastVisitedChildId (if exists, or to most recent child).
 */
export function redo(tree: HistoryTree): { ok: boolean; tree: HistoryTree; reason?: string } {
  const currentHead = tree.nodes[tree.headId];
  if (!currentHead) {
    return { ok: false, reason: 'Invalid head node.', tree };
  }

  const targetChildId =
    currentHead.lastVisitedChildId ??
    (currentHead.childIds.length > 0
      ? currentHead.childIds[currentHead.childIds.length - 1]
      : null);

  if (!targetChildId || !tree.nodes[targetChildId]) {
    return {
      ok: false,
      reason: 'No child node to redo to.',
      tree
    };
  }

  if (!preservesClaims(tree, tree.nodes[targetChildId].snapshot)) return { ok: false, tree, reason: 'Cannot restore a branch before a claimed reward.' };

  const nextTree: HistoryTree = {
    ...tree,
    headId: targetChildId
  };

  return {
    ok: true,
    tree: nextTree
  };
}

/**
 * Moves head to any target node in the tree after validating its snapshot.
 * If validation fails, head does not move.
 */
export function checkout(
  tree: HistoryTree,
  nodeId: string,
  content: GameContent
): { ok: boolean; tree: HistoryTree; reason?: string } {
  const targetNode = tree.nodes[nodeId];
  if (!targetNode) {
    return {
      ok: false,
      reason: `Node '${nodeId}' not found in history tree.`,
      tree
    };
  }

  if (!preservesClaims(tree, targetNode.snapshot)) return { ok: false, tree, reason: 'Cannot checkout before a claimed reward.' };

  const validation = validateState(targetNode.snapshot, content);
  if (!validation.valid) {
    return {
      ok: false,
      reason: `Cannot checkout node '${nodeId}': invariants violated (${validation.errors.join('; ')}).`,
      tree
    };
  }

  return {
    ok: true,
    tree: {
      ...tree,
      headId: nodeId
    }
  };
}

/**
 * Reverts the command at a specific nodeId by computing its inverse and dispatching it
 * as a brand new forward command onto the current head.
 * If the command is one-way, returns an error instructing to use checkout instead.
 */
export function revert(
  tree: HistoryTree,
  nodeId: string,
  content: GameContent,
  ctx?: ContextOptions
): DispatchResult {
  const targetNode = tree.nodes[nodeId];
  if (!targetNode) {
    return {
      ok: false,
      reason: `Node '${nodeId}' not found in history tree.`,
      tree
    };
  }

  if (!targetNode.command) {
    return {
      ok: false,
      reason: 'không có lệnh nghịch đảo, dùng checkout',
      tree
    };
  }

  const def = defaultRegistry.get(targetNode.command.type);
  if (!def || def.kind === 'one-way' || !def.invert) {
    return {
      ok: false,
      reason: 'không có lệnh nghịch đảo, dùng checkout',
      tree
    };
  }

  // Compute inverse using parent snapshot
  const parentNode = targetNode.parentId ? tree.nodes[targetNode.parentId] : null;
  const baseSnapshot = parentNode ? parentNode.snapshot : targetNode.snapshot;
  const inverseCmd = def.invert(baseSnapshot, targetNode.command.payload, content);

  if (!inverseCmd) {
    return {
      ok: false,
      reason: 'không có lệnh nghịch đảo, dùng checkout',
      tree
    };
  }

  return dispatch(tree, inverseCmd, content, ctx, `revert(${nodeId})`);
}

/**
 * Returns a list of all leaf nodes along with the path from root to that leaf.
 */
export function branches(
  tree: HistoryTree
): Array<{ leafId: string; path: string[]; leafLabel?: string }> {
  const results: Array<{ leafId: string; path: string[]; leafLabel?: string }> = [];

  for (const node of Object.values(tree.nodes)) {
    if (node.childIds.length === 0) {
      // Trace path from root to this leaf
      const path: string[] = [];
      let current: HistoryNode | undefined = node;
      while (current) {
        path.unshift(current.id);
        current = current.parentId ? tree.nodes[current.parentId] : undefined;
      }
      results.push({
        leafId: node.id,
        path,
        leafLabel: node.label
      });
    }
  }

  return results;
}

/**
 * Prunes history tree to keep total nodes <= maxNodes (default 200).
 * Removes unprotected leaves first. If the active path itself exceeds the
 * budget, rolls its oldest snapshot into a checkpoint root, preserving replay.
 */
export function prune(tree: HistoryTree, maxNodes = 200): HistoryTree {
  maxNodes = Math.max(2, Math.floor(maxNodes));
  const allNodeIds = Object.keys(tree.nodes);
  if (allNodeIds.length <= maxNodes) {
    return tree;
  }

  // 1. Mark protected nodes
  const protectedIds = new Set<string>();
  protectedIds.add(tree.rootId);
  protectedIds.add(tree.headId);

  // Mark all ancestors of head
  let curr: HistoryNode | undefined = tree.nodes[tree.headId];
  while (curr) {
    protectedIds.add(curr.id);
    curr = curr.parentId ? tree.nodes[curr.parentId] : undefined;
  }

  // Mark all nodes with a label
  for (const node of Object.values(tree.nodes)) {
    if (node.label && node.label.trim() !== '') {
      protectedIds.add(node.id);
    }
  }

  const nextNodes = Object.fromEntries(Object.entries(tree.nodes).map(([id, node]) => [id, { ...node, childIds: [...node.childIds] }]));
  while (Object.keys(nextNodes).length > maxNodes) {
    const leaf = Object.values(nextNodes).filter(node => !protectedIds.has(node.id) && !node.childIds.length)
      .sort((a,b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (!leaf) break;
    delete nextNodes[leaf.id];
    const parent = leaf.parentId ? nextNodes[leaf.parentId] : undefined;
    if (parent) {
      parent.childIds = parent.childIds.filter(id => id !== leaf.id);
      if (parent.lastVisitedChildId === leaf.id) parent.lastVisitedChildId = parent.childIds.at(-1) ?? null;
    }
  }
  if (Object.keys(nextNodes).length <= maxNodes) return { ...tree, nodes: nextNodes };

  const path: HistoryNode[] = [];
  let node: HistoryNode | undefined = tree.nodes[tree.headId];
  while (node) { path.unshift(node); node = node.parentId ? tree.nodes[node.parentId] : undefined; }
  const retained = path.slice(1).slice(-(maxNodes - 1));
  if (!retained.length) return { ...tree, nodes: { [tree.rootId]: { ...tree.nodes[tree.rootId], childIds: [], lastVisitedChildId: null } } };
  const firstIndex = path.indexOf(retained[0]);
  const checkpoint = path[Math.max(0, firstIndex - 1)];
  const compacted: Record<string, HistoryNode> = {
    [tree.rootId]: { ...checkpoint, id: tree.rootId, parentId: null, command: null, label: 'Mốc lưu tiến trình', childIds: [retained[0].id], lastVisitedChildId: retained[0].id },
  };
  retained.forEach((entry, index) => {
    const childId = retained[index + 1]?.id;
    compacted[entry.id] = { ...entry, parentId: index ? retained[index-1].id : tree.rootId,
      childIds: childId ? [childId] : [], lastVisitedChildId: childId ?? null };
  });
  return { ...tree, nodes: compacted };
}
