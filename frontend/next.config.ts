import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Disable image optimization to avoid sharp dependency issues in Amplify
  images: {
    unoptimized: true,
  },
  
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
