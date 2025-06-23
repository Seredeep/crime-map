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
  experimental: {
    serverComponentsExternalPackages: ['@firebase/firestore']
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

    // Configuración de webpack para solucionar problemas de Firebase
    if (!isServer) {
      // Configuración para el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Ignorar módulos problemáticos de gRPC para Firebase
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@grpc/proto-loader': 'commonjs @grpc/proto-loader',
      });
    }

    // Resolver problemas específicos de Firebase
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config
  }
}

export default nextConfig
