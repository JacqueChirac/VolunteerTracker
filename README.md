# Volunteer Tracker

Swim team volunteer hours tracker. Volunteers log hours/donations, organizers manage events and see who's contributed.

## Stack

- **SvelteKit** (Svelte 5 w/ runes) — frontend + routing
- **Bun** — package manager + runtime
- **Drizzle + Neon** — PostgreSQL database

## Setup

```sh
bun install
bun run db:generate
bun run db:migrate
bun run dev --open
```

## Test accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | organizer |
| raymond@example.com | password | volunteer |
| mary@example.com | password | volunteer |
| zilin@example.com | password | volunteer |

Login uses email (no username).

## Project structure

```
src/
├── app.css                      # global styles (colors, buttons, nav, cards, etc.)
├── app.html                     # HTML shell (PWA meta tags)
├── app.d.ts                     # TypeScript type declarations
├── hooks.server.ts              # session middleware (not active in prototype)
├── lib/
│   └── server/
│       ├── auth.ts              # login, register, sessions
│       ├── settings.ts          # site-wide settings
│       ├── seed.ts              # test data seeder
│       └── db/
│           ├── index.ts         # database connection
│           └── schema.ts        # table definitions
└── routes/
    ├── +layout.svelte           # root layout
    ├── +layout.server.ts        # passes user to all pages
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
| `bun run db:push` | Sync schema.ts to the database |
| `bun run db:seed` | Seed test data |
| `bun run check` | TypeScript type checking |
```
