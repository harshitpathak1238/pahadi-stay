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
  // Static asset + security headers.
  //
  // Content-hashed build output can be cached forever; everything else is
  // revalidated so a deploy is picked up immediately.
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ];

    return [
      {
        source: '/:path*',
        headers: security,
      },
      {
        // Fingerprinted bundles never change under the same name.
        source: '/_next/static/:path*',
        headers: [
          ...security,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Optimised images are content-addressed by the loader too.
        source: '/_next/image',
        headers: [
          ...security,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Uploaded media under /public keeps a long TTL but stays revalidatable.
        source: '/images/:path*',
        headers: [
          ...security,
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          ...security,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
export default nextConfig;
