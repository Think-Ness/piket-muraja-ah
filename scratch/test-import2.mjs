import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function test() {
  const { data: newK, error: kErr } = await supabase.from('kamar').insert({
    nama_kamar: 'Kamar Alpha',
    limit_piket: 2,
    aktif: true,
    urutan: 99
  }).select().single();
  console.log('Insert kamar result:', { newK, kErr });

  if (newK) {
    const { data: insertedGurus, error: gErr } = await supabase.from('guru').insert([
      { rnk: 1, nama: 'Ustadz Testing Alpha', kamar_id: newK.id, tahun: '1447-1448', aktif: true },
      { rnk: 2, nama: 'Ustadz Testing Beta', kamar_id: newK.id, tahun: '1447-1448', aktif: true }
    ]).select();
    console.log('Insert gurus result:', { insertedGurus, gErr });

    // Clean up
    await supabase.from('guru').delete().eq('kamar_id', newK.id);
    await supabase.from('kamar').delete().eq('id', newK.id);
  }
}

test();
