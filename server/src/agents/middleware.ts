import type { Context, Next } from "hono";
import { getAgentByApiKey } from "./store.js";
import type { AgentRecord } from "./types.js";

function extractBearer(c: Context): string | null {
  const h = c.req.header("authorization") ?? c.req.header("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

/** Agent skill path — API key bearer only (cannot withdraw owner funds). */
export async function requireAgentKey(c: Context, next: Next) {
  const token = extractBearer(c);
  if (!token || !token.startsWith("cr_agent_")) {
    return c.json(
      {
        error: "unauthorized",
        message: "Agent API key required (Authorization: Bearer cr_agent_…)",
      },
      401,
    );
  }
  const agent = getAgentByApiKey(token);
  if (!agent) {
    return c.json(
      { error: "unauthorized", message: "invalid or rotated agent API key" },
      401,
    );
  }
  c.set("agent", agent);
  await next();
}

export function agentOf(c: Context): AgentRecord {
  return c.get("agent") as AgentRecord;
}
