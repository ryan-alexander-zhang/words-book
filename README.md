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

## Chrome extension (context menu saver)

This repo includes a simple Chrome extension that adds a right-click menu item to save the selected word into Words Book.

### Usage
1. Make sure the Words Book app is running (local dev or Docker).
2. Load the extension in Chrome (see install steps below).
3. Highlight a word on any webpage, right-click, and choose **Add to Words Book**.

If your app is not running on `http://localhost:3000`, open the extension's options page and update the API base URL.

### Install (unpacked)
1. Open **chrome://extensions** in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `chrome-extension/` folder from this repo.
5. (Optional) Click **Details** → **Extension options** to set a custom API base URL.

### Package and install
1. Open **chrome://extensions**.
2. Turn on **Developer mode**.
3. Click **Pack extension**.
4. For **Extension root directory**, choose the `chrome-extension/` folder.
5. Click **Pack extension** to generate a `.crx` and `.pem` key.
6. Distribute the `.crx` file. Recipients can drag it into **chrome://extensions** to install.
   - If Chrome blocks it, they can load it as unpacked (steps above), or import via enterprise policy.

### Extension files
The extension lives in `chrome-extension/` and uses:
- `manifest.json` (MV3 manifest)
- `background.js` (context menu + API call)
- `options.html` / `options.js` (API base URL settings)

## Raycast extension

This repo also ships a Raycast extension for adding and querying words from the command palette.

### Commands
- **Add Word**: Add a word to your Words Book.
- **Search Word**: Search existing words.
- **Random Words**: List random words (count is configurable).

### Install into Raycast
1. Install Raycast and its CLI following the official docs.
2. From the repo root, open the extension folder:
   ```bash
   cd raycast-extension
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the extension in development mode (this registers it in Raycast):
   ```bash
   npm run dev
   ```
5. In Raycast, open **Extensions → Words Book → Preferences** and set:
   - **API Base URL** (defaults to `http://localhost:3000`)
   - **Random Count** (how many words to list)

## Notes
- Words are stored lowercased to avoid duplicates; adding the same word again is idempotent.
- The Links column automatically URL-encodes the word when generating external links.
- UI supports fuzzy search, time sorting (newest/oldest), multi-select delete, clear-all, and import/export (paste comma/line separated words to import, download JSON to export).
