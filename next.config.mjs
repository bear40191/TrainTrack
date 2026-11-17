/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 800, // Poll every 800ms to guarantee hot reload on Windows drives
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;

