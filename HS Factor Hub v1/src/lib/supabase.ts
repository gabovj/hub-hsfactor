import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eqepylyezrdlaqjgqrff.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZXB5bHllenJkbGFxamdxcmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjgyNjIsImV4cCI6MjA5NDcwNDI2Mn0.gDSiN3_xemE8VbYvxew8U0zIZ2-UPYKFheztyCGCWO4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AppRole = "superadmin" | "vendedor" | "coordinador";