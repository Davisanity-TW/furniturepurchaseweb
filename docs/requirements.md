# Furniture Purchase Web — Requirements (MVP)

## Goal
When moving into a new home, David wants a place to collect a purchase list for furniture/appliances, maintain multiple candidates per item (MVP via status), and track purchase state.

## Roles / Auth
- Single role: **admin** (David only)
- Auth via Supabase Auth (email)
- Admin Supabase `user_id`: `2ef2b25b-e4b1-46dd-abee-a5513043ad42`

## Public vs Private
- Public frontend: **anyone can view** the list (read-only)
- Admin (logged in): can **create/update/delete** and mark purchased

## Data model (Supabase / Postgres)
Single table `items` (MVP):
- `id` uuid
- `name` (item name)
- `category` (fridge/washer/AC/robot vacuum...)
- `room` (living room / kitchen / computer room / small room / master bedroom / bathroom)
- `brand` (optional)
- `model` (optional)
- `price` (number)
- `currency` (optional, default TWD)
- `url` (purchase link)
- `note` (description / comparison notes)
- `status` (want / candidate / purchased / eliminated)
- `purchased_at` (optional)
- `created_at`, `updated_at`

## UI features
- Search (name/brand/model)
- Filter (category, status, room, optional price range)
- Sort (price, updated_at)

## Telegram automation (future)
- If David sends a purchase URL to Telegram, the bot can auto-create/update an item.

## Deployment
- Supabase (free): DB + Auth + RLS
  - SELECT: public
  - INSERT/UPDATE/DELETE: admin only
- Vercel (free): Next.js deployment with long staging URL
