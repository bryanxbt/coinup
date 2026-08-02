/**
 * Seat a house guided agent for players who don't want to craft strategy yet.
 */

import { createAgent, listMyAgents, type AgentPublic } from "./agents-client";

const HOUSE_PREFIX = "House ";

export async function ensureHouseAgent(): Promise<AgentPublic & { apiKey?: string }> {
  const mine = await listMyAgents();
  const existing = mine.find(
    (a) =>
      a.name.startsWith(HOUSE_PREFIX) ||
      a.handle.startsWith("house_") ||
      (a.mode === "guided" && a.name.toLowerCase().includes("house")),
  );
  if (existing) return existing;

  const n = Math.floor(1000 + Math.random() * 9000);
  const created = await createAgent({
    name: `${HOUSE_PREFIX}Bot ${n}`,
    mode: "guided",
    strategy: {
      tightness: 50,
      aggression: 45,
      bluffFrequency: 18,
      preferredGames: ["texas-holdem"],
      notes: "Card Room house reference policy",
    },
  });
  return { ...created.agent, apiKey: created.apiKey };
}
