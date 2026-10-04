export function SetupScreen() {
  return (
    <section className="card p-8">
      <p className="text-sm font-medium text-accent">Records</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Connect Supabase</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Add your project keys, then run the database script. The anon key is safe
        to use in the browser. Do not add the service role key.
      </p>
      <ol className="mt-6 space-y-3 text-sm leading-6 text-zinc-700">
        <li>1. Create a project at supabase.com.</li>
        <li>2. Open the SQL editor and run supabase/migrations/001_init.sql.</li>
        <li>3. Copy the project URL and anon key into .env.local.</li>
        <li>4. Restart the dev server.</li>
      </ol>
      <pre className="mt-6 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
        {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
      </pre>
    </section>
  );
}
