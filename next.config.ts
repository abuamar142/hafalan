import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@cloudflare/kumo'],
  },
}

export default nextConfig
