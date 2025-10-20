import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  allowedDevOrigins: [
    'https://plc-effect-anonymous-staying.trycloudflare.com',
  ],
};

export default nextConfig;
