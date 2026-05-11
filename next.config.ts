import type { NextConfig } from "next";

const isStatic = process.env.DEPLOY_TARGET === "github-pages";
const basePath = isStatic ? process.env.BASE_PATH || "/DWAV-job-visualizer" : undefined;

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  images: isStatic ? { unoptimized: true } : undefined,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath || "",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
