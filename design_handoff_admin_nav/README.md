# Handoff: Left-Rail Navigation & Admin Panel Redesign

## Overview
Replaces the league page's top pill-tab navigation (My Roster / Standings / Admin) and Admin's four-tab sub-row with a left sidebar (rail) nav. Admin collapses into two combined sections — **Players** (roster + pick-status per user) and **Season** (pick-window toggles + an episode list with a modal for entering per-episode scores). Also introduces manually-added episodes (no fixed episode count) with add/delete and a merge-episode flag per episode.

## About the Design Files
The bundled file is a **design reference built in HTML** (a working interactive prototype), not production code to copy directly. Recreate this UI in the target codebase's existing environment (React, Vue, native, etc.) using its established components, state management, and API patterns. If no environment exists yet, choose the framework best suited to the project.

## Fidelity
**High-fidelity.** Colors, type, spacing, and component states are final — implement pixel-for-pixel using the target app's own design-system tokens/components that match the values below (the source design uses the "Nocturne" design system's CSS variables; the developer should substitute the target app's equivalent tokens where the same purpose applies, but keep the sizes/hierarchy described here).

## Screens / Views

### 1. App shell (all tabs)
- **Layout**: Full-height flex row. Left rail: fixed 220px width, right border 1px, padding 22px/14px vertical/horizontal, flex column, 3px gap between rail items. Main content: flex:1, padding 32px/40px, flex column, 22px gap between sections.
- **Rail contents (top to bottom)**:
  - League brand block: league name (15px/500 weight, heading font), season name below (12px/400, muted color), 16px bottom padding.
  - Nav buttons, full width, left-aligned text, 8px/10px padding, 13px/400 font, border-radius small (~6-8px): "My Roster", "Standings", "Admin".
  - Active nav item: font-weight 500, text color full-bright, background a tinted accent fill (dark tinted purple, ~ the design system's "accent-800" step).
  - When "Admin" is active, two sub-items appear indented beneath it, connected by a 1px left border rule: "Players" and "Season" (12px/400 font, muted; active sub-item goes 500 weight + accent-tinted text color, no background).
- **Main content header** (shown on every tab): league title (22px/500, heading font) + season name (13px/400, muted) on the left; "Edit Roster" secondary button top-right.
- **Info row**: 3-column grid, equal widths, 10px gap. Each cell: dark surface background, 1px border, ~12px/14px padding, small uppercase label (10px, muted, letter-spacing), value below (18px/500 heading font).
  - Cell 1 "Members": count.
  - Cell 2 "League Code": code in accent color.
  - Cell 3 "Picking": two stacked small pill/tags — "Initial: Open/Closed" and "Merge: Open/Closed" (Merge reads "N/A" until a merge episode exists). Tag is filled/accent when Open, neutral/outlined when Closed or N/A.

### 2. My Roster tab
- Card containing "Your Picks" kicker + "{n} contestants selected" title.
- List of the current user's roster: each row shows a small tribe-color dot, contestant name (13px/500), an accent "MVP" tag if applicable, a muted "Out" tag if eliminated, and the contestant's total points right-aligned (13px/500).

### 3. Standings tab
- Card with "Leaderboard" kicker + "Scores updated after each episode" title.
- Rows per league member, sorted by total descending: name (13px/500), "You" outline tag for the current user, "Admin" neutral tag for the admin, total points right-aligned (15px/500).

### 4. Admin → Players
- One card per league member.
- Card header: member name (15px/500), "Admin" tag if applicable, "Edit Roster" ghost link/button top-right.
- Status row: two tags — "Initial Picks: Submitted/Pending" (accent when submitted, outline when pending) and "Merge Picks: Submitted/Pending/N/A" (neutral if N/A, i.e. no merge episode yet).
- Roster chips row: one chip per contestant — tribe-color dot, name, "MVP" label in accent color if applicable, "Out" label in muted color if eliminated. The MVP contestant's chip gets an accent-colored border; others get a neutral border.

### 5. Admin → Season
- **Season Controls card**: two rows, each with a label on the left and a toggle button on the right:
  - "Initial Picks" → button reads "Open"/"Closed", toggles state.
  - "Merge Picks" → same pattern; **disabled until at least one episode is flagged as a merge episode**.
- **Episodes card**: header row with "Episodes" kicker and an "Add Episode" primary button (adds the next-numbered episode and immediately opens it in the modal below).
  - Below: one row per episode, in a bordered list (row divider between items, no divider after the last). Each row: "Episode {n}" (13px/500) + an accent "Merge" tag if that episode is flagged as the merge episode. Clicking anywhere on the row (except the delete button) opens that episode's modal. Only the **highest-numbered** episode shows a "Delete" button (small ghost button, muted text) — deleting it removes that episode and its scores. A chevron ("›") sits at the row's right edge as an affordance.
  - Empty state: if there are no episodes yet, show muted helper text: "No episodes yet — add the first one to start entering scores."

### 6. Episode modal (opened from an Episodes row)
- Standard modal/dialog pattern: dark backdrop, centered dialog panel (~560px wide, max-height ~82% viewport, scrolls internally), title "Episode {n}".
- Body:
  - Top row: "Merge Episode" label + Yes/No toggle button (marks this episode as the merge episode for the season; only one episode should be flagged as merge at a time in practice).
  - One row per contestant: tribe-color dot, contestant name (13px/500, dims to muted gray once the contestant is eliminated in ANY episode), tribe name (11.5px, muted); on the right, a "Mark Out"/"Out" toggle button (marks the contestant eliminated in this specific episode) and a numeric score input (small, centered text, no spinner arrows) bound to that contestant's points for this episode.
- Footer: single primary "Done" button that closes the modal (edits apply live as you type/toggle — there is no separate save step).
- Clicking the backdrop also closes the modal; clicking inside the dialog does not.

## Interactions & Behavior
- Nav switching is simple tab/state switching, no routing needed unless the target app already uses routes per tab.
- Admin's two sub-items only render in the rail when the "Admin" top-level tab is active.
- A contestant's **total points** = sum of that contestant's score across all episodes.
- A contestant is **eliminated** (shown grayed out / "Out") once they've been marked out in any single episode — that status persists across all later views once set.
- "Merge Picks" open/closed toggle in Season Controls is disabled (and reads unavailable) until at least one episode has been flagged `mergeEpisode: true`.
- Adding an episode: assigns the next sequential number, seeds all contestants at 0 points / not eliminated, and opens it directly in the modal for entry.
- Deleting an episode is only available for the current highest-numbered episode (prevents leaving gaps in the sequence); it removes that episode's score contributions from all totals immediately.
- No loading/error states — this is a static-data prototype; the real implementation should wire these actions to the league's backend (see State Management).

## State Management
Suggested state shape for the real implementation:
- `episodes`: ordered list of `{ id, number, isMergeEpisode, scores: { contestantId: points }, eliminatedContestantIds: [] }`.
- `contestants`: base roster data `{ id, name, tribeId }`; points and eliminated status are **derived** from `episodes`, not stored redundantly.
- `users`/`members`: `{ id, name, isAdmin, rosterContestantIds: [], mvpContestantId, initialPicksSubmitted, mergePicksSubmitted }`.
- `season`: `{ initialPicksOpen, mergePicksOpen }` — `mergePicksOpen` should be unreachable/disabled while no episode has `isMergeEpisode: true`.
- UI state: `activeTab` ('roster' | 'standings' | 'admin'), `activeAdminSubtab` ('players' | 'season'), `openEpisodeId` (nullable, drives the modal).
- Data fetching: episode scores, roster edits, and pick-window toggles should all be admin-only writes persisted to the league's backend per the app's existing API patterns.

## Design Tokens
Values from the source design system (substitute the target app's equivalent tokens where available):
- Background (page): near-black blue-grey, `#161826`-family dark ground.
- Text: off-white `#e9e9ed`-family.
- Accent: single purple/blurple accent (~`#9184d9` hue family); used for active states, MVP labels, accent tags/buttons — never as a large fill.
- Borders/dividers: low-contrast neutral, dark ramp step (roughly `rgba(233,233,237,0.08–0.12)` equivalent).
- Card surface: slightly lighter than page background, 1px border, no heavy shadow (a soft ambient shadow only).
- Radius: small (~6px) for rail items/buttons/inputs, medium (~8px) for cards and the modal.
- Type: single sans family for both headings (weight 500) and body (weight 400); heading sizes used here: 22px (page title), 15-19px (card/section titles), 13-14px (row/label text); never bold past weight 500.
- Tribe identity dots: small (7px) filled circles, one distinct hue per tribe (kept desaturated/low-chroma except for this specific identity-marking use).

## Assets
No images or icons are used — all indicators are text tags, colored dots, and buttons. Any icon needs (e.g. a chevron glyph) can be swapped for the target app's icon set.

## Files
- `Survivor League App.dc.html` — the full interactive prototype (all tabs, admin panels, and the episode modal). Open in a browser to see live behavior; view source for exact markup/structure reference.
