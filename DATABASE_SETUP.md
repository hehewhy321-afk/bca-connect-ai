# BCA Connect AI - Project Setup Guide

This guide explains how to set up the backend for a fresh Supabase project.

## ✅ Prerequisites

1.  **Supabase CLI**: Installed via `npm i -g supabase`.
2.  **Supabase Project**: Create a new empty project at [supabase.com](https://supabase.com).
    *   Note your **Project Reference ID** (e.g., `xtpkzqeylypdsxspmbmg`).
    *   Note your **Database Password**.

## 🚀 Step 1: Connect to Supabase

1.  **Login** to the CLI:
    ```bash
    npx supabase login
    ```

2.  **Link your project**:
    Replace `[project-ref]` with your actual Project ID.
    ```bash
    npx supabase link --project-ref [project-ref]
    ```
    *Enter your database password when prompted.*

## 📦 Step 2: Deploy Database & Storage

We use migrations to set up **everything** automatically:
*   Database Tables (Users, Events, etc.)
*   Certificate System
*   **Storage Buckets** (`certificates`, `avatars`, etc.) & Policies
*   RLS Security Policies

Run this single command:
```bash
npx supabase db push
```

## ⚡ Step 3: Deploy Edge Functions

Deploy the server-side logic (AI chat, reminders, etc.):

```bash
npx supabase functions deploy --project-ref [project-ref]
```

## 🔑 Step 4: Environment Variables

1.  Copy `.env.example` to `.env.local`:
    ```bash
    cp .env.example .env.local
    ```
2.  Open `.env.local` and fill in your details:
    ```env
    VITE_SUPABASE_PROJECT_ID="[project-ref]"
    VITE_SUPABASE_URL="https://[project-ref].supabase.co"
    VITE_SUPABASE_PUBLISHABLE_KEY="[your-anon-key]"
    ```
    *Get your Anon Key from Project Settings > API.*

## 👑 Step 5: Admin Setup (Optional)

To make your user an Admin, go to the **Supabase SQL Editor** and run:

```sql
SELECT promote_to_admin('your-email@example.com');
```

---

## 🛠 Troubleshooting

*   **Conflict Error**: If `db push` fails because the database isn't empty, you can reset it (WARNING: DELETES DATA):
    ```bash
    npx supabase db reset --linked
    ```
*   **Storage Not Created**: Ensure `supabase/migrations/20260113000002_create_buckets.sql` was applied successfully in the `db push` output.

---

## 🐳 Local Development with Docker

Run the whole backend on your machine — no hosted Supabase project needed.
Requires Docker to be running.

1.  **Start the stack** (first run pulls ~4 GB of images):
    ```bash
    npx supabase start
    ```

2.  **Apply all migrations to a clean database:**
    ```bash
    npx supabase db reset
    ```

3.  **Create `.env.local`** — copy `.env.example` and use the local values:
    ```env
    VITE_SUPABASE_PROJECT_ID="mqffqoirvbiynwrzwwse"
    VITE_SUPABASE_URL="http://127.0.0.1:54321"
    VITE_SUPABASE_PUBLISHABLE_KEY="<ANON_KEY from `npx supabase status`>"
    ```

4.  **Run the app:**
    ```bash
    bun install && bun run dev      # http://localhost:8080
    ```

### Local endpoints

| Service       | URL                        |
| ------------- | -------------------------- |
| API / Kong    | http://127.0.0.1:54321     |
| Studio        | http://127.0.0.1:54323     |
| Mailpit inbox | http://127.0.0.1:54324     |
| Postgres      | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Email confirmation is off locally (`[auth.email] enable_confirmations = false`),
so signups log in immediately. Any mail the app sends is caught by Mailpit
rather than being delivered.

### Edge functions

```bash
npx supabase functions serve            # serves all functions locally
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically. Put third-party secrets (e.g. `RESEND_API_KEY`) in
`supabase/functions/.env` — that file is gitignored.

### Useful commands

```bash
npx supabase stop                       # stop containers (keeps data)
npx supabase stop --no-backup           # stop and wipe local data
npx supabase db reset                   # rebuild schema from migrations
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```
