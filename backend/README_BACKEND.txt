# StoryHub Backend (Node + Express + SQLite)

## Setup (local / Render)

1. Create a new repo and paste the files.
2. Create a folder `data/` in repo root (if not exists) and ensure process can write to it.
3. Add environment variables (or copy `.env.example` to `.env` and edit).
4. Install dependencies:
   ```
   npm install
   ```

5. Run migrations and seed initial admin & plans:
   ```
   npm run migrate
   ```

6. Start:
   - Development:
     ```
     npm run dev
     ```
   - Production:
     ```
     npm start
     ```

## Render
- Build & Start commands: (no build step)
  - Start command: `npm start`
- Set environment variables in Render:
  - `PORT`, `DATABASE_FILE` (keep default), `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `UPI_ID`, `UPI_QR_URL`, `SITE_NAME`

DB file stored at `./data/storyhub.sqlite`. Render provides persistent disk for app.

