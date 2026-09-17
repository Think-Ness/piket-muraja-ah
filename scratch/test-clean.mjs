import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function testCleanImport() {
  console.log('Testing clean room insert without ada_piket column...');
  
  const testRoomName = 'Kamar Clean Test ' + Date.now();
  const { data: newK, error: kErr } = await supabase.from('kamar').insert({
    nama_kamar: testRoomName,
    limit_piket: 2,
    aktif: true,
    urutan: 999
  }).select().single();

  console.log('Clean kamar insert result:', { newK, kErr });

  if (newK) {
    await supabase.from('kamar').delete().eq('id', newK.id);
    console.log('Clean up done.');
  }
}

testCleanImport();
