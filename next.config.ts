import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/gateio/:path*',
        destination: 'https://api.gateio.ws/api/v4/:path*',
      },
    ];
  },
};

export default nextConfig;
