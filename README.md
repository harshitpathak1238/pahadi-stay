# KainchiDarshan workspace

## Blog image storage

Blog images are written by the server to Hostinger filesystem storage. By default the app uses `public/uploads/blog`, which is served at `/uploads/blog`. For a Hostinger deployment, set these environment variables:

```dotenv
HOSTINGER_UPLOAD_DIR="/home/USER/domains/example.com/public_html/uploads/blog"
HOSTINGER_UPLOAD_URL="https://example.com/uploads/blog"
```

`HOSTINGER_UPLOAD_DIR` is the absolute writable directory on the Hostinger server. `HOSTINGER_UPLOAD_URL` is the browser-accessible URL prefix for that directory. Do not use a CDN value. The upload route validates image MIME type and size, and the public blog sanitizes HTML before rendering.
# KainchiDarshan

Premium stays, rides, rentals, and slow adventures around Bhimtal and Kainchi Dham.

## Setup

1. Install Node.js 18.17+ and PostgreSQL.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `NEXTAUTH_SECRET`.
3. Run `npm install`.
4. Run `npx prisma generate`, then `npx prisma migrate dev --name init`.
5. Start with `npm run dev`, or deploy with `npm run build && npm start`.

Payments, Cloudinary, email, and WhatsApp are integration points controlled entirely through environment variables. Card details never enter this application; Razorpay owns that flow.
