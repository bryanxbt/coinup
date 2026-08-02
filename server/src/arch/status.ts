/**
 * Probe local / remote Arch stack for health endpoints.
 * Does not require a running chain for API boot — reports connectivity only.
 */

export type ServiceProbe = {
  name: string;
  url: string;
  ok: boolean;
  detail?: string;
  latencyMs?: number;
};

async function probeHttp(
  name: string,
  url: string,
  init?: RequestInit,
): Promise<ServiceProbe> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(2500),
    });
    return {
      name,
      url,
      ok: res.ok,
      detail: `HTTP ${res.status}`,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      name,
      url,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - started,
    };
  }
}

export async function probeArchStack(opts: {
  archRpcUrl: string;
  titanUrl: string;
  bitcoinRpcUrl: string;
}): Promise<{
  ready: boolean;
  services: ServiceProbe[];
  guidance: string[];
}> {
  const services = await Promise.all([
    // Titan tip is a simple GET on local ship-devnet
    probeHttp("titan", `${opts.titanUrl.replace(/\/$/, "")}/tip`),
    // Arch RPC: try a lightweight GET; many nodes only accept JSON-RPC POST
    probeHttp("arch-rpc", opts.archRpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "get_block_height",
        params: [],
      }),
    }),
    // bitcoind regtest often needs auth — connectivity probe via TCP-less HTTP
    probeHttp("bitcoin-rpc", opts.bitcoinRpcUrl),
  ]);

  const ready = services.some((s) => s.name === "arch-rpc" && s.ok);
  const guidance = [
    "Local Arch (this machine): source archie env and start devnet:",
    "  source /Volumes/BryanXBTLacie/archie/scripts/env.sh",
    "  bash /Volumes/BryanXBTLacie/archie/scripts/start-local-devnet.sh",
    "Arch RPC default: http://127.0.0.1:9002 (local_validator)",
    "Titan default:    http://127.0.0.1:8080",
    "Bitcoin regtest:  http://127.0.0.1:18443",
    "Docs: https://docs.arch.network · https://book.arch.network",
  ];

  return { ready, services, guidance };
}
