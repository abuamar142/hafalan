import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', '@cloudflare/kumo'],
  },
}

export default nextConfig
