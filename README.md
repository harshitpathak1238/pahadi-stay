# Pahadi Stay

Premium stays, rides, rentals, and slow adventures around Bhimtal and Kainchi Dham.

## Setup

1. Install Node.js 18.17+ and PostgreSQL.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `NEXTAUTH_SECRET`.
3. Run `npm install`.
4. Run `npx prisma generate`, then `npx prisma migrate dev --name init`.
5. Start with `npm run dev`, or deploy with `npm run build && npm start`.

Payments, Cloudinary, email, and WhatsApp are integration points controlled entirely through environment variables. Card details never enter this application; Razorpay owns that flow.
