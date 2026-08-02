/**
 * Host runner: when a guided agent has a pending action, auto-act after a short delay.
 */

import { getAgent } from "./store.js";
import { chooseGuidedAction } from "./policy.js";
import type { PendingLike } from "./policy.js";
import type { PlayerAction } from "../engine/holdem/types.js";

export type GuidedActFn = (
  agentId: string,
  body: {
    tableId: string;
    handId: string;
    seq: number;
    action: PlayerAction;
    message?: string;
  },
) => void;

const scheduled = new Set<string>();

/**
 * Schedule a guided bot action if agent.mode === 'guided'.
 * Keyed by handId:seq to avoid double-fire.
 */
export function scheduleGuidedIfNeeded(
  pending: PendingLike,
  act: GuidedActFn,
  delayMs = 400 + Math.floor(Math.random() * 600),
): void {
  const agent = getAgent(pending.agentId);
  if (!agent || agent.mode !== "guided") return;
  if (agent.status === "archived") return;

  const key = `${pending.handId}:${pending.seq}:${pending.agentId}`;
  if (scheduled.has(key)) return;
  scheduled.add(key);

  setTimeout(() => {
    scheduled.delete(key);
    try {
      const { action, message } = chooseGuidedAction(agent.strategy, pending);
      act(pending.agentId, {
        tableId: pending.tableId,
        handId: pending.handId,
        seq: pending.seq,
        action,
        message,
      });
    } catch (err) {
      console.warn("[guided-runner]", err);
    }
  }, delayMs);
}

export function clearGuidedScheduleForTests(): void {
  scheduled.clear();
}
