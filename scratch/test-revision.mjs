import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2NTcwMCwiZXhwIjoyMTA1MjQxNzAwfQ._NBPdGL3_wYxdZQ-dh9bc3emCTG6gPcgYD4hKvRpyts';

const supabase = createClient(url, serviceKey);

async function testSubmissionWorkflow() {
  console.log('Testing clean submission & revision workflow...');
  
  // 1. Get room Gontor
  const { data: kamar } = await supabase.from('kamar').select('*').eq('nama_kamar', 'Gontor').single();
  console.log('Room:', kamar);

  // 2. Get 2 gurus from Gontor
  const { data: gurus } = await supabase.from('guru').select('*').eq('kamar_id', kamar.id).limit(2);
  console.log('Gurus:', gurus.map(g => g.nama));

  // 3. Submit first time with 1 guru
  const clientReq1 = '22222222-2222-4222-8222-222222222222';
  
  // Cancel previous active
  await supabase.from('piket_submissions').update({ status: 'CANCELLED' }).eq('kamar_id', kamar.id).eq('status', 'SUCCESS');
  
  const { data: sub1, error: sub1Err } = await supabase.from('piket_submissions').insert({
    kamar_id: kamar.id,
    submitted_by: 'Test Petugas',
    status: 'SUCCESS',
    client_request_id: clientReq1
  }).select().single();
  console.log('Sub 1 created:', { sub1, sub1Err });

  await supabase.from('piket_submission_members').insert([
    { submission_id: sub1.id, guru_id: gurus[0].id }
  ]);

  // 4. Now test REVISION / EDIT with 2 gurus (including replacing gurus)
  const clientReq2 = '33333333-3333-4333-8333-333333333333';
  
  // Find active
  const { data: activeSub } = await supabase.from('piket_submissions').select('*').eq('kamar_id', kamar.id).eq('status', 'SUCCESS').single();
  console.log('Active sub before revision:', activeSub?.id);

  if (activeSub) {
    await supabase.from('piket_submissions').update({ status: 'CANCELLED' }).eq('id', activeSub.id);
  }

  const { data: sub2, error: sub2Err } = await supabase.from('piket_submissions').insert({
    kamar_id: kamar.id,
    submitted_by: 'Test Petugas Revision',
    status: 'SUCCESS',
    client_request_id: clientReq2
  }).select().single();
  console.log('Sub 2 (Revision) created:', { sub2, sub2Err });

  await supabase.from('piket_submission_members').insert(
    gurus.map(g => ({ submission_id: sub2.id, guru_id: g.id }))
  );

  // 5. Query active submissions
  const { data: finalActive } = await supabase.from('piket_submissions')
    .select('*, piket_submission_members(*, guru(*))')
    .eq('kamar_id', kamar.id)
    .eq('status', 'SUCCESS');
  
  console.log('Final active count:', finalActive?.length);
  console.log('Final active members:', finalActive?.[0]?.piket_submission_members?.map(m => m.guru?.nama));
}

testSubmissionWorkflow();
