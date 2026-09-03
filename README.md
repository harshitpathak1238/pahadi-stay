# KainchiDarshan workspace

## Media storage

Blog posts are stored in MySQL. When the app is deployed on Vercel, media is stored by the Hostinger PHP bridge in the Hostinger images directory. Upload the file [media-api.php](hostinger-media-api/media-api.php) to Hostinger, configure its environment values, and set these Vercel variables:

```dotenv
HOSTINGER_MEDIA_API_URL="https://example.com/media-api.php"
HOSTINGER_MEDIA_API_SECRET="the-same-long-random-secret-as-Hostinger"
```

The Vercel media route authenticates the logged-in admin first, then calls Hostinger with the server-only `X-Media-Secret` header. Hostinger validates the secret, MIME type, size, and generated filename before writing to disk. Media metadata is stored in hidden JSON sidecar files, not Prisma. Hostinger plans that do not expose PHP `getenv()` variables should upload `media-config.php` beside `media-api.php` (or one directory above `public_html`) using `media-config.php.example` as the template. The older `HOSTINGER_IMAGE_UPLOAD_*` variables describe the storage location used by the PHP bridge; they do not grant Vercel direct filesystem access.
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

Login, admin authorization, blog posts, listings, and bookings still use the application's existing MySQL database.

If blog posts are missing in Hostinger, verify that the deployed app's `DATABASE_URL` points to the same Hostinger database used when the posts were created, and that the migrations have been applied there. A different database, an un-applied migration, or a failed remote connection will make the public journal appear empty.

Payments, Cloudinary, email, and WhatsApp are integration points controlled entirely through environment variables. Card details never enter this application; Razorpay owns that flow.
