import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' }, // Changed from SAMEORIGIN to DENY to fully prevent clickjacking
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // Allow necessary connections: Next.js dev, external APIs, and WebSockets. Block all frame embedding.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://valorexinthium.com wss://api.gateio.ws wss://ws.gate.io https://open.er-api.com http://localhost:* ws://localhost:*; img-src 'self' data: https:; font-src 'self' data: https: https://fonts.gstatic.com; frame-ancestors 'none';"
          },
        ],
      },
    ];
  },
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
