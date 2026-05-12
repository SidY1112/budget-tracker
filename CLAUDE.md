# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code conventions

**Function comments:** Add one short comment above every function explaining the *why* — the reason it exists, a constraint, or anything non-obvious. The function name covers the *what*; the comment covers the *why*.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint via next lint
```

No test suite is configured yet.

## Stack

- **Next.js 14** with App Router (`app/` directory), TypeScript
- **Tailwind CSS** for styling
- **Supabase** (`@supabase/ssr`) for database and authentication

## Architecture

### Supabase Client

`lib/supabase.js` exports a single `createClient()` that returns a browser client via `createBrowserClient` from `@supabase/ssr`. Required env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set in `.env.local`).

**Important:** Two client files exist — keep them separate. `lib/supabase-server.js` exports `createSupabaseServerClient()` (uses `next/headers`, server-only). Never import `lib/supabase-server.js` from a Client Component — `next/headers` will break the client bundle.

### Auth Flow

- Signup: `app/signup/page.tsx` (client component) → `supabase.auth.signUp()` → redirect to `/dashboard`
- Login page and the `/dashboard` route are not yet implemented (current work is on `feature/dashboard` branch)

### Pages

- `app/page.tsx` — async server component, queries the `categories` Supabase table
- `app/signup/page.tsx` — client component handling user registration

### Path Alias

`@/` maps to the project root (configured in `tsconfig.json`).
