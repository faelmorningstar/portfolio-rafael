import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Vinext lê esta opção e exporta HTML em dist/client, não em .next/out.
  ...(process.env.PORTFOLIO_STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
};

export default nextConfig;
