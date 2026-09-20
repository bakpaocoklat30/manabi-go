/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Abaikan error eslint saat build production (untuk server)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Abaikan error typescript jika ada sisa saat build di dalam docker
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
