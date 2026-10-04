# Records

A private library for income-tax documents. Upload a file, add a few details, and find it later.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/001_init.sql` once.
3. In Authentication → Providers, keep Email enabled. For a personal account you can turn off “Confirm email” so sign-in works immediately.
4. Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use the anon key only. Do not add the service role key.

5. Start the app:

```
npm install
npm run dev
```

## Deploy

Deploy the Next.js app to Vercel and set the same two environment variables. In Supabase → Authentication → URL configuration, set the site URL to your Vercel domain.

Files stay in a private Storage bucket. Opening one creates a short-lived signed link for the signed-in user.
