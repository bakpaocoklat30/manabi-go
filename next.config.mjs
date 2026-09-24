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
  },
  async headers() {
    return [
      {
        // Cegah browser meng-cache halaman login dan auth
        source: '/login',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Cegah caching pada API autentikasi dan session
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        // Pastikan dokumen HTML halaman tidak di-cache oleh browser setelah update container
        // Tetap izinkan static assets (chunks, images, uploads) di-cache efisien
        source: '/((?!_next/static|_next/image|uploads/|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
