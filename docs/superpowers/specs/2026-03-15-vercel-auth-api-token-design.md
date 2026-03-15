# Vercel Auth, User Isolation, and API Token Design

## Summary

Refactor the current single-user vocabulary app into a Vercel-ready multi-user application with:

- Google sign-in via Auth.js
- Per-user word isolation
- A single resettable API bearer token per user
- Prisma ORM backed by Prisma Postgres provisioned through Vercel Marketplace
- A detailed README covering local setup, Vercel deployment, and external API usage

The existing local word data will be discarded as part of the schema transition.

## Goals

- Require Google login before any application access
- Store both auth data and application data in one Prisma Postgres database
- Ensure every word belongs to exactly one authenticated user
- Let each user create exactly one application API token and reset it at any time
- Support external scripts and third-party services with bearer-token authentication
- Produce a deployment README that is specific to Vercel and Prisma Postgres

## Non-Goals

- Multiple API tokens per user
- Role-based access control
- Token scopes or per-endpoint permissions
- Public anonymous access
- Reusing Google OAuth access tokens as application API credentials
- Separate auth and app databases

## Recommended Architecture

### Authentication

- Use Auth.js with the Google provider.
- Use the Prisma adapter.
- Use database-backed sessions for browser access.
- Protect the entire app, not only selected pages.

Browser users authenticate with Auth.js sessions. External callers authenticate with a dedicated application bearer token. These are separate mechanisms with separate storage and lifecycles.

### Route Protection

- Add `auth.ts` to define Auth.js configuration and exports.
- Add `app/api/auth/[...nextauth]/route.ts` for Auth.js handlers.
- Add `middleware.ts` to redirect unauthenticated browser requests away from app pages.
- Still enforce authentication inside server components and route handlers instead of trusting middleware alone.

Pages should redirect unauthenticated users to a dedicated sign-in page. Route handlers should return JSON `401` responses when authentication is missing or invalid.

### Data Access Boundaries

- Page rendering reads data only for the current user.
- Internal app routes continue to use session auth.
- External API routes live under `/api/v1/*` and only accept bearer tokens.
- Shared word operations should move into server-side helpers so session-based routes and token-based routes do not duplicate business logic.

## Data Model

### Auth Tables

Adopt the standard Auth.js Prisma schema:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Authenticator`

`User.id` should use the standard string identifier expected by the adapter.

### Word

Change `Word` from a global table to a user-owned table:

- `id Int @id @default(autoincrement())`
- `name String`
- `createdAt DateTime @default(now())`
- `ownerId String`
- relation to `User`
- `@@unique([ownerId, name])`
- index on `ownerId`

This allows different users to save the same word while still preventing duplicates inside one account.

### ApiToken

Add a dedicated table for the application bearer token:

- `id String @id @default(cuid())`
- `userId String @unique`
- `tokenId String @unique`
- `tokenHash String`
- `createdAt DateTime @default(now())`
- `rotatedAt DateTime @default(now())`
- `lastUsedAt DateTime?`
- relation to `User`

Each user can own at most one token record.

### Token Format

Expose one opaque token to the user:

`wb_<tokenId>.<tokenSecret>`

Implementation details:

- `tokenId` is a short public identifier used for indexed lookup
- `tokenSecret` is a high-entropy random secret
- only the full opaque token is shown to the user
- only `tokenId` and a hash of `tokenSecret` are stored
- plaintext token is shown once on create or reset, then never retrievable again

This keeps the user experience simple while allowing efficient server-side lookup and verification.

## Application Structure

### Sign-In Flow

- Add a minimal custom sign-in page with a Google button.
- Unauthenticated users landing on the root app should be redirected there.
- Successful sign-in returns the user to the vocabulary workspace.

### Main Workspace

- Keep the current single-page word workspace UX.
- Scope all reads and writes to the authenticated user.
- Add lightweight account navigation in the top-level layout so users can reach settings and sign out.

### Settings Page

Add `/settings` with two focused sections:

#### Account

- show current signed-in email and avatar if available
- sign-out action

#### API Token

- current token state: created or not created
- metadata only: `createdAt`, `rotatedAt`, `lastUsedAt`
- create button when missing
- reset button when present
- one-time reveal panel after create/reset
- copy action for the newly generated token
- warning that the token is only shown once and reset invalidates the previous value immediately

The settings page should not display the stored hash, partial secret, or recoverable token value.

## API Design

### Internal Session Routes

Keep the current workspace API surface and move it behind authenticated user scoping:

- `GET /api/words`
- `POST /api/words`
- `DELETE /api/words`

Behavior changes:

- every handler resolves the current user with Auth.js
- every query includes `ownerId = user.id`
- duplicate word handling remains per-user

### Settings Routes

- `GET /api/settings/token`
  - returns token status and metadata only
- `POST /api/settings/token`
  - creates or rotates the token
  - returns the plaintext token once in the response

These routes require a valid browser session.

### External API v1

Create a separate token-authenticated namespace:

- `GET /api/v1/words`
- `POST /api/v1/words`

Authentication:

- require `Authorization: Bearer <token>`
- reject session-only callers to keep boundaries clear

Request behavior:

- `GET` returns the current user’s words ordered by newest first
- `POST` accepts either `name` or `names[]`
- normalization remains trim + lowercase
- duplicate submissions are ignored per user

Response behavior:

- `401` for missing or invalid bearer token
- `400` for malformed payloads
- `200` for successful reads
- `201` for successful creates with machine-friendly result data

Initial v1 scope does not include external delete endpoints. That keeps the API small and aligned with the user’s explicit need for programmatic word creation.

## Security and Operational Rules

### Session vs Token Separation

- browser access uses session auth only
- external automation uses bearer token only
- Google provider tokens are not reused as application API credentials

### Token Storage

- generate token values on the server only
- hash secrets before persistence
- compare hashes in constant time
- clear the old token immediately on reset by overwriting `tokenId` and `tokenHash`

### Token Usage Tracking

Update `lastUsedAt` when bearer auth succeeds, but throttle writes so frequent API usage does not write on every request. A coarse update window such as 15 minutes is sufficient.

### Error Messages

Keep token-related errors intentionally generic:

- `Invalid API token`
- `Unauthorized`

Do not reveal whether the `tokenId` existed or which part of the token failed validation.

### Data Reset

Because the current data can be discarded, the schema migration can be clean and destructive. No compatibility layer for legacy global words is needed.

## Implementation Boundaries

To keep responsibilities small and testable, the implementation should separate:

- Auth.js configuration and session helpers
- API token generation, parsing, hashing, and verification helpers
- word query and mutation services
- route handlers
- page components

Avoid mixing token parsing, database access, and response formatting in a single file.

## Testing Strategy

### Automated

Add a lightweight test setup for server-side logic, focused on:

- token format parsing
- token hashing and verification
- duplicate normalization behavior
- session/token auth helper behavior

Route-level behavior can be validated with focused handler tests if setup cost stays low. The build must continue to pass as a deployment gate.

### Manual

Verify these flows before merge:

1. Unauthenticated visit redirects to sign-in.
2. Google sign-in creates a user and opens an empty personal workspace.
3. Adding a word in the UI only affects the signed-in user.
4. Signing in with a different Google account shows a separate empty workspace.
5. Creating an API token reveals it once and stores only metadata afterward.
6. Resetting the token invalidates the old bearer token immediately.
7. `POST /api/v1/words` succeeds with the new bearer token.
8. Invalid bearer token requests return `401`.
9. `npm run build` succeeds.

## Deployment and README Requirements

The README should be rewritten to prioritize Vercel deployment while still documenting local development.

### README Sections

- project overview
- architecture summary: Auth.js + Prisma ORM + Prisma Postgres
- prerequisites
- local development setup
- Google OAuth app setup
- Vercel Marketplace database provisioning using Prisma Postgres
- required environment variables
- Prisma migration workflow
- Vercel deployment steps
- post-deploy verification
- API token creation and reset flow
- external API examples with `curl`
- troubleshooting

### Required Environment Variables

Document at minimum:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

If implementation chooses additional optional variables, they should be documented explicitly and justified.

### Deployment Workflow

README should describe:

1. Create a Prisma Postgres database from Vercel Marketplace and connect it to the Vercel project.
2. Configure Google OAuth credentials with both local and Vercel callback URLs.
3. Add auth environment variables in Vercel.
4. Ensure the build process runs Prisma migrations in production before `next build`.
5. Deploy the app.
6. Sign in with Google.
7. Generate an API token from `/settings`.
8. Use that token to call `/api/v1/words`.

The README should explicitly avoid legacy Vercel Postgres instructions and instead target the current Marketplace-based flow.

## Migration Plan

1. Replace the current global `Word` schema with the new auth-aware schema.
2. Generate and commit Prisma migrations.
3. Reset local development data as needed.
4. Deploy against a fresh Prisma Postgres database on Vercel.

Because old data is intentionally discarded, no one-off ownership backfill is required.

## Risks and Tradeoffs

- Database sessions add auth tables and session lookups, but they keep browser auth aligned with Auth.js defaults.
- A single API token per user keeps the UX simple but sacrifices per-client revocation granularity.
- External API v1 stays intentionally small, which avoids overdesign but means future automation needs may require new endpoints.

## Acceptance Criteria

- Unauthenticated users cannot access the app or word APIs.
- Users can sign in with Google on Vercel.
- Each user sees only their own words.
- Each user can create and reset exactly one API bearer token.
- External callers can add words using bearer auth.
- Old bearer tokens stop working immediately after reset.
- Prisma Postgres is used for both auth and app data.
- The README is sufficient for a fresh Vercel deployment without guessing missing steps.
