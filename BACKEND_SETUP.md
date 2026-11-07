# Logic Quest backend setup

The Express server serves the frontend from `dist/` and syncs progress through Supabase.

1. Create a Supabase project and open **Project Settings → API**.
2. Copy the project URL and the `service_role` key into a local `.env` file:

   ```env
   PORT=4000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Run `supabase.sql` in the Supabase SQL Editor.
4. Start the app from the repository root with `npm start`, then open `http://localhost:4000`.

The app keeps a local copy in browser storage and syncs completed tasks, attempts, and age to Supabase. If Supabase is unavailable or not configured, play continues locally and the sync status indicates that the cloud copy is not current.

**Security note:** The current prototype uses a random browser ID, not a signed-in account. The server-side service-role key must stay in `.env` and must never be placed in frontend code or committed. Because the API does not yet authenticate users, do not use this setup for sensitive data or a public production release. Add Supabase Auth and verify the user's access token before exposing personal progress.
