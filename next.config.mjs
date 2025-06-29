/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true, // Temporalmente desactivamos ESLint durante el build
  },
  images: {
    domains: ['eplgvickazxsrlohrpan.supabase.co', 'maps.googleapis.com'],
  },
  // Configuración para solucionar problemas de cache en Windows
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configuración para mejorar la compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack(config, { dev, isServer }) {
    config.module.exprContextCritical = false

    // Configuración específica para desarrollo en Windows
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
    }

    // Optimizaciones para el bundle
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      }
    }

    return config
  },
}

export default nextConfig
