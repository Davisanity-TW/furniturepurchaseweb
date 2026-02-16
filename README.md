# Furniture Purchase Web (MVP)

A simple web app to track furniture/appliance purchase planning for a new home.

## MVP features
- Public read-only list
- Admin login (Supabase Auth) to add/edit items
- Search / filter / sort
- Grouping by room

## Tech
- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + RLS)
- Vercel deployment (staging URL)

## Docs
- Requirements: `docs/requirements.md`

## Local dev
```bash
npm install
npm run dev
```

## Environment variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
