import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add empty turbopack config to silence the warning
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Enable Web Workers support for client-side only
    if (!isServer) {
      // Add support for importing workers with new URL()
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[hash][ext][query]',
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;
