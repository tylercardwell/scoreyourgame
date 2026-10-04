# ScoreYourGame

A mobile-first golf scorecard built with Next.js App Router, TypeScript, Better Auth, and PostgreSQL. Hosts create a round; friends join with an account or just a nickname. No native app is required.

## Included

- Signup with name, username, email, and password. Sign in with either username or email.
- Account-required hosting, account-free guest joining, and private browser sessions for guests.
- Solo and group rounds, 9 or 18 holes, course/round names, and configurable per-hole pars.
- Eight-digit invitation codes, QR codes, native sharing, and invitation links.
- Individual stroke entry, score correction/clearing, a full shared scorecard, and a live leaderboard.
- PostgreSQL persistence, round history, and host-controlled completion. Completed rounds are read-only.
- Live updates through server-sent events and PostgreSQL LISTEN/NOTIFY, with automatic reconnection and a ten-second refresh fallback.

## Run locally

Requires Node.js 22.13 or newer and PostgreSQL 17 or newer. This repository uses npm and includes its lockfile.

```sh
npm install
```

On Windows with PostgreSQL installed at `C:/Program Files/PostgreSQL/17/bin`, the helper provisions a **separate** development database on port 55432. It generates random credentials and a `.env.local`, and binds PostgreSQL to loopback only. It does not change any existing PostgreSQL installation or database.

```sh
npm run db:local
npm run db:migrate
npm run dev
```

Open **http://localhost:3100**. The port avoids conflicting with other projects on port 3000. The local database and development server were configured and tested in this workspace already.

`PG_BIN` can point the helper at another PostgreSQL bin directory. The Windows helper expects a normal local terminal; restrictive execution sandboxes can prevent `pg_ctl` from starting its process.

To use your own local or hosted PostgreSQL database instead, create an empty database, copy `.env.example` to `.env.local`, and set:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-random-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3100
```

Then run `npm run db:migrate` and `npm run dev`. For Docker, set `POSTGRES_PASSWORD` in your terminal and run `docker compose up -d`; set the same password in `DATABASE_URL` with port 5432.

The migration command uses Better Auth’s schema migration API for account, session, provider-account, verification, and auth rate-limit tables. It applies `db/001-rounds.sql` for golf tables. Both operations can be run repeatedly. Later schema changes should use new, versioned SQL migrations rather than editing an already-deployed table definition.

## Try the flow

1. Open the homepage and choose **Start a round**. Create an account, choose the course and hole count, and start.
2. Choose **Invite players**. Open the invitation link in another browser or private window.
3. Enter a nickname and join. No signup required. The host sees the new player immediately.
4. Enter strokes and tap **Save score & next hole**. Both browsers receive the updated scorecard.
5. Use **Full scorecard** to review scores or tap your own score to edit it.
6. Once everyone has scored every hole, the host can finish the round.

Guest access is attached to a private HttpOnly cookie in that browser for 90 days. Clearing cookies or using a different browser does not recover the guest’s place; use an account for durable access across devices. Invite codes grant membership, so share them with the people you want in the round.

For testing on phones over your local network, use your computer’s LAN address instead of `localhost` and set `BETTER_AUTH_URL` to that exact origin, for example `http://192.168.1.50:3100`. Restart the server after changing environment variables. QR codes use the origin currently open in the host’s browser. Public use should run behind HTTPS.

## Validation

```sh
npm run typecheck
npm run lint
npm run build
npm test
```

Browser tests expect the app running and a migrated development database. They use locally installed Chrome, create separate host/guest sessions, and leave their test rounds in the development database. Use `TEST_BASE_URL` if you change the app URL. Screenshots are saved under `test-results/`.

The integration tests cover signup, username login, guest join and recovery, QR invitations, live scoring in both directions, solo play, round history, completion, invalid scores, duplicate nicknames, authorization, and cross-origin write rejection. A runtime dependency audit reported no known vulnerabilities. The full audit currently flags an unpatched `braces` dependency in Next.js’s development-only ESLint chain; avoid running lint against untrusted injected glob patterns and update when an upstream fix is available.

## How it is organized

- `src/app`: Next.js pages and route handlers.
- `src/components`: mobile UI, dialogs, scorecard, and history.
- `src/lib/auth.ts`: Better Auth configuration and the username plugin.
- `src/lib/api.ts`: session/guest identity, validation, origin checks, and request limits.
- `src/lib/rounds.ts`: membership checks, consistent snapshots, and transactional writes.
- `src/lib/live.ts`: one PostgreSQL notification listener per Node process.
- `db/001-rounds.sql`: rounds, holes, participants, scores, and request-limit tables.
- `tests/rounds.spec.ts`: real-browser integration tests.

Writes lock the round row in a transaction so joining, scoring, changing pars, and finishing cannot race each other. Scores are always written for the participant identified by the session, not a player ID supplied by the browser. Every committed write increments the round revision; clients ignore older snapshots.

## Deployment and later additions

Use a persistent Node.js host with PostgreSQL (for example a container or Node service behind HTTPS). The current live implementation keeps one PostgreSQL LISTEN connection per server process and streams SSE responses. PostgreSQL notifications work across multiple app instances. If your host limits response duration, SSE reconnects; if the host does not support streaming or session-based LISTEN connections, the ten-second refresh still works. Use a direct database connection or session-mode pooler for LISTEN, rather than a transaction-mode pooler.

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` to production values, run migrations against the intended database, then `npm run build` and `npm start`. Schedule database backups and periodic cleanup of expired session/rate-limit rows. This is a working first version, not a deployed public service.

Google sign-in can be added using `socialProviders.google` in `src/lib/auth.ts` and a corresponding sign-in button. Better Auth already has provider-account storage; no password implementation needs replacing. Google OAuth, email verification/password reset delivery, handicaps, course catalogs, offline score queues, and clubhouse/tournament administration are not included yet. Tournament management can reuse the round/hole/participant/score structure and add organizations, events, and scoring formats in separate migrations.

Homepage photography: [Unsplash golf photograph](https://images.unsplash.com/photo-1535131749006-b7f58c99034b), downloaded locally from its image CDN. Fonts are self-hosted through the Geist package.
