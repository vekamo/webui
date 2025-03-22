import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ✅ Required for Docker production builds
  eslint: {
    ignoreDuringBuilds: true, // ✅ This disables ESLint on build
  },
};

export default nextConfig;
