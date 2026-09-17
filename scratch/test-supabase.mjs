import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function test() {
  console.log('Testing Supabase connection...');
  const { data: settings, error: sErr } = await supabase.from('event_settings').select('*');
  console.log('event_settings:', { settings, sErr });

  const { data: kamar, error: kErr } = await supabase.from('kamar').select('*').limit(5);
  console.log('kamar:', { kamar, kErr });

  const { data: subs, error: subErr } = await supabase.from('piket_submissions').select('*').limit(5);
  console.log('piket_submissions:', { subs, subErr });
}

test();
