/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // ✅ Ignores ALL ESLint warnings
  },
  typescript: {
    ignoreBuildErrors: true,   // ✅ Ignores ALL TypeScript errors
  },
};

module.exports = nextConfig;
