# YUGAM SMP Player Passport

Full-stack player passport registry with Express, SQLite, server-side sessions, constrained image uploads, review workflow, QR-ready public verification, and SMTP-backed notifications.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_EMAIL` and a bcrypt `ADMIN_PASSWORD_HASH` (the full admin email is never sent to the browser).
3. Add SMTP values for real transactional email delivery.
4. Run `npm install`, then `npm run dev`.

The application creates `yugam.sqlite`, `sessions.sqlite`, and `uploads/` at runtime. Do not commit `.env`, the database files, or uploaded images.
