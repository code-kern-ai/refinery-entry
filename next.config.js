/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    IS_DEV: process.env.IS_DEV,
  }
}


module.exports = nextConfig
