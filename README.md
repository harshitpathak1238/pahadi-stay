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

1. Install Node.js 18.17+ and PostgreSQL.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `NEXTAUTH_SECRET`.
3. Run `npm install`.
4. Run `npx prisma generate`, then `npx prisma migrate dev --name init`.
5. Start with `npm run dev`, or deploy with `npm run build && npm start`.

Payments, Cloudinary, email, and WhatsApp are integration points controlled entirely through environment variables. Card details never enter this application; Razorpay owns that flow.
