# YUGAM SMP Player Passport

Full-stack player passport registry with Next.js, PostgreSQL, Vercel Blob image storage, server-side sessions, review workflow, and QR-ready public verification.

## Setup

1. Create a PostgreSQL database through Vercel Marketplace, Neon, or Supabase.
2. Create a Vercel Blob store and copy its `BLOB_READ_WRITE_TOKEN`.
3. Set `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAIL`, and `APP_BASE_URL` in Vercel project settings.
4. Run `npm install`, `npx prisma db push`, then `npm run dev` locally.
5. Deploy with Vercel. The build command is `npm run build`; it generates Prisma Client, applies migrations, and builds Next.js.

Do not use SQLite or local upload directories on Vercel. Vercel's filesystem is temporary; PostgreSQL stores application data and Vercel Blob stores photos.
