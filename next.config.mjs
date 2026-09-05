/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'springgreen-salmon-184354.hostingersite.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'springgreen-salmon-184354.hostingersite.com', pathname: '/media-api.php' }
    ]
  }
};
export default nextConfig;
