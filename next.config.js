/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    IS_DEMO: process.env.IS_DEMO,
    IS_OS: process.env.IS_OS,
  }
}


module.exports = nextConfig
