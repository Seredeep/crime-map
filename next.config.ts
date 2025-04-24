import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["eplgvickazxsrlohrpan.supabase.co", 'maps.googleapis.com'],
  },
  experimental: {
    optimizePackageImports: ['@googlemaps/js-api-loader'],
  },
};

export default nextConfig;
