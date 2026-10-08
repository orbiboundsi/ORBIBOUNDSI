/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@orbibound-ai/backend', '@orbibound-ai/database'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
    };
    return config;
  },
};

export default nextConfig;
