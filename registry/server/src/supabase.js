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

// Returns the raw member rows straight from the table. Privacy filtering happens
// downstream in transform.js — nothing here decides what is public.
export async function fetchMembers() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase credentials are not configured — see server/.env.example');
  }
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
