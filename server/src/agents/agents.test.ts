/**
 * Run: npx tsx --test src/agents/agents.test.ts
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  archiveAgent,
  createAgent,
  getAgentByApiKey,
  heartbeat,
  listByOwner,
  resetAgentsForTests,
  rotateApiKey,
  updateAgent,
} from "./store.js";
import { toPublic } from "./types.js";

describe("agents store", () => {
  beforeEach(() => {
    resetAgentsForTests();
  });

  it("creates agent and resolves API key once", () => {
    const { agent, apiKey } = createAgent({
      ownerPlayerId: "p1",
      name: "Felt Oracle",
      mode: "skill",
    });
    assert.ok(apiKey.startsWith("cr_agent_"));
    assert.equal(agent.mode, "skill");
    const found = getAgentByApiKey(apiKey);
    assert.ok(found);
    assert.equal(found!.id, agent.id);
    assert.equal(listByOwner("p1").length, 1);
  });

  it("hides api key hash from public view", () => {
    const { agent } = createAgent({
      ownerPlayerId: "p1",
      name: "Quiet Stack",
    });
    const pub = toPublic(agent);
    assert.equal("apiKeyHash" in pub, false);
    assert.equal(pub.name, "Quiet Stack");
  });

  it("heartbeat sets online", () => {
    const { agent, apiKey } = createAgent({
      ownerPlayerId: "p1",
      name: "Pulse",
    });
    assert.equal(agent.status, "offline");
    const a = getAgentByApiKey(apiKey)!;
    heartbeat(a, { version: "skill-0.1" });
    assert.equal(a.status, "online");
    assert.equal(a.heartbeatVersion, "skill-0.1");
  });

  it("rotate revokes old key", () => {
    const { agent, apiKey } = createAgent({
      ownerPlayerId: "p1",
      name: "Rotate Me",
    });
    const { apiKey: next } = rotateApiKey(agent.id, "p1");
    assert.equal(getAgentByApiKey(apiKey), null);
    assert.ok(getAgentByApiKey(next));
  });

  it("owner isolation on update", () => {
    const { agent } = createAgent({
      ownerPlayerId: "p1",
      name: "Mine",
    });
    assert.throws(() => updateAgent(agent.id, "p2", { name: "Stolen" }));
  });

  it("archive removes from list", () => {
    const { agent } = createAgent({
      ownerPlayerId: "p1",
      name: "Gone",
    });
    archiveAgent(agent.id, "p1");
    assert.equal(listByOwner("p1").length, 0);
  });
});
