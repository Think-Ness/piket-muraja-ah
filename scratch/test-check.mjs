import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjU3MDAsImV4cCI6MjEwNTI0MTcwMH0.vlCScvw4fM9QZaChVvr6VxRbHD6KoqaDFPFpSWW7FVc';

const supabase = createClient(url, anonKey);

async function check() {
  const { data: subs } = await supabase
    .from('piket_submissions')
    .select('*, kamar(*), piket_submission_members(*, guru(*))')
    .order('submitted_at', { ascending: false });
  console.log('Total submissions in Supabase DB:', subs?.length);
  console.log('Latest submission:', JSON.stringify(subs?.[0], null, 2));
}

check();
