import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

let client;

// Server-side client. Uses the service-role key so it can read the full members
// table (real emails/phone numbers) regardless of row-level security — this
// server is the privacy boundary, exactly as the Google service account was for
// the old Sheets backend. The key must never reach the frontend bundle.
function getClient() {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function assertConfigured() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase credentials are not configured — see server/.env.example');
  }
}

// True if some row's `email` matches (case-insensitively) the address given.
// This is the entire membership check for sign-in: being a row in the table is
// what grants access. `ilike` treats `%` and `_` as wildcards, so they're
// escaped — a member-supplied address is a literal, not a pattern.
export async function memberExistsByEmail(email) {
  assertConfigured();
  const literal = String(email).replace(/([\\%_])/g, '\\$1');
  const { data, error } = await getClient()
    .from(config.membersTable)
    .select('id')
    .ilike('email', literal)
    .limit(1);
  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return (data || []).length > 0;
}

// Returns the raw member rows straight from the table. Privacy filtering happens
// downstream in transform.js — nothing here decides what is public.
export async function fetchMembers() {
  assertConfigured();
  const supabase = getClient();
  const { data, error } = await supabase
    .from(config.membersTable)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return data || [];
}
