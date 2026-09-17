import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function testImport() {
  console.log('Testing import logic with batch insert...');
  
  const sampleRows = [
    { rnk: 1, nama: 'Ustadz Testing Alpha', nama_kamar: 'Kamar Alpha', tahun: '1447-1448', isValid: true },
    { rnk: 2, nama: 'Ustadz Testing Beta', nama_kamar: 'Kamar Alpha', tahun: '1447-1448', isValid: true }
  ];

  // 1. Ensure Kamar Alpha exists
  let { data: kamar } = await supabase.from('kamar').select('*').eq('nama_kamar', 'Kamar Alpha').single();
  if (!kamar) {
    const { data: newK } = await supabase.from('kamar').insert({
      nama_kamar: 'Kamar Alpha',
      limit_piket: 2,
      ada_piket: true,
      aktif: true,
      urutan: 99
    }).select().single();
    kamar = newK;
  }
  console.log('Kamar:', kamar);

  // 2. Insert Gurus
  const { data: insertedGurus, error: gErr } = await supabase.from('guru').insert(
    sampleRows.map(r => ({
      rnk: r.rnk,
      nama: r.nama,
      kamar_id: kamar.id,
      tahun: r.tahun,
      aktif: true
    })).filter(Boolean)
  ).select();

  console.log('Inserted Gurus:', { count: insertedGurus?.length, gErr });

  // 3. Clean up test
  if (insertedGurus) {
    await supabase.from('guru').delete().in('id', insertedGurus.map(g => g.id));
  }
  if (kamar) {
    await supabase.from('kamar').delete().eq('id', kamar.id);
  }
}

testImport();
