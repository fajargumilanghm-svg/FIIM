# FIIM — Deployment (Render + Vercel)

Backend (NestJS + Prisma + Puppeteer) runs as a **Render Docker Web Service**
with **Render Managed Postgres**. The frontend (Vite SPA) is a **Vercel** static
site. Backend is long-running (hourly report cron) and renders PDFs with
Chromium, so it needs a container runtime — not serverless.

```
┌────────────┐      HTTPS       ┌──────────────────┐      ┌────────────────┐
│  Vercel    │ ───────────────▶ │  Render Web Svc  │ ───▶ │ Render Postgres │
│  (frontend)│  /api/v1/*       │  fiim-api (Docker)│      │  fiim-db        │
└────────────┘                  └──────────────────┘      └────────────────┘
```

## Files in this repo
- `backend/Dockerfile` — production image; installs Chromium, builds, runs
  `prisma migrate deploy` then `node dist/main.js` on start.
- `backend/.dockerignore`
- `render.yaml` — Render Blueprint: `fiim-api` web service + `fiim-db` Postgres.
- `frontend/vercel.json` — Vite build + SPA rewrites.
- `backend/.env.example`, `frontend/.env.example` — required variables.

---

## 1. Backend + database on Render

1. Push this branch to GitHub.
2. Render → **New +** → **Blueprint** → select this repo. Render reads
   `render.yaml` and provisions `fiim-db` (Postgres) and `fiim-api` (Docker).
3. `DATABASE_URL` is wired automatically; `JWT_SECRET` is auto-generated.
4. After the first deploy, set **`FRONTEND_URL`** on the `fiim-api` service to
   your Vercel URL (e.g. `https://fiim.vercel.app`) so CORS allows it, then
   redeploy.
5. Migrations run automatically on every deploy (Dockerfile `CMD`).
6. Verify: open `https://<your-api>.onrender.com/api/docs` (Swagger → 200).

> Free Postgres is deleted after 90 days and the free web service sleeps when
> idle — upgrade both plans for real use.

## 2. Frontend on Vercel

1. Vercel → **Add New** → **Project** → import this repo.
2. Set **Root Directory** to `frontend/` (picks up `vercel.json`).
3. Add env var **`VITE_API_BASE_URL`** = `https://<your-api>.onrender.com/api/v1`.
4. Deploy. Vercel runs `npm ci && npm run build`, serves `dist/`.
5. Copy the Vercel URL back into the Render `FRONTEND_URL` (step 1.4).

## 3. First-run

- Seed an initial org/admin: `cd backend && npm run db:seed` against the prod
  `DATABASE_URL` (or run once via a Render Shell).
- Log in from the Vercel URL and confirm the dashboard loads.

---

## Notes / follow-ups
- **Email/SMS** notification channels currently log payloads. To send for real,
  set `SMTP_*` / `SENDGRID_API_KEY` (email) or `TWILIO_*` (SMS) and implement the
  transport in `backend/src/modules/notifications/channels/notification-channel.ts`.
- **Report storage** writes to `./storage/reports` (ephemeral on Render). For
  durable files, attach a Render Disk or switch to S3/MinIO (`MINIO_*` /
  `@aws-sdk/client-s3` is already a dependency).
- **Redis / RabbitMQ / Elasticsearch** are optional; leave their URLs blank to
  run without them.
