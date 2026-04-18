const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withAntdLess = require('next-plugin-antd-less');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // swcMinify: true,
  compiler: {
    styledComponents: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: '/api/auth/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
  transpilePackages: [
    '@ant-design/icons',
    'antd',
    '@ant-design/icons-svg',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'ag-grid-community',
    'ag-grid-react',
    'ag-grid-enterprise',
  ],
};

module.exports = withBundleAnalyzer(withAntdLess(nextConfig));