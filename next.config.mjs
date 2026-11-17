/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide 'X-Powered-By: Next.js' signature to prevent fingerprinting
  async headers() {
    // Only enforce strict security headers like HSTS in production
    // In dev mode, HSTS and nosniff can interfere with localhost CSS/chunk loading
    if (!isProd) {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use memory cache in development to avoid Windows PackFileCacheStrategy ENOENT/rename errors
      config.cache = { type: 'memory' };
      config.watchOptions = {
        poll: 800, // Poll every 800ms for reliable hot reloading on Windows
        aggregateTimeout: 200,
      };
    }
    return config;
  },
};

export default nextConfig;


