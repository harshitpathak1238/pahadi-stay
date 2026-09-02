# KainchiDarshan workspace

## Blog image storage

Blog posts are stored in PostgreSQL. Uploaded media is written to the separate Hostinger images directory. For a Hostinger deployment, set these environment variables and deploy the Next.js app on Hostinger (a Vercel function cannot access Hostinger's filesystem):

```dotenv
HOSTINGER_BLOG_UPLOAD_DIR="/home/USER/domains/example.com/public_html/uploads/blog"
HOSTINGER_BLOG_UPLOAD_URL="https://example.com/uploads/blog"
HOSTINGER_IMAGE_UPLOAD_DIR="/home/USER/domains/example.com/public_html/uploads/images"
HOSTINGER_IMAGE_UPLOAD_URL="https://example.com/uploads/images"
```

`HOSTINGER_BLOG_UPLOAD_DIR` and `HOSTINGER_BLOG_UPLOAD_URL` reserve the blog upload location. `HOSTINGER_IMAGE_UPLOAD_DIR` and `HOSTINGER_IMAGE_UPLOAD_URL` control uploaded images and videos. These are absolute Hostinger filesystem paths and browser-accessible URL prefixes; do not use CDN values. The upload route validates media type and size, and the public blog sanitizes normal article HTML before rendering.
# KainchiDarshan

Premium stays, rides, rentals, and slow adventures around Bhimtal and Kainchi Dham.

## Setup

1. Install Node.js 18.17+ and MySQL access. This project uses MySQL, not PostgreSQL.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `NEXTAUTH_SECRET`. For local development, use a reachable local MySQL database or the Hostinger MySQL database; the app cannot render database-backed pages while that host is unreachable.
3. Run `npm install`.
4. Run `npx prisma generate`, then apply the migrations with `npx prisma migrate deploy`.
5. Start with `npm run dev`, or deploy with `npm run build && npm start`.

## Where content is stored

Blog post records are stored in the MySQL `BlogPost` table, but media is filesystem-only. The Media Library reads and writes image/video files directly in `HOSTINGER_IMAGE_UPLOAD_DIR`; it does not use Prisma or a `MediaAsset` table. Small hidden JSON sidecar files in the same directory preserve the display filename and alt text. During local development, uploads fall back to `public/uploads/images`.

The admin upload API must run on the same Hostinger server as the configured directory. A local Windows server cannot write to `/home/...` on Hostinger, so local development uses the fallback directory unless a locally mounted directory is configured. Login, admin authorization, blog posts, listings, and bookings still use the application's existing MySQL database.

If blog posts are missing in Hostinger, verify that the deployed app's `DATABASE_URL` points to the same Hostinger database used when the posts were created, and that the migrations have been applied there. A different database, an un-applied migration, or a failed remote connection will make the public journal appear empty.

Payments, Cloudinary, email, and WhatsApp are integration points controlled entirely through environment variables. Card details never enter this application; Razorpay owns that flow.
