/**
 * Prefix public asset paths with the GitHub Pages basePath in production.
 * next/image does not always apply basePath for unoptimized static export.
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
