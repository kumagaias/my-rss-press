/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'export',
  
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  },
  
  // Image optimization - disable for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
