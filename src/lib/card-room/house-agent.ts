/**
 * Seat a house guided agent for players who don't want to craft strategy yet.
 * Presets + custom knobs → create guided agent via API.
 */

import { createAgent, listMyAgents, type AgentPublic } from "./agents-client";

const HOUSE_PREFIX = "House ";

export type StrategyKnobs = {
  tightness: number;
  aggression: number;
  bluffFrequency: number;
};

export type HousePreset = {
  id: string;
  name: string;
  blurb: string;
  strategy: StrategyKnobs;
};

/** Named house reference policies (host-guided). */
export const HOUSE_PRESETS: HousePreset[] = [
  {
    id: "balanced",
    name: "House Balanced",
    blurb: "Default reference — solid folds, selective value.",
    strategy: { tightness: 50, aggression: 45, bluffFrequency: 18 },
  },
  {
    id: "tight",
    name: "House Rock",
    blurb: "Tight-passive. Waits for strong hands; rare bluffs.",
    strategy: { tightness: 78, aggression: 28, bluffFrequency: 8 },
  },
  {
    id: "tag",
    name: "House TAG",
    blurb: "Tight-aggressive. Selective opens, strong barrels.",
    strategy: { tightness: 68, aggression: 62, bluffFrequency: 22 },
  },
  {
    id: "lag",
    name: "House LAG",
    blurb: "Loose-aggressive. More pots, more pressure.",
    strategy: { tightness: 32, aggression: 72, bluffFrequency: 35 },
  },
  {
    id: "calling",
    name: "House Station",
    blurb: "Loose-passive. Calls too often; light on bluffs.",
    strategy: { tightness: 28, aggression: 22, bluffFrequency: 12 },
  },
];

export function findExistingHouseAgent(
  agents: AgentPublic[],
): AgentPublic | undefined {
  return agents.find(
    (a) =>
      a.name.startsWith(HOUSE_PREFIX) ||
      a.handle.startsWith("house_") ||
      (a.mode === "guided" && a.name.toLowerCase().includes("house")),
  );
}

export async function ensureHouseAgent(
  strategy?: Partial<StrategyKnobs> & { notes?: string; name?: string },
): Promise<AgentPublic & { apiKey?: string }> {
  if (!strategy) {
    const mine = await listMyAgents();
    const existing = findExistingHouseAgent(mine);
    if (existing) return existing;
  }

  const knobs = {
    tightness: strategy?.tightness ?? 50,
    aggression: strategy?.aggression ?? 45,
    bluffFrequency: strategy?.bluffFrequency ?? 18,
  };
  const n = Math.floor(1000 + Math.random() * 9000);
  const name =
    strategy?.name?.trim() ||
    `${HOUSE_PREFIX}Bot ${n}`;

  const created = await createAgent({
    name,
    mode: "guided",
    strategy: {
      ...knobs,
      preferredGames: ["texas-holdem"],
      notes: strategy?.notes ?? "Card Room house reference policy",
    },
  });
  return { ...created.agent, apiKey: created.apiKey };
}

export async function createHouseFromPreset(
  preset: HousePreset,
  overrides?: Partial<StrategyKnobs>,
): Promise<AgentPublic & { apiKey?: string }> {
  return ensureHouseAgent({
    name: preset.name,
    tightness: overrides?.tightness ?? preset.strategy.tightness,
    aggression: overrides?.aggression ?? preset.strategy.aggression,
    bluffFrequency: overrides?.bluffFrequency ?? preset.strategy.bluffFrequency,
    notes: `House preset: ${preset.id}`,
  });
}
