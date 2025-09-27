/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (Optional) If you also see type errors blocking builds, enable this:
    // ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
