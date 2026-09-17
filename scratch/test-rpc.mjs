import { createClient } from '@supabase/supabase-js';

const url = 'https://wxhfwlgyryaxosoixijk.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGZ3bGd5cnlheG9zb2l4aWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjU3MDAsImV4cCI6MjEwNTI0MTcwMH0.vlCScvw4fM9QZaChVvr6VxRbHD6KoqaDFPFpSWW7FVc';

const supabase = createClient(url, anonKey);

async function test() {
  const { data: gurus, error: gErr } = await supabase.from('guru').select('*').limit(5);
  console.log('guru sample:', { count: gurus?.length, sample: gurus?.[0], gErr });

  const { data: rpcRes, error: rpcErr } = await supabase.rpc('assign_piket_kamar', {
    p_kamar_id: '782d7de4-593a-4850-8ffc-03a789bc78ce',
    p_guru_ids: gurus && gurus[0] ? [gurus[0].id] : [],
    p_submitted_by: 'Test Bot',
    p_client_request_id: '11111111-1111-1111-1111-111111111111'
  });
  console.log('assign_piket_kamar test result:', { rpcRes, rpcErr });
}

test();
