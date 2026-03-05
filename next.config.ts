import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @hello-pangea/dnd v18 has a known issue with React 19 Strict Mode
  // (double-invocation of effects breaks the DnD sensor state machine).
  // Disable until the library fully supports React 19 concurrent features.
  reactStrictMode: false,
};

export default nextConfig;
