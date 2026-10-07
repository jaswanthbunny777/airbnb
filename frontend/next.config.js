/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
