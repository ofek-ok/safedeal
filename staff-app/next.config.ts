import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { useTypeScriptCli: false },
  typescript: { tsconfigPath: "tsconfig.next.json" },
};

export default nextConfig;
