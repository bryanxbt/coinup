/**
 * Prefix **public asset** paths with the GitHub Pages basePath in production.
 * Use for img/src, fetch of static files, CSS url() — NOT for next/link or
 * router.push (Next already applies `basePath` to app routes).
 */
export function withBase(path: string): string {
  if (!path || path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!base) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === base || normalized.startsWith(`${base}/`)) {
    return normalized;
  }
  return `${base}${normalized}`;
}
