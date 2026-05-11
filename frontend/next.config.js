/** @type {import('next').NextConfig} */
console.log('BACKEND_URL:', process.env.BACKEND_URL);
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'api.unt.edu.pe'],
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
}

module.exports = nextConfig