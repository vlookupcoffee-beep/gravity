/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; object-src 'none'; base-uri 'self';"
          }
        ],
      },
    ]
  },
};

export default nextConfig;
