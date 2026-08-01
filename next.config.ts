import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "coinup";
const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages: https://bryanxbt.github.io/coinup/
  output: "export",
  basePath,
  assetPrefix: isProd ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
