import type { GameState } from './state.ts';
import type { Command, CommandDef, DomainEvent } from './command.ts';
import type { GameContent } from '../content/index.ts';
import { validateState } from './invariants.ts';
import type { ChapterId } from '../content/schema.ts';

// ==========================================
// 1. Result Types
// ==========================================

export interface RunCommandSuccess {
  ok: true;
  state: GameState;
  events: DomainEvent[];
  command: Command;
}

export interface RunCommandFailure {
  ok: false;
  reason: string;
  state: GameState;
}

export type RunCommandResult = RunCommandSuccess | RunCommandFailure;

// ==========================================
// 2. Command Registry Class
// ==========================================

export class CommandRegistry {
  private handlers = new Map<string, CommandDef>();

  register(def: CommandDef<any>): void {
    if (this.handlers.has(def.type)) {
      throw new Error(`Command '${def.type}' is already registered in this registry.`);
    }
    this.handlers.set(def.type, def);
  }

  get(type: string): CommandDef | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  getAll(): CommandDef[] {
    return Array.from(this.handlers.values());
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Global default registry
export const defaultRegistry = new CommandRegistry();

export function registerCommand(def: CommandDef<any>): void {
  defaultRegistry.register(def);
}

// ==========================================
// 3. runCommand Executor
// ==========================================
// Pipeline: Guard -> Apply -> ValidateState
// If guard or validation fails, returns { ok: false, reason, state: originalState }

export function runCommand(
  state: GameState,
  cmd: Command,
  content: GameContent,
  registry: CommandRegistry = defaultRegistry
): RunCommandResult {
  const def = registry.get(cmd.type);
  if (!def) {
    return {
      ok: false,
      reason: `Unknown command type: '${cmd.type}'.`,
      state
    };
  }

  if (!cmd.payload || typeof cmd.payload !== 'object' || Array.isArray(cmd.payload)) {
    return { ok: false, reason: 'Command payload must be an object.', state };
  }
  // 1. Guard check
  const guardRes = def.guard(state, cmd.payload, content);
  if (guardRes === false || (typeof guardRes === 'object' && !guardRes.ok)) {
    const reason = typeof guardRes === 'object' && guardRes.reason
      ? guardRes.reason
      : `Guard check failed for command '${cmd.type}'.`;
    return {
      ok: false,
      reason,
      state
    };
  }

  // 2. Apply transition
  const applied = def.apply(state, cmd.payload, content);

  // Inverse snapshot commands must obey the same irreversible claim boundary as undo/checkout.
  if ((state.claimedRewardIds ?? []).some(id => !applied.state.claimedRewardIds?.includes(id))
    || Object.entries(state.journey).some(([id, progress]) => progress.claimed && !applied.state.journey[id as ChapterId]?.claimed)) {
    return { ok: false, reason: 'Cannot restore a state before a claimed reward.', state };
  }

  // 3. Invariants validation
  const validation = validateState(applied.state, content);
  if (!validation.valid) {
    return {
      ok: false,
      reason: `State invariant validation failed after '${cmd.type}': ${validation.errors.join('; ')}`,
      state // Rollback to previous state
    };
  }

  return {
    ok: true,
    state: applied.state,
    events: applied.events ?? [],
    command: cmd
  };
}
