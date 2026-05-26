/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  env: {
    IS_DEV: process.env.IS_DEV,
  },
};

module.exports = nextConfig;
