/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@flue/sdk'],
  async rewrites() {
    return [
      {
        source: '/api/flue/:path*',
        destination: process.env.FLUE_API_URL
          ? `${process.env.FLUE_API_URL}/api/flue/:path*`
          : 'https://www.beaglabs.com/api/flue/:path*',
      },
    ]
  },
}

export default nextConfig
