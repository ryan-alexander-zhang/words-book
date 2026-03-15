# Words Book

Words Book is a Next.js vocabulary workspace with Google login, per-user word isolation, embedded pronunciation, and a single resettable bearer token for external automation.

## Stack

- Next.js 14 / React 18
- Auth.js with Google provider
- Prisma ORM
- Prisma Postgres
- Tailwind CSS
- Docker for local PostgreSQL

## Architecture

- Browser access is protected by Auth.js Google sign-in.
- Every word belongs to one authenticated user.
- Auth tables and application tables live in the same Prisma Postgres database.
- External scripts and tools use a separate bearer token generated from `/settings`.
- Public API automation uses `/api/v1/words`.

## What Changed

- `phrase` and `sentence` modules are removed.
- Global word storage is replaced with per-user storage.
- The app now requires Google login before use.
- A settings page exposes one resettable API token per user.
- Raycast and the Chrome extension now use bearer auth instead of anonymous `/api/words` access.

## Environment Variables

Copy `.env.example` and fill in real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Prisma connection string for local or hosted PostgreSQL / Prisma Postgres |
| `AUTH_SECRET` | yes | Auth.js session encryption secret |
| `AUTH_GOOGLE_ID` | yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | yes | Google OAuth client secret |

Generate a local `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create local env file

```bash
cp .env.example .env.local
```

Set valid Google OAuth credentials and keep `DATABASE_URL` pointed at your local Postgres.

### 3. Start PostgreSQL

Recommended:

```bash
docker compose up -d db
```

### 4. Apply Prisma migrations

```bash
npm run migrate:dev
```

This will create the Auth.js tables, the user-owned `Word` table, and the `ApiToken` table.

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Google OAuth Setup

Create a Google OAuth application in Google Cloud Console and configure:

- Authorized JavaScript origins:
  - `http://localhost:3000`
  - your production domain, for example `https://words-book.vercel.app`
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://your-domain/api/auth/callback/google`

Then copy the generated client ID and client secret into:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

## Vercel Deployment

New Vercel projects should use the current Marketplace-based database flow. Do not use legacy Vercel Postgres instructions.

### 1. Push the repo

Push this repository to GitHub, GitLab, or Bitbucket.

### 2. Create the Vercel project

- Import the repo in Vercel.
- Keep the framework preset as `Next.js`.

### 3. Provision Prisma Postgres from Vercel Marketplace

- In Vercel, open your project.
- Add a Postgres integration from the Marketplace that provisions Prisma Postgres.
- Let Vercel inject the database connection string into the project.
- Confirm `DATABASE_URL` appears in the project environment variables.

### 4. Configure auth environment variables in Vercel

Add:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Use your production domain in the Google OAuth redirect URI:

```text
https://your-domain/api/auth/callback/google
```

### 5. Set the build command

Use:

```bash
npm run build:vercel
```

This runs:

1. `prisma migrate deploy`
2. `prisma generate && next build`

That keeps the database schema aligned before Vercel builds the app.

### 6. Deploy

Trigger the first deployment from Vercel.

### 7. Verify the deployment

After deploy:

1. Open the Vercel URL.
2. Sign in with Google.
3. Add a word from the workspace.
4. Open `/settings`.
5. Create an API token.
6. Use the token with `/api/v1/words`.

## Post-Deploy API Test

Create a token in `/settings`, then test with `curl`.

### Add a word

```bash
curl -X POST "https://your-domain/api/v1/words" \
  -H "Authorization: Bearer wb_xxxxx.yyyyy" \
  -H "Content-Type: application/json" \
  -d '{"name":"serendipity"}'
```

### Add multiple words

```bash
curl -X POST "https://your-domain/api/v1/words" \
  -H "Authorization: Bearer wb_xxxxx.yyyyy" \
  -H "Content-Type: application/json" \
  -d '{"names":["serendipity","lucid","tenacious"]}'
```

### List words

```bash
curl "https://your-domain/api/v1/words" \
  -H "Authorization: Bearer wb_xxxxx.yyyyy"
```

## Settings Page

`/settings` now provides:

- account summary
- create token
- reset token
- created / rotated / last-used timestamps
- one-time token reveal

The plaintext token is only shown once. After reset, the previous token becomes invalid immediately.

## Browser and Raycast Clients

### Chrome extension

The extension in `chrome-extension/` now requires:

- API base URL
- API token from `/settings`

Open the extension options page and fill both values before using “Add to Words Book”.

### Raycast extension

The Raycast extension in `raycast-extension/` now requires:

- API base URL
- API token
- random count

Set the token in Raycast preferences after creating it in the web app settings page.

## Docker Notes

`docker compose up --build` now starts the database first, then the web container runs `prisma migrate deploy` before `next start`.

- `.env.docker` contains placeholders.
- Replace `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` before relying on the Dockerized web service.
- Fresh containers create tables through Prisma migrations at runtime.

For day-to-day development, `docker compose up -d db` plus `npm run dev` is still the simpler path.

## Prisma Workflow

Useful commands:

```bash
npm run migrate:dev
npm run migrate:deploy
npx prisma studio
```

## Troubleshooting

### `Error: MissingSecret`

Set `AUTH_SECRET` locally and in Vercel.

### Google callback mismatch

Double-check the exact callback URI:

```text
/api/auth/callback/google
```

Local and production domains must both be registered in Google Cloud Console.

### `Invalid API token`

- Generate or reset the token in `/settings`.
- Copy the full `wb_<tokenId>.<tokenSecret>` value.
- Make sure your client sends it as `Authorization: Bearer ...`.

### Vercel build succeeds but database is missing tables

Make sure the Vercel project build command is:

```bash
npm run build:vercel
```

That is what applies Prisma migrations before the Next.js build.

The Docker runtime path follows the same rule: the web container applies Prisma migrations on startup before serving traffic.
