/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    newNextLinkBehavior: true,
    scrollRestoration: true,
  },
  env: {
    ORY_SDK_URL: process.env.ORY_SDK_URL,
    KRATOS_BROWSER_URL: process.env.KRATOS_BROWSER_URL,

  }

}


module.exports = nextConfig
