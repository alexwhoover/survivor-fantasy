# Survivor Fantasy — Backend API

Spring Boot REST API with JDBC session-based authentication.

Base URL: `http://localhost:8080`

All endpoints except `/api/users/login`, `/api/users/register`, `/api/users/username-available` and `/api/admin/**` require an active session. Authenticate via the login endpoint and include the `SESSION` cookie on all subsequent requests. Admin endpoints use a secret key instead of a session (see [Site Admin](#site-admin)).

---

## Authentication

### Register
`POST /api/users/register`

Creates a new account and starts a session.

**Request body**
```json
{ "username": "alex", "password": "secret" }
```

**Response** `201 Created`
```json
{ "id": 1, "username": "alex", "createdAt": "2026-06-04T10:00:00" }
```

---

### Login
`POST /api/users/login`

Authenticates and sets the `SESSION` cookie.

**Request body**
```json
{ "username": "alex", "password": "secret" }
```

**Response** `200 OK`
```json
{ "id": 1, "username": "alex", "createdAt": "2026-06-04T10:00:00" }
```

---

### Logout
`POST /api/users/logout`

Invalidates the session and clears the `SESSION` cookie.

**Response** `200 OK`

---

## Site Admin

Site-wide operations for the app owner. These endpoints don't use a session. They're authorized by the `APP_ADMIN_KEY` secret from the root `.env`, sent in the `X-Admin-Key` header. Anyone holding the key can reset any account's password, so:

- Generate it with `openssl rand -hex 32`, and use a different key in dev and production.
- Only send it in the header, never in a URL or query string.
- To rotate it, change `APP_ADMIN_KEY` in `.env` and restart the backend: `docker compose up -d backend`.

The backend refuses to start if `APP_ADMIN_KEY` is missing from `.env`.

### Reset a user's password
`POST /api/admin/reset-password`

Sets a new password for the user and deletes all of their sessions, logging them out everywhere.

**Headers**
```
X-Admin-Key: <APP_ADMIN_KEY>
```

**Request body**
```json
{ "username": "jordan", "newPassword": "temp-password-123" }
```

**Response** `204 No Content`

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | `username` or `newPassword` missing/blank |
| `403 Forbidden` | `X-Admin-Key` missing or wrong |
| `404 Not Found` | No user with that username |

### Resetting a password in production

SSH into the Pi, `cd` into the project directory, and run:

```bash
./admin-scripts/reset-password.sh jordan
```

It asks for the new password twice, hidden as you type, and prints whether the reset worked. If you leave off the username, it asks for that too. The script lives in `admin-scripts/` and works from any directory.

Notes:
- The key is read straight from `.env`, and the password is typed at a prompt and sent via stdin. Neither ends up in shell history or on screen.
- It calls the frontend container on the Pi (`localhost:3000`, nginx proxying to the backend), so it doesn't depend on the Cloudflare Tunnel.
- Quotes and backslashes in the password are escaped, so any password works.
- Send the user their new password privately, and have them log in with it.

---

## Seasons

### List all seasons
`GET /api/seasons`

Returns all seasons ordered by season number descending.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Survivor 51",
    "seasonNumber": 51,
    "location": "Fiji",
    "premiereDate": "2025-09-24",
    "finaleDate": "2025-12-17",
    "mergeEpisode": 7,
    "status": "ACTIVE",
    "winnerContestantId": null,
    "numEpisodes": 14
  }
]
```

`status` is one of: `UPCOMING`, `ACTIVE`, `COMPLETED`

---

### Get season by ID
`GET /api/seasons/{id}`

**Response** `200 OK` — same shape as a single entry from List seasons.

---

### Get season contestants
`GET /api/seasons/{id}/contestants`

Returns all contestants for the season with tribe colours and placement data.

**Response** `200 OK`
```json
[
  {
    "id": 12,
    "firstName": "Jane",
    "lastName": "Smith",
    "hometown": "Austin",
    "state": "TX",
    "tribe": "Loa",
    "tribeColour": "#FF5733",
    "finishPlace": 1,
    "eliminatedEpisode": null,
    "winner": true,
    "imageUrl": "https://..."
  }
]
```

`eliminatedEpisode` is `null` if the contestant is still active.

---

## Leagues

### List leagues for a user
`GET /api/leagues?userId={userId}`

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Season 51 League",
    "code": "SURV51",
    "seasonId": 1,
    "createdBy": 1,
    "createdAt": "2026-06-04T10:00:00",
    "contestantsPerTribe": 2,
    "pickDeadline": "2026-09-24T20:00:00",
    "mergeEpisode": null,
    "mergeDeadline": null
  }
]
```

---

### Get league by ID
`GET /api/leagues/{id}`

**Response** `200 OK` — same shape as a single entry from List leagues.

---

### Create league
`POST /api/leagues`

The requesting user becomes the league admin. `contestantsPerTribe` defaults to `2` if omitted.

**Request body**
```json
{
  "name": "My League",
  "seasonId": 1,
  "userId": 1,
  "pickDeadline": "2026-09-24T20:00:00",
  "contestantsPerTribe": 2
}
```

**Response** `201 Created` — LeagueResponse shape.

---

### Join a league
`POST /api/leagues/join`

**Request body**
```json
{ "code": "SURV51", "userId": 2 }
```

**Response** `200 OK` — LeagueResponse shape.

---

### Get league members
`GET /api/leagues/{id}/members`

**Response** `200 OK`
```json
[
  { "userId": 1, "username": "alex", "role": "ADMIN", "joinedAt": "2026-06-04T10:00:00" },
  { "userId": 2, "username": "jordan", "role": "MEMBER", "joinedAt": "2026-06-04T10:05:00" }
]
```

---

### Get requesting user's role
`GET /api/leagues/{id}/my-role?userId={userId}`

**Response** `200 OK`
```json
{ "role": "ADMIN" }
```

`404 Not Found` if the user is not a member.

---

## Rosters

### Get your roster
`GET /api/leagues/{id}/rosters/me?userId={userId}`

**Response** `200 OK`
```json
{
  "id": 1,
  "leagueId": 1,
  "userId": 1,
  "mvpSeasonContestantId": 12,
  "seasonContestantIds": [10, 11, 12, 13, 14, 15],
  "submittedAt": "2026-09-20T14:30:00"
}
```

`404 Not Found` if no roster has been submitted yet.

---

### Get any user's roster
`GET /api/leagues/{id}/rosters/{userId}`

**Response** `200 OK` — same shape as Get your roster.

---

### Submit / update your roster
`POST /api/leagues/{id}/rosters`

Only allowed before the league's `pickDeadline`. Returns `403` after the deadline for non-admins.

**Request body**
```json
{
  "userId": 1,
  "mvpSeasonContestantId": 12,
  "seasonContestantIds": [10, 11, 12, 13, 14, 15]
}
```

`mvpSeasonContestantId` must be one of the `seasonContestantIds`.

**Response** `201 Created` — RosterResponse shape.

---

### Admin: update any user's roster
`PUT /api/leagues/{id}/rosters/{targetUserId}`

Admin-only. Bypasses the pick deadline. The `userId` in the body is the **admin's** user ID.

**Request body**
```json
{
  "userId": 1,
  "mvpSeasonContestantId": 12,
  "seasonContestantIds": [10, 11, 12, 13, 14, 15]
}
```

**Response** `200 OK` — RosterResponse shape.

---

## Episode Scores

### Get scores for an episode
`GET /api/leagues/{id}/episodes/{episodeNumber}/scores`

Returns all season contestants for the league's season with their points for that episode (0 if not yet entered).

**Response** `200 OK`
```json
[
  { "seasonContestantId": 10, "points": 150 },
  { "seasonContestantId": 11, "points": 0 }
]
```

---

### Save scores for an episode
`POST /api/leagues/{id}/episodes/{episodeNumber}/scores`

Admin operation. Creates or updates scores for the given episode. Returns the full updated score list for that episode.

**Request body**
```json
[
  { "seasonContestantId": 10, "points": 150 },
  { "seasonContestantId": 11, "points": 80 }
]
```

**Response** `200 OK` — same shape as Get scores for an episode.

---

## Merge

### Initiate merge
`POST /api/leagues/{id}/merge/initiate`

Admin-only. Sets the merge episode number and opens the merge action window. Once initiated, members can perform their merge action until the deadline.

**Request body**
```json
{
  "adminUserId": 1,
  "mergeEpisode": 7,
  "mergeDeadline": "2026-11-01T20:00:00"
}
```

**Response** `200 OK` — LeagueResponse shape with `mergeEpisode` and `mergeDeadline` populated.

---

### Perform merge action
`POST /api/leagues/{id}/merge/action`

Each user may call this **exactly once** before the `mergeDeadline`. The action type (add vs. swap) is determined automatically:

- **ADD** — if the user's roster has fewer than the maximum allowed size (`contestantsPerTribe × tribe count`)
- **SWAP** — if the roster is already at maximum size

For **ADD**: provide `addedSeasonContestantId` only.  
For **SWAP**: provide both `addedSeasonContestantId` and `removedSeasonContestantId`.

Constraints:
- The contestant being added must not be eliminated
- For a swap, the contestant being removed must also not be eliminated

**Request body**
```json
{
  "userId": 2,
  "addedSeasonContestantId": 20,
  "removedSeasonContestantId": 11
}
```

`removedSeasonContestantId` can be omitted or `null` for an ADD action.

**Response** `200 OK` — MergeStatusResponse (see below).

---

### Get merge status
`GET /api/leagues/{id}/merge/status`

**Response** `200 OK`
```json
{
  "initiated": true,
  "mergeEpisode": 7,
  "mergeDeadline": "2026-11-01T20:00:00",
  "deadlinePassed": false,
  "memberStatuses": [
    { "userId": 1, "username": "alex", "hasActed": true },
    { "userId": 2, "username": "jordan", "hasActed": false }
  ]
}
```

---

## Leaderboard

### Get league leaderboard
`GET /api/leagues/{id}/leaderboard`

Returns all members ranked by total score. Scoring rules applied:

- Episode points are summed for each contestant on a user's roster
- **Merge-added contestants** (added during merge) only earn points from episodes **after** the merge episode
- **Merge-swapped-out contestants** only earn points from episodes **up to and including** the merge episode
- Eliminated contestants earn no points after their elimination episode
- **+30 MVP bonus** is applied if the user's designated MVP contestant has `winner = true`

**Response** `200 OK`
```json
[
  { "userId": 1, "username": "alex", "totalScore": 980, "mvpBonusApplied": true },
  { "userId": 2, "username": "jordan", "totalScore": 740, "mvpBonusApplied": false }
]
```

Results are sorted descending by `totalScore`.

---

## Error responses

All endpoints return standard HTTP error codes with a plain-text message body:

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Missing or invalid fields |
| `401 Unauthorized` | No valid session |
| `403 Forbidden` | Authenticated but not permitted (wrong role, deadline passed, etc.) |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate action (already a member, already performed merge action) |
