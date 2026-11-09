// ── SUPABASE CONFIG ─────────────────────────────────────────────────────────
// 1. Go to your Supabase project → Settings → API
// 2. Copy "Project URL" into SUPABASE_URL
// 3. Copy "anon public" key into SUPABASE_ANON_KEY
// (These are safe to expose in frontend code — that's what the anon key is for.
//  Real protection comes from the Row Level Security policies in schema.sql)

const SUPABASE_URL = "https://ddcvstvgpswvzhvpcofm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3ZzdHZncHN3dnpodnBjb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjM2NDMsImV4cCI6MjEwMTY5OTY0M30._kx24P-USB128SisMS3Bdf3_7_Z9h6DKAqXrANk0AgE";

// Global Supabase client used throughout script.js.
// If you forget to fill in the values above, `sb` stays null and the site
// silently falls back to localStorage-only mode (same as before) instead of crashing.
let sb = null;
try {
  if (!window.supabase) {
    console.warn("Supabase library did not load (offline or blocked). Running on localStorage only.");
  } else if (SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR-PROJECT-ID")) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn("Supabase not configured — edit supabase-config.js. Running on localStorage only.");
  }
} catch (e) {
  console.warn("Supabase client failed to initialize:", e);
}
