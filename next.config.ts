import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Resolve page metadata before rendering so canonical links stay in <head>.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
