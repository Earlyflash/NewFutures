# NewFutures

End-of-year performance and objectives application. Set objectives, complete self-assessments, and get manager feedback in one place.

## Features

- **Authentication (OIDC stub)**  
  Sign in with any email (no password). Replace with a real OIDC provider (e.g. Keycloak, Azure AD) when ready.

- **Objectives**  
  Create and edit objectives for a review cycle (e.g. FY2025). Add title, description, and relative weight.

- **Review cycles**  
  HR defines cycles (Draft → Open → In review → Closed). Employees add objectives to open cycles.

- **Self-assessment**  
  Rate and comment on your own objectives (1–5 and free text).

- **Manager review**  
  Managers see direct reports under **Team**, open each person, and add ratings and feedback per objective.

- **Profile**  
  View and edit your display name. Manager and role are shown (from DB; with OIDC they’d come from the IdP).

- **Dashboard**  
  Quick view of your objective count, open cycles, and (for managers) number of direct reports.

## Tech stack

- **Next.js 14** (App Router), TypeScript
- **GOV.UK Design System (GDS)** – [govuk-frontend](https://www.npmjs.com/package/govuk-frontend) for styles and components (SASS + copied assets)
- **NextAuth.js** (credentials stub; swap to OIDC later)
- **Prisma** + SQLite (dev); switch to PostgreSQL by changing `DATABASE_URL` and provider in `prisma/schema.prisma`

## Getting started

1. **Install and database**

   ```bash
   npm install
   cp .env.example .env
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

2. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in with any email (e.g. `you@company.com`).

3. **Seed data**  
   The seed creates one open review cycle **FY2025**. Add objectives from the **My objectives** page.

4. **Manager view**  
   To see **Team** and review others, set yourself as their manager in the database (e.g. via Prisma Studio: `npx prisma studio`), or create a user and set their `managerId` to your user id.

## Switching to real OIDC

1. Add your OIDC provider in `src/lib/auth.ts` (e.g. `Providers.Keycloak` or `Providers.AzureAD`).
2. Set provider env vars (e.g. `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, issuer URL).
3. Remove or keep the credentials provider for local dev.
4. Ensure your IdP returns a stable `sub` (or email); map it in the `jwt`/`session` callbacks so `session.user.id` matches your `User.id` (e.g. look up or create user by `sub`/email and set `token.id`).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Start production server   |
| `npm run db:push` | Apply schema to DB    |
| `npm run db:seed` | Seed review cycle     |

## Standard HR/performance features (included or planned)

| Feature              | Status   |
|----------------------|----------|
| Login (OIDC stub)    | Done     |
| Objectives CRUD      | Done     |
| Review cycles        | Done     |
| Self-assessment      | Done     |
| Manager review       | Done     |
| Roles (Employee/Manager/HR) | Model only; extend UI as needed |
| Profile              | Done     |
| Dashboard            | Done     |
| Notifications        | Placeholder (e.g. “2 pending reviews”) |
| Calibration / HR reports | Future  |
| 360° feedback        | Future   |
| Export / PDF          | Future   |
