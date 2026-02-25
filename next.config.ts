import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration du proxy pour rediriger /api/* vers le backend Express
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Proxy vers le backend Express
      },
    ];
  },
};

export default nextConfig;
