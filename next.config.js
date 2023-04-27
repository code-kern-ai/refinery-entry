/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    KRATOS_BROWSER_URL: process.env.KRATOS_BROWSER_URL,
  }
}


module.exports = nextConfig
