import type { NextConfig } from "next";

// In the deployed single container, the FastAPI backend runs on 127.0.0.1:8000.
// BACKEND_URL can override for other setups. Proxying /api and /assets keeps the
// browser talking to one origin (the Next server), which then forwards to FastAPI.
const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/assets/:path*", destination: `${backend}/assets/:path*` },
    ];
  },
};

export default nextConfig;
