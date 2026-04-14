const repoName = '/codycross-code-local';
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPagesBuild ? repoName : '',
  assetPrefix: isGitHubPagesBuild ? repoName : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'addressables.codycross-game.com' },
    ],
  },
};

module.exports = nextConfig;
