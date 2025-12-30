import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_BASE_PATH === '/cloud-armor-dashboard';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGithubPages ? '/cloud-armor-dashboard' : '',
  assetPrefix: isGithubPages ? '/cloud-armor-dashboard/' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
