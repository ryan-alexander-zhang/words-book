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
| `AUTH_URL` | recommended for self-hosted production | Canonical external origin used by Auth.js, for example `https://words.example.com` |
| `AUTH_TRUST_HOST` | optional | Only set to `true` when your reverse proxy preserves `Host` safely |
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

### Before you start

- Push this repository to GitHub, GitLab, or Bitbucket.
- Make sure the branch you deploy contains the Prisma migration files in `prisma/migrations/`.
- Prepare a Google OAuth app in Google Cloud Console.
- Decide whether Preview deployments should use a separate database. This project runs `prisma migrate deploy` during Vercel builds, so sharing one `DATABASE_URL` across Production and Preview is risky.

### 1. Import the project into Vercel

In the Vercel dashboard:

1. Click `Add New...` -> `Project`.
2. Select the repository.
3. Keep the framework preset as `Next.js`.
4. Leave the root directory as the repository root unless you intentionally deploy from a subdirectory.
5. Continue to the project configuration screen.

### 2. Configure the build settings

In `Project Settings` -> `Build and Development Settings`:

- Build Command:

```bash
npm run build:vercel
```

- Install Command: keep the default unless your environment requires a custom value.
- Output Directory: leave empty for this app.

`npm run build:vercel` runs:

1. `prisma migrate deploy`
2. `prisma generate && next build`

That keeps the database schema aligned before the deployment is finalized.

### 3. Provision Prisma Postgres from Vercel Marketplace

In the Vercel dashboard:

1. Open the project.
2. Go to `Storage`.
3. Click `Browse Marketplace`.
4. Choose a Postgres integration that provisions Prisma Postgres.
5. Connect it to this Vercel project.
6. Let Vercel inject the database connection string automatically.

Then verify in `Project Settings` -> `Environment Variables` that `DATABASE_URL` now exists.

### 4. Add the required environment variables

In `Project Settings` -> `Environment Variables`, add:

- `AUTH_SECRET`
- `AUTH_URL` if this is a self-hosted deployment
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Recommended scope:

- `Production`: always required
- `Preview`: only if you intentionally support preview deployments
- `Development`: optional in Vercel, not needed for local `.env.local`

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 5. Configure Google OAuth for the Vercel domain

In Google Cloud Console, update your OAuth client.

Authorized JavaScript origins should include:

- `http://localhost:3000`
- `https://your-domain`

Authorized redirect URIs should include:

- `http://localhost:3000/api/auth/callback/google`
- `https://your-domain/api/auth/callback/google`

For the default Vercel-generated domain, the production callback looks like:

```text
https://your-domain/api/auth/callback/google
```

If you later add a custom domain, add that domain to the same OAuth client as well.

### 6. Trigger the first deployment

Trigger the first deployment from Vercel.

If the deployment fails:

- confirm `DATABASE_URL` is present
- confirm `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are present
- confirm `AUTH_URL` is set for self-hosted production, or `AUTH_TRUST_HOST=true` is intentionally configured behind a trusted proxy
- confirm the Google OAuth callback URI exactly matches the deployed domain

### 7. Verify the deployed application

After deploy:

1. Open the Vercel URL.
2. Sign in with Google.
3. Add a word from the workspace.
4. Open `/settings`.
5. Create an API token.
6. Use the token with `/api/v1/words`.

### 8. Optional but recommended: isolate Preview deployments

This project applies Prisma migrations during deployment. If Preview and Production share the same `DATABASE_URL`, a preview deployment can change the production schema.

Safer options:

- give Preview its own Postgres database and Preview-scoped `DATABASE_URL`
- or disable Preview deployments until you are ready to manage separate databases
- or only deploy schema-changing branches to Production intentionally

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

The Chrome extension now stores its bearer token in local extension storage only. Hosted deployments should use an `https://` API base URL; plain `http://` is only supported for `localhost`.

### Raycast extension

The Raycast extension in `raycast-extension/` now requires:

- API base URL
- API token
- random count

Set the token in Raycast preferences after creating it in the web app settings page.

## Docker Notes

`docker compose up --build` now starts the database first, then the web container runs `prisma migrate deploy` before `next start`.

- `.env.docker` contains placeholders.
- Replace `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` before relying on the Dockerized web service.
- `.env.docker` sets `AUTH_URL=http://localhost:3001` for local compose usage; change it if the container is exposed on another origin.
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
