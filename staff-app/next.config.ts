import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { useTypeScriptCli: false },
  typescript: { tsconfigPath: "tsconfig.next.json" },
  async redirects() {
    return [
      {
        source: "/staff",
        destination: "https://safedeal-coral.vercel.app/staff",
        permanent: false,
      },
      {
        source: "/",
        destination: "https://safedeal-coral.vercel.app/staff",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
