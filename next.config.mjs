/** @type {import('next').NextConfig} */
const nextConfig = {
  // gzip/br for HTML, CSS and JS payloads.
  compress: true,
  poweredByHeader: false,
  // ioredis is server-only and pulls in Node built-ins; keep it out of any
  // client chunk even if a shared module imports the cache helpers.
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'springgreen-salmon-184354.hostingersite.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    // Long-lived caching for the optimised image pipeline. Bump the version
    // path when the loader's output format changes.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Shared chunks change on nearly every deploy, so keep them revalidated
  // rather than pinned for a year by the default immutable rule.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};
export default nextConfig;
