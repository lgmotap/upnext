import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/crew/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.google.com https://maps.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
