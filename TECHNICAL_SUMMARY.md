# VolunteerTracker - Technical Cheat Sheet

Quick reference for answering technical questions about the CPWD Swim Team Volunteer Tracker.

---

## **Core Tech Stack**

### Frontend Framework

- **SvelteKit** with **Svelte 5** (using modern "runes" mode)
- Progressive Web App (PWA) capable - can work offline
- Fully responsive design (works on mobile, tablet, desktop)

### Backend & Runtime

- **Bun** - Fast JavaScript runtime and package manager (alternative to Node.js/npm)
- Server-side rendering (SSR) with SvelteKit
- Session-based authentication with HTTP-only cookies

### Database

- **PostgreSQL** hosted on **Neon** (serverless PostgreSQL)
- **Drizzle ORM** - Type-safe database queries
- Automated migrations with Drizzle Kit

### Build Tools

- **Vite** - Fast bundler and dev server
- **TypeScript** - Type safety throughout the codebase
- Adapter-auto for flexible deployment

---

## **Key Features & Architecture**

### User Roles (2 types)

1. **Volunteer** - Parents, relatives, friends who log hours/donations
2. **Organizer** - Admin who manages everything (typically 1 person)

### Authentication

- Email + password login (no username)
- Passwords hashed with **bcrypt-ts** (industry standard, secure)
- Session tokens stored in HTTP-only cookies (prevents XSS attacks)
- Every request checks authentication via `hooks.server.ts`

### Main Data Models

**Users Table**

- Stores both volunteers and organizers
- Email (unique), password hash, role, name
- Manual approval system (organizer can approve new signups)

**Children Table**

- Swimmers on the team
- Linked to volunteer accounts (many-to-many relationship)
- Two statuses: "full_member" (30 hrs required) or "tryout" (4 hrs required)
- Swim levels are configurable by organizers

**Events Table**

- Volunteer opportunities (meets, cleanups, fundraisers)
- Has date, time, location, description
- Volunteers can sign up through the app

**Contributions Table**

- Logs volunteer hours OR monetary donations
- Can be linked to events or logged independently
- Tracks activity type (repair, timing, concessions, etc.)

**Database Views** (auto-calculated)

- `user_totals` - Total hours + donations per volunteer
- `child_totals` - Total hours across all linked volunteers per child

### Security Features

- Password hashing (bcrypt with 10 rounds)
- Session-based auth (not JWT, more secure for web apps)
- HTTP-only cookies (can't be accessed by JavaScript)
- Type-safe database queries (prevents SQL injection)
- Input validation on forms

---

## **Application Structure**

### Volunteer Portal (Blue navigation)

- **Dashboard** - View announcements, upcoming events
- **Account** - Add/edit children, change password
- **Events** - Browse and sign up for events
- **Log** - Log volunteer hours or donations
- **Tutorial** - Guide on how to use the system

### Organizer Portal (Green navigation)

- **Dashboard** - View all volunteers, upcoming events
- **Volunteers** - Manage volunteer accounts, view individual profiles
- **Events** - Create/edit/delete events
- **Manage** - Site settings (hour requirements, donation rates)
  - Email settings (integrated with EmailJS)
  - Data reset for new seasons
  - Activity types configuration
  - Tutorial management

### Routing Convention (SvelteKit)

- `+page.svelte` = UI component
- `+page.server.ts` = Server-side logic (database queries, auth checks)
- `+layout.svelte` = Shared layout wrapper
- `[id]` folders = Dynamic routes (e.g., `/volunteers/5` for volunteer #5)

---

## **Special Features**

### Internationalization (i18n)

- Built-in language switching capability
- Currently supports English (can add French, Spanish, etc.)
- Stored in `lib/i18n.ts`

### Email Integration

- Uses **EmailJS** service
- Organizers can send emails to volunteers
- Credentials stored in environment variables (secure)
- Multiple email accounts configured (Proton Mail)

### Data Management

- **Season Archives** - Snapshot contributions at season end
- **Data Reset** - Clear hours without losing history
- **Seeding** - Test data generator for development

### Activity Types

- Configurable categories: Repair, Trophies, Timing, Concessions, etc.
- Organizers can add/remove/deactivate types

### Visual Analytics

- `VolunteerChildGraph.svelte` - Visual progress tracking
- Charts show hours completed vs. required

---

## **Technical Operations**

### Database Commands

```bash
bun run db:push       # Sync schema changes to database
bun run db:generate   # Generate migration files
bun run db:migrate    # Run migrations
bun run db:studio     # Open Drizzle Studio (database GUI)
bun run db:seed       # Add test data
```

### Development Commands

```bash
bun run dev           # Start development server
bun run build         # Production build
bun run preview       # Preview production build
bun run check         # TypeScript type checking
```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (Neon)
- Email credentials (for EmailJS)

---

## **Deployment & Hosting**

- Uses **adapter-auto** - automatically detects deployment platform
- Compatible with: Vercel, Netlify, Cloudflare Pages, Node.js servers
- Database hosted on **Neon** (serverless, auto-scaling PostgreSQL)
- Static assets served from `/static` folder

---

## **Performance & Scalability**

- **SSR (Server-Side Rendering)** - Fast initial page loads
- **Progressive Web App** - Can install to home screen, works offline
- **Database views** - Pre-computed totals (fast queries)
- **Neon serverless** - Automatically scales with usage
- **Type safety** - Catch errors at compile time, not runtime

---

## **Data Validation & Integrity**

- TypeScript types throughout (compile-time safety)
- Drizzle schema validation (database-level constraints)
- Foreign key constraints (cascading deletes)
- Unique email addresses enforced
- Form validation on client and server

---

## **Common Technical Questions - Quick Answers**

**"What framework is this built on?"**
→ SvelteKit with TypeScript

**"Is it secure?"**
→ Yes: bcrypt password hashing, HTTP-only cookies, SQL injection prevention, input validation

**"Can it handle multiple users?"**
→ Yes: PostgreSQL database, session management, concurrent access supported

**"Does it work on mobile?"**
→ Yes: Responsive design, PWA-capable, works on all screen sizes

**"What if the internet goes down?"**
→ PWA features allow offline viewing (cached pages)

**"Can you add features easily?"**
→ Yes: TypeScript catches errors, Drizzle ORM is type-safe, SvelteKit is component-based

**"Where is the data stored?"**
→ PostgreSQL database on Neon (cloud-hosted, serverless)

**"Can we export data?"**
→ Yes: Export API endpoint at `/api/export`

**"How do you prevent duplicate entries?"**
→ Unique constraints (email), database-level validation

**"Can organizers send emails to volunteers?"**
→ Yes: EmailJS integration, scheduled sending capability

---

## **Project History**

- **Team**: Raymond Liu, Zilin Liu, Mary Liu
- **Course**: Grade 12 Computer Science (ICS4U)
- **Client**: Ms. Gilby (Carleton Place Water Dragons Swim Team)
- **Problem**: Replace inefficient paper/email-based volunteer tracking
- **Key Design Decision**: Support multiple volunteers per child (reunited families, relatives helping)

---

## **Test Credentials**

| Email               | Password | Role      |
| ------------------- | -------- | --------- |
| admin@example.com   | admin123 | Organizer |
| raymond@example.com | password | Volunteer |
| mary@example.com    | password | Volunteer |

---

## **Key Differentiators**

✅ **Role-based access** - Two distinct portals (volunteer vs. organizer)  
✅ **Family flexibility** - Multiple volunteers can contribute to one child's hours  
✅ **Dual tracking** - Both volunteer hours AND monetary donations  
✅ **Historical archives** - Season snapshots preserve history when resetting  
✅ **Type safety** - TypeScript + Drizzle ORM = fewer bugs  
✅ **Modern stack** - Latest frameworks (Svelte 5, Vite, Bun)  
✅ **Configurable** - Swim levels, activity types, hour requirements all adjustable

---

**Bottom line**: This is a modern, secure, scalable web application built with industry-standard tools and best practices. It's production-ready and maintainable.
