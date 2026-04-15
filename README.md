# Volunteer Tracker

Swim team volunteer hours tracker. Volunteers log hours/donations, organizers manage events and see who's contributed.

Currently a **paper prototype** — everything runs client-side with localStorage (no real database yet). Backend files (drizzle schema, auth, seed) are included for when we switch to a real database.

## Stack

- **SvelteKit** (Svelte 5 w/ runes) — frontend + routing
- **Bun** — package manager + runtime
- **localStorage** — fake database for the prototype
- **Drizzle + Neon** — real database (ready to wire up, not active yet)

## Setup

```sh
bun install
bun run dev --open
```

## Test accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | organizer |
| raymond | password | volunteer |

These are seeded automatically on first load. Use **Manage > Reset All Local Data** to re-seed.

## Project structure

```
src/
├── app.css                      # global styles (colors, buttons, nav, cards, etc.)
├── app.html                     # HTML shell (PWA meta tags)
├── app.d.ts                     # TypeScript type declarations
├── hooks.server.ts              # session middleware (not active in prototype)
├── lib/
│   ├── store.svelte.ts          # THE BIG FILE — all state + localStorage persistence
│   └── server/                  # backend code (not active in prototype)
│       ├── auth.ts              # login, register, sessions
│       ├── settings.ts          # site-wide settings
│       ├── seed.ts              # test data seeder
│       └── db/
│           ├── index.ts         # database connection
│           └── schema.ts        # table definitions
└── routes/
    ├── +layout.svelte           # root layout (loads CSS, inits store)
    ├── +layout.ts               # disables SSR for prototype mode
    ├── +page.svelte             # landing page with login buttons
    ├── login/                   # login page
    ├── register/                # registration page
    ├── logout/                  # clears session
    ├── offline/                 # offline fallback
    ├── organizer/               # organizer dashboard (green nav)
    │   ├── manage/              # site settings + data reset
    │   └── volunteers/[id]/     # volunteer list + profiles
    └── volunteer/               # volunteer dashboard (blue nav)
        ├── account/             # manage children + change password
        ├── events/[id]/         # event list + signup
        ├── log/                 # log volunteer hours
        └── tutorial/            # how-to guide

## Commands

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run db:push` | Sync schema.ts to the database (when using real backend) |
| `bun run db:seed` | Seed test data (when using real backend) |
| `bun run check` | TypeScript type checking |
```
