# Survivor Fantasy

A fantasy sports app for CBS's *Survivor*. Create a league with your friends, draft a roster of castaways, and compete for the season by earning points as your picks survive, win challenges, and make it to the end.

**Live app:** [survivor-fantasy.app](https://survivor-fantasy.app/)

## Features

### Leagues

Create a league for the current season or join one with an invite code. Each league card shows the season, how many contestants you draft per tribe, the join code to share with friends, and whether picking is currently open.

![My Leagues](resources/images/my_leagues.png)

### Draft Your Roster

When picking opens, draft contestants from each tribe up to the league's limit, then designate one pick as your **MVP** for bonus points if they win the season. Submit once your roster is complete.

![Pick Your Roster](resources/images/roster_picking.png)

### Track Your Team

Your roster page shows league info at a glance — member count, join code, and whether Initial Picks or Merge Pick is currently open — plus each of your contestants and the points they've earned so far. Eliminated contestants are flagged "Out" but hold onto the points they already scored.

![My Roster](resources/images/roster.png)

### Standings

The leaderboard ranks every member of your league by total points, with medals for the top spots. Peek at anyone's roster to see who they drafted.

![Standings](resources/images/standings.png)

### League Admin

League commissioners get an admin panel to manage the league:

- **Players** — see who has completed their Initial Picks and Merge Pick, and edit any member's roster on their behalf.

  ![Admin: Players](resources/images/admin_players.png)

- **Season** — open or close the Initial Picks and Merge Pick drafting windows, and add episodes to score as the season airs.

  ![Admin: Season](resources/images/admin_season.png)

## How to Play

1. **Join a league** with an invite code, or create your own and share the code with friends.
2. Once the commissioner opens **Initial Picks**, draft your roster — a set number of contestants from each starting tribe — and pick one as your **MVP**.
3. As episodes air, the commissioner records results and points are awarded to your roster.
4. Contestants voted out are marked **Out** but their points to that point still count.
5. After the merge, the commissioner opens the **Merge Pick** window for a second round of drafting.
6. Climb the **Standings** leaderboard — if your MVP wins the season, you earn a bonus on top of their regular points.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend:** Spring Boot (Java), Spring Security, Spring Session (JDBC), Spring Data JPA
- **Database:** MySQL, with Flyway for schema migrations
- **Deployment:** Docker Compose, Cloudflare Tunnel

## Running with Docker

Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

**Development:**

```bash
docker compose up --build
```

This starts MySQL, runs Flyway migrations, and brings up the backend and frontend:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)

**Production** (adds a Cloudflare Tunnel, e.g. for a home server deployment):

```bash
TUNNEL_TOKEN=<your-cloudflare-tunnel-token> docker compose --profile production up -d --build
```
