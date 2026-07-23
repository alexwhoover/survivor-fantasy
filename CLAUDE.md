# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A fantasy sports app for CBS's *Survivor*: leagues draft castaways, earn points as picks survive/win challenges, and compete on a leaderboard across a season, including a post-merge re-draft window.

## Architecture

Two services plus MySQL, composed via `docker-compose.yml`:

- **backend/** — Spring Boot (Java 25), package `com.example.demo`
- **frontend/** — React + TypeScript + Vite + Tailwind + Radix UI
- **MySQL** — schema managed by Flyway migrations (`backend/src/main/resources/db/migration/`), run automatically by the `flyway` compose service before the backend starts

### Backend layering

Controller → Service → DAO → Entity, all under `com.example.demo`:

- `controller/` — one `LeagueController` handles almost every league-scoped endpoint (`/api/leagues/**`: leagues, tribes, contestants, episodes, rosters, scores, merge, leaderboard); `UserController` handles auth/user endpoints separately.
- `service/` — business logic and authorization checks live here, not in controllers. Services throw `ResponseStatusException` directly (e.g. `HttpStatus.FORBIDDEN`, `HttpStatus.BAD_REQUEST`) rather than using a global exception handler.
- `dao/` — **not** Spring Data repositories. Each DAO is a plain `@Repository` class using an injected `EntityManager` directly (JPQL via `createQuery`, `entityManager.persist/find`). Follow this pattern for new DAOs rather than introducing `JpaRepository`.
- `dto/` — request/response records passed across the controller boundary; entities are never serialized directly.
- `entity/` — JPA entities.

Authorization convention: admin-only mutations take an explicit `adminUserId` in the request body/query (not derived from the session), and services verify that user's `LeagueMember.Role` before proceeding (see `LeagueService.requireAdminLeague`). Follow this pattern for any new admin-gated endpoint.

Session-based auth: Spring Security + Spring Session backed by JDBC (`spring.session.jdbc`), session table created by migration, not Hibernate. A missing/invalid session is remapped to `401` (vs. application-level `403` for "logged in but not permitted") in `SecurityConfig`'s `authenticationEntryPoint` — this distinction matters to the frontend's auth-unauthorized handling.

### Frontend structure

- `src/api/index.ts` — the entire HTTP client: every backend call plus its response type lives in this one file. Add new endpoints here rather than creating a separate api module. All requests use `credentials: "include"`; a 401 dispatches a global `auth:unauthorized` window event picked up elsewhere (auth context) rather than being handled per-call.
- `src/app/App.tsx` — route table. `RequireAuth`/`RequireGuest` gate routes based on `AuthContext`; authenticated routes share `Navigation` via a layout route.
- `src/app/pages/` — route-level views; `src/app/components/` — shared components including `components/ui/` (Radix-based primitives: button, dialog, select, tabs, etc.).
- Path alias `@` → `frontend/src` (configured in `vite.config.ts`).

### Frontend ↔ backend wiring

The frontend calls relative paths (`/api/...`) with no dev-server proxy configured in `vite.config.ts`. In Docker, `nginx.conf` in the frontend container reverse-proxies `/api/*` to the `backend` service so the browser only ever sees one origin (avoids CORS). This means **`docker compose up` is the primary way to run the full stack** — plain `npm run dev` (Vite dev server) will not have a working `/api` proxy on its own.

## Running the app

```bash
cp .env.example .env   # first time only — holds APP_INVITE_CODE, gitignored
docker compose up --build
```

Secrets live in the root `.env` (auto-loaded by Docker Compose) and are passed into containers as env vars, never committed. `application.properties` references them with no default (`app.invite-code=${APP_INVITE_CODE}`) so a missing secret fails at startup instead of silently defaulting.

Starts MySQL, runs Flyway migrations, then backend (`:8080`) and frontend (`:3000`, nginx-served build reverse-proxying `/api`).

Production adds a Cloudflare Tunnel:

```bash
TUNNEL_TOKEN=<token> docker compose --profile production up -d --build
```

Production runs on a Raspberry Pi (home server), reached via the Cloudflare Tunnel rather than a directly exposed port. Keep this in mind for resource usage (the backend's `JAVA_TOOL_OPTIONS` in `docker-compose.yml` already caps heap at 512m for this reason) and architecture (images must run on the Pi's arch — check `docker compose build` output rather than assuming x86_64).

### Seeding data

```bash
backend/src/main/resources/db/seed.sh [checkpoint]
```

Runs against the `mysql` compose service (must already be up). Loads `seed_league.sql` (a "Season 51 League" with sample users alex/jordan/sam/casey), then optionally one of `checkpoint_{1,2,3,4}.sql` to fast-forward the league to a later point in the season (e.g. mid-season, post-merge) for testing.

### Backend only (outside Docker)

```bash
cd backend
./mvnw spring-boot:run       # requires MySQL reachable at the URL in application.properties
./mvnw test                  # run tests
./mvnw test -Dtest=ClassName # run a single test class
```

### Frontend only (outside Docker)

```bash
cd frontend
npm run dev     # Vite dev server — note: no /api proxy, see above
npm run build
```

## Migrations

**This app is live in production** with real user data. Never make ad-hoc changes to the production database — every schema change must go through a Flyway migration script, and every data fix/backfill should too (rather than a one-off manual query), so it's applied consistently and repeatably wherever it runs (dev, and the Pi in production).

Add new schema changes as a new `V{n}__description.sql` file in `backend/src/main/resources/db/migration/` — never edit an already-applied migration. Flyway runs these automatically via the compose `flyway` service. The `checkpoint_*.sql` files under `db/` are seed/test fixtures, not schema migrations.
