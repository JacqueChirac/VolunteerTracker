# Volunteer Tracker

Swim team volunteer hours tracker. Parents log hours/donations, organizers manage events and see who's contributed.

## Stack

- **SvelteKit** (Svelte 5 w/ runes) — frontend + server routes
- **Drizzle ORM** — type-safe database queries
- **Neon** — serverless Postgres
- **Bun** — package manager + runtime

## Setup

```sh
bun install
```

Create a `.env` file with your Neon database URL:

```
DATABASE_URL=postgresql://...
```

Push the schema to the database and seed it with test data:

```sh
bun run db:push
bun run db:seed
```

## Dev

```sh
bun run dev --open
```

## Test accounts (after seeding)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | organizer |
| raymond | password | parent |
| mary | password | parent |
| zilin | password | parent |

## Project structure

```
src/
├── hooks.server.ts          # runs on every request, loads user from session cookie
├── lib/
│   └── server/
│       ├── auth.ts          # login, register, session tokens
│       ├── settings.ts      # site-wide settings (hours required, donation rate)
│       ├── seed.ts          # populates db with test data
│       └── db/
│           ├── index.ts     # database connection
│           └── schema.ts    # all table definitions
└── routes/
    ├── login/               # login page
    ├── register/            # registration page
    ├── logout/              # clears session
    ├── organizer/           # organizer dashboard (manage events, view volunteers)
    │   ├── manage/          # event/settings management
    │   └── volunteers/      # volunteer list + individual profiles
    └── parent/              # parent dashboard (log hours, view events)
        ├── account/         # account settings
        ├── events/          # event list + signup
        ├── log/             # log volunteer hours
        └── tutorial/        # how-to guide
```

## Commands

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run db:push` | Sync schema.ts to the database |
| `bun run db:seed` | Seed test data |
| `bun run check` | TypeScript type checking |
