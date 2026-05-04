/** @type {import('next').NextConfig} */
console.log('BACKEND_URL:', process.env.BACKEND_URL);
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'api.unt.edu.pe'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig