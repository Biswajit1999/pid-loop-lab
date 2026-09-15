import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isPages = process.env.GITHUB_ACTIONS === "true" && repository !== "";
const basePath = isPages ? `/${repository}` : "";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
