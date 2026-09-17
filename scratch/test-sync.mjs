import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function testSync() {
  console.log('Testing Supabase query capabilities...');
  const { data: kCount } = await supabase.from('kamar').select('id', { count: 'exact' });
  const { data: gCount } = await supabase.from('guru').select('id', { count: 'exact' });
  console.log('Current DB state: kamar =', kCount?.length, ', guru =', gCount?.length);
}

testSync();
