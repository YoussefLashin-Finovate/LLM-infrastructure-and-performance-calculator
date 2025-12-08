/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'finov8.ai',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig
