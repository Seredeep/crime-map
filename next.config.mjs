/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // Temporalmente desactivamos ESLint durante el build
  },
  images: {
    domains: ['eplgvickazxsrlohrpan.supabase.co', 'maps.googleapis.com'],
  },
  experimental: {
    optimizePackageImports: ['@googlemaps/js-api-loader'],
  },
  // Configuración para solucionar problemas de cache en Windows
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack(config, { dev }) {
    config.module.exprContextCritical = false

    // Configuración específica para desarrollo en Windows
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  }
}

export default nextConfig
