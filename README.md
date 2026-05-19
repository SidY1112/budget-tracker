# Budget Tracker

A full-stack personal finance app that lets users track income, expenses, and budgets with real-time spending insights and chart visualizations.

## Live Demo
https://budget-tracker-ashy-nine.vercel.app

## Features
- Secure authentication with session management
- Add and track expenses by category
- Log monthly income from multiple sources
- Create budgets with custom expiration options
- Dashboard with spending charts and budget progress
- Mobile responsive design
- Per-user data isolation enforced at the database level

## Tech Stack
- **Next.js 14** — full-stack React framework with App Router for server and client components
- **Supabase** — PostgreSQL database with Row Level Security and built-in authentication
- **Tailwind CSS** — utility-first styling with mobile-first responsive design
- **Vercel** — CI/CD deployment connected to GitHub main branch
- **Recharts** — data visualization for spending trends and category breakdowns

## Architecture Decisions

**Component Composition**
Server components handle data fetching and authentication checks. Client components handle interactivity and form state. This separation keeps pages clean and ensures data is fetched before the page reaches the browser.

**Row Level Security**
All user data is isolated at the database level using Supabase RLS policies. Every query is scoped to the authenticated user via auth.uid() — even if application code had a bug, the database would still only return the correct user's data.

**Session Management**
Middleware runs on every request to protected routes, verifying the JWT token against Supabase's auth server before any page loads. This protects all dashboard subroutes automatically without per-page auth checks.

**Separate Supabase Clients**
Browser and server Supabase clients are kept in separate files to prevent Next.js bundling errors. Server components use createSupabaseServerClient which reads session from HTTP request cookies. Client components use createClient which reads from browser storage.

## What I Learned
- How to design and enforce database-level security using RLS policies with WITH CHECK expressions on INSERT operations
- The difference between browser and server Supabase clients and why mixing them causes session and bundling issues
- How JWT tokens travel via HTTP cookies and how the server extracts and verifies them on every request
- Component composition pattern — separating data fetching (server) from interactivity (client) for clean architecture
- Real-world Git workflow — feature branches, commits, merging, and how CI/CD connects to production deployments

## What I Would Do Differently
Plan the database schema security policies upfront rather than adding them after the fact. Starting with complete RLS policies including WITH CHECK expressions on all operations would have prevented a data isolation bug discovered during testing.

## Getting Started

1. Clone the repository
2. Install dependencies: npm install
3. Create a .env.local file with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
4. Run the development server: npm run dev
5. Open http://localhost:3000
