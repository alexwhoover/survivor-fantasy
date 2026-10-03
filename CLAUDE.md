# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A fantasy sports app for CBS's *Survivor*: friends draft castaways, earn points as picks survive/win challenges, and compete on a leaderboard across a season, including a post-merge re-draft window.

**The site is read-only for visitors and writable only by a single site admin.** This shapes nearly every design decision below, so it's worth stating plainly:

- **Players don't have accounts.** A `users` row is just a name that rosters, merge actions and leaderboard entries hang off. Nobody signs in as a player. There is no registration, no invite code, no joining, and no password reset.
- **There is exactly one credential**, the admin's, supplied by `APP_ADMIN_USERNAME`/`APP_ADMIN_PASSWORD` and held in memory by `SecurityConfig` — deliberately *not* a row in any table.
- **"Authenticated" therefore means "is the admin."** Services do not check per-league roles; `SecurityConfig` is the single authorization point.
- **Leagues are global.** Every visitor sees every league. There are no per-user league lists.
- The admin enters everything after each episode: scores, eliminations, every player's roster, and every player's merge move.

## Architecture

Two services plus MySQL, composed via `docker-compose.yml`:

- **backend/** — Spring Boot (Java 25), package `com.example.demo`
- **frontend/** — React + TypeScript + Vite + Tailwind + Radix UI
- **MySQL** — schema managed by Flyway migrations (`backend/src/main/resources/db/migration/`), run automatically by the `flyway` compose service before the backend starts

### Backend layering

Controller → Service → DAO → Entity, all under `com.example.demo`:

- `controller/` — one `LeagueController` handles almost every league-scoped endpoint (`/api/leagues/**`: leagues, players, tribes, contestants, episodes, rosters, scores, merge, leaderboard); `AdminController` handles the admin session (`/api/admin/login`, `/api/admin/session`; logout is wired in `SecurityConfig`).
- `service/` — business logic lives here, not in controllers. Services throw `ResponseStatusException` directly (e.g. `HttpStatus.BAD_REQUEST`, `HttpStatus.NOT_FOUND`) rather than using a global exception handler.
- `dao/` — **not** Spring Data repositories. Each DAO is a plain `@Repository` class using an injected `EntityManager` directly (JPQL via `createQuery`, `entityManager.persist/find/remove`). Follow this pattern for new DAOs rather than introducing `JpaRepository`.
- `dto/` — request/response records passed across the controller boundary; entities are never serialized directly.
- `entity/` — JPA entities.

**Authorization convention:** every `GET /api/leagues/**` is `permitAll`; everything else requires the admin session. This is declared once in `SecurityConfig` and **not** re-checked in services — so admin-gated endpoints take no caller id in the body or query string. A new write endpoint is admin-gated automatically by not being a GET; a new *public* read must be a GET under `/api/leagues/**`.

Session-based auth: Spring Security + Spring Session backed by JDBC (`spring.session.jdbc`), session table created by migration, not Hibernate. Because the only non-permitted state left is "no admin session", `SecurityConfig`'s `authenticationEntryPoint` answers **401** for all of them. The frontend treats a 401 on `GET /api/admin/session` as "just a visitor" rather than an error.

### Frontend structure

- `src/api/index.ts` — the entire HTTP client: every backend call plus its response type lives in this one file. Add new endpoints here rather than creating a separate api module. Reads go through the `get()` helper, writes through `write()`, which maps a 401 to "your admin session expired" and takes an optional per-status message map (see below).
- `src/app/App.tsx` — route table. Every page is public except `/admin/new-league`, gated by `RequireAdmin`; all pages share `Navigation` via a layout route.
- `src/app/context/AdminContext.tsx` — a single `isAdmin` boolean, re-checked against the server on every page load. Admin-only UI (the league page's Admin tab, the nav's new-league and sign-out buttons) keys off it.
- `src/app/pages/` — route-level views; `src/app/components/` — shared components including `components/ui/` (Radix-based primitives: button, dialog, select, tabs, etc.).
- Path alias `@` → `frontend/src` (configured in `vite.config.ts`).

**Mobile:** the site is used on phones, so every view must work at ~360px with no horizontal page scroll. Tap targets are `min-h-[44px]` (or `min-h-[36px]` for dense secondary controls), card grids go `grid-cols-1 sm:grid-cols-2`, dialog footers `flex-col-reverse sm:flex-row`, and the one intentionally wide element — the scoring grid — scrolls horizontally inside its own container with a sticky name column. Check new UI at that width.

**Known gap:** this Spring Boot version (4.0.6) omits `message` from the error JSON body even with `server.error.include-message=always`, so `ResponseStatusException` reasons don't reach the browser. `extractErrorMessage` falls back to the caller's generic string. Where a specific failure is worth distinct wording, pass a per-status message to `write()` (see `addPlayer`'s 409) rather than relying on the server's text.

### Frontend ↔ backend wiring

The frontend calls relative paths (`/api/...`) with no dev-server proxy configured in `vite.config.ts`. In Docker, `nginx.conf` in the frontend container reverse-proxies `/api/*` to the `backend` service so the browser only ever sees one origin (avoids CORS). This means **`docker compose up` is the primary way to run the full stack** — plain `npm run dev` (Vite dev server) will not have a working `/api` proxy on its own.

Note that nginx resolves `backend` at startup, so restarting the backend alone can leave the frontend serving 502s on `/api/*` until the frontend container is restarted too.

## Running the app

```bash
cp .env.example .env   # first time only — holds APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD, gitignored
docker compose up --build
```

Secrets live in the root `.env` (auto-loaded by Docker Compose) and are passed into containers as env vars, never committed. `application.properties` references them with no default (`app.admin.password=${APP_ADMIN_PASSWORD}`) so a missing secret fails at startup instead of silently defaulting; `SecurityConfig` additionally rejects a blank value rather than standing up a writable site with an empty password.

Starts MySQL, runs Flyway migrations, then backend (`:8080`) and frontend (`:3000`, nginx-served build reverse-proxying `/api`).

All published host ports (`3306`, `8080`, `3000`) are bound to `127.0.0.1` in `docker-compose.yml`, so on the Pi nothing is reachable from the LAN; public traffic only arrives through the tunnel (`cloudflared` → `http://frontend:80` on the compose network). Keep new port mappings localhost-bound.

Production adds a Cloudflare Tunnel:

```bash
docker compose --profile production up -d --build   # TUNNEL_TOKEN comes from .env
```

Production runs on a Raspberry Pi (home server), reached via the Cloudflare Tunnel rather than a directly exposed port. Keep this in mind for resource usage (the backend's `JAVA_TOOL_OPTIONS` in `docker-compose.yml` already caps heap at 512m for this reason) and architecture (images must run on the Pi's arch — check `docker compose build` output rather than assuming x86_64).

Because reads are public and the tunnel is public, player names and scores are visible to anyone with the URL. That's intended; keep anything else out of the read endpoints.

### Seeding data

```bash
backend/src/main/resources/db/seed.sh [checkpoint]
```

Runs against the `mysql` compose service (must already be up). Loads `seed_league.sql` (two sample leagues with sample players), then optionally one of `checkpoint_{1,2,3,4}.sql` to fast-forward the Season 51 league to a later point in the season (e.g. mid-season, post-merge) for testing. Seeding deletes and reinserts, so **league and player ids change on every run** — don't hard-code them in tests or scripts.

### Backend only (outside Docker)

```bash
cd backend
./mvnw spring-boot:run       # requires MySQL reachable at the URL in application.properties
./mvnw test                  # run tests
./mvnw test -Dtest=ClassName # run a single test class
```

The project targets Java 25, which may be newer than the host JDK. If `./mvnw` fails with "release version 25 not supported", build in the project's own image instead:

```bash
docker run --rm -v "$PWD":/app -v "$HOME/.m2":/root/.m2 -w /app eclipse-temurin:25-jdk ./mvnw -q compile
```

### Frontend only (outside Docker)

```bash
cd frontend
npm run dev     # Vite dev server — note: no /api proxy, see above
npm run build   # also the de facto typecheck: there is no tsconfig.json, so `tsc -p` won't work
```

## Migrations

**This app is live in production** with real user data. Never make ad-hoc changes to the production database — every schema change must go through a Flyway migration script, and every data fix/backfill should too (rather than a one-off manual query), so it's applied consistently and repeatably wherever it runs (dev, and the Pi in production).

Add new schema changes as a new `V{n}__description.sql` file in `backend/src/main/resources/db/migration/` — never edit an already-applied migration. Flyway runs these automatically via the compose `flyway` service. The `seed_league.sql` and `checkpoint_*.sql` files under `db/` are seed/test fixtures, not schema migrations.
