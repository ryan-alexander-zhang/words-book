# Words Book

A small Next.js + PostgreSQL app to collect vocabulary and jump to reference sites (Vocabulary.com, YouGlish, Dictionary.com, Youdao, Collins) with one click. UI is built with shadcn/ui components.

## Stack
- Next.js 14 / React 18
- Prisma ORM
- PostgreSQL
- Tailwind CSS + shadcn/ui
- Docker / docker-compose for one-command startup

## Quick start

### Run with Docker (recommended)
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the stack (builds the app image, boots Postgres, runs the init SQL):
   ```bash
   docker-compose up --build
   ```
3. Open http://localhost:3000 to use the app.

The database is seeded with the schema from `scripts/init.sql`. Data persists in the `db_data` volume.

### Local development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a local Postgres (or use the compose service):
   ```bash
   docker-compose up db
   ```
3. Create a `.env` file and set `DATABASE_URL` (see `.env.example`).
4. Push the Prisma schema (creates the `Word` table if it does not exist):
   ```bash
   npx prisma db push
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Folder structure
- `app/` – Next.js App Router pages and API routes
- `components/` – UI components and feature modules
- `lib/` – shared utilities (Prisma client, link helpers)
- `prisma/` – Prisma schema
- `scripts/` – database init SQL

## Notes
- Words are stored lowercased to avoid duplicates; adding the same word again is idempotent.
- The Links column automatically URL-encodes the word when generating external links.
