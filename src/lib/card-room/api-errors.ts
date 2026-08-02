/**
 * Map network/CORS failures into operator-friendly copy.
 */

import { apiBaseUrl, ensureRuntimeConfig } from "./runtime-config";

export { apiBaseUrl, ensureRuntimeConfig } from "./runtime-config";

export function formatApiError(err: unknown, fallback = "request failed"): string {
  if (
    err instanceof TypeError ||
    (err instanceof Error && /failed to fetch/i.test(err.message))
  ) {
    const base = apiBaseUrl();
    const isLocal =
      base.includes("127.0.0.1") || base.includes("localhost");
    if (isLocal) {
      return `Cannot reach Card Room API at ${base}. Run \`npm run dev:api\` (or \`npm run dev:all\`) on this machine.`;
    }
    return `Cannot reach Card Room API at ${base}. The API may be waking up (free tier) — retry in a few seconds. Check CORS_ORIGINS includes this site origin.`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Await runtime config then run a fetch against the Card Room API base. */
export async function withApiBase<T>(
  fn: (base: string) => Promise<T>,
): Promise<T> {
  await ensureRuntimeConfig();
  return fn(apiBaseUrl());
}
