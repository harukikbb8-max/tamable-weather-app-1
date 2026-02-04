import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // ビルド時のルートを明示（Vercel などで lockfile 警告を防ぐ）
  turbopack: { root: process.cwd() },
};

export default nextConfig;
