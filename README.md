# Choragon

Web frontend for a gamified household chore tracker. Teams (a household, a flat
share) post chores as collectible **cards** with a rarity, XP and gold rewards.
Members claim cards, complete them, and an admin verifies the work, which pays
out the rewards and levels the member up.

Built with Angular 18 (standalone components, signals), Transloco for i18n and
Google Identity Services for sign-in. The backend is
chorahost (Quarkus); see its README for the
game rules and the full API.

## Features

- **Quest board.** Browse a team's cards by status (`AVAILABLE` → `CLAIMED` →
  `COMPLETED` → `VERIFIED`), claim, unclaim, complete and acknowledge rewards.
- **Card designer.** Admins create and edit cards: rarity, XP, gold, due date
  and image.
- **Card templates.** Admins set up recurring cards that respawn on a schedule
  or after verification.
- **Leaderboard.** Per-team ranking with level, XP and gold; admins can assign
  `USER`/`ADMIN` roles from here.
- **Teams and invitations.** Create a team, invite members by email, and join
  with an invite code.
- **Internationalisation.** English and Hungarian, switchable at runtime.

## Getting started

Requirements: Node.js 18.19+ (20 LTS recommended) and npm. You also need the
backend running; see the chorahost README (`./mvnw quarkus:dev`, needs JDK 21
and Docker).

```shell
npm install
npm start
```

The app is served at <http://localhost:4200/> and reloads on changes.

### Signing in

In the dev build the login screen shows a **Sign in as dev user** box. Enter any
seeded email (`alice@example.com`, `bob@example.com`, `carol@example.com`,
`dave@example.com`, `emily@example.com`) and the app sends it to the backend as
the `X-Dev-User` header, which the backend only honours under its dev profile.
Production builds use Google sign-in only.

## Configuration

Runtime settings live in `src/environments/environment.ts`:

| Key | Purpose | Default |
| --- | --- | --- |
| `apiBaseUrl` | Base URL of the chorahost backend | `http://localhost:8080` |
| `googleClientId` | Google OAuth client id used for sign-in | project client id |

The backend must allow the frontend's origin via its `CORS_ORIGINS` setting
(`http://localhost:4200` by default) and be configured with the same Google
client id (`CHORAHOST_OIDC_CLIENT_ID`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Dev server on port 4200 |
| `npm run build` | Production build into `dist/` |
| `npm run watch` | Development build, rebuilding on change |
| `npm test` | Unit tests with Karma and Jasmine |
| `npm run i18n:check` | Verify translations (see below) |

## Internationalisation

Translations are JSON files in `public/i18n/` (`en.json`, `hu.json`), loaded at
startup by Transloco with messageformat support for plurals. English is the
fallback language, and the selected language is remembered between visits.

`npm run i18n:check` fails if any language is missing keys that `en.json` has
(or has extras), or if a statically referenced key in `src/` does not exist in
`en.json`. Run it after adding or renaming strings. To add a language, add a
`<code>.json` file with the same keys and register the code in
`SUPPORTED_LANGS` in `src/app/services/language.service.ts`.

## Project layout

```
src/app/
  components/    UI: quest-board, chore-card, card-designer, card-templates,
                 leaderboard-sidebar, team-setup, login, dialogs, ...
  services/      api (HTTP client), auth (Google/dev login), chore-store
                 (shared state), language
  interceptors/  auth interceptor attaching the bearer token / dev header
  models/        API types
  pipes/         localized date formatting
  i18n/          Transloco loader
public/
  i18n/          translation files
  brand/         social preview image
  *.svg, *.ico   Gem Crest logo, favicon and app icons
scripts/         tooling (i18n check)
```

## Deployment

`npm run build` produces a static site in `dist/`; serve it from any static
host with a fallback to `index.html`. Before building, point `apiBaseUrl` at
the deployed backend and add the site's origin to the backend's `CORS_ORIGINS`
and to the authorised JavaScript origins of your Google OAuth client.
