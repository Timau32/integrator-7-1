import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Самодостаточный сервер для Docker-образа: `.next/standalone/server.js`. */
  output: "standalone",
};

export default nextConfig;
