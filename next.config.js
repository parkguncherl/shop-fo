const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,

  async rewrites() {
    return [
      {
        source: '/shop-ap/:path*',
        destination: `${process.env.NEXT_SERVER_API_ENDPOINT}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/auth/:slug',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },

  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);
