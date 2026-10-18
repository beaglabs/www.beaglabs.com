/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep server-only native/dynamic-require packages out of the bundle so
  // Turbopack doesn't trace their optional dynamic requires (pg loads
  // pg-native/pg-cloudflare, takumi loads a platform-specific .node binary).
  // Silences: "Cannot find module as expression is too dynamic".
  serverExternalPackages: ["@takumi-rs/core", "takumi-js", "pg"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.graphcms.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
      {
        protocol: 'https',
        hostname: 'tpucdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.britannica.com',
      },
    ],
  },
  // Consulting offers retired when the site moved to Papyrus as an agentic ERP.
  async redirects() {
    return ['spec-drive-development', 'agent-ux', 'slm-feasibility', 'slm-deployment'].map((slug) => ({
      source: `/capability/${slug}`,
      destination: '/capabilities',
      permanent: true,
    }))
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ]
  },
}

export default nextConfig
