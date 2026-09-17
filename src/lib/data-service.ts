import {
  EventSettings,
  Kamar,
  Guru,
  PiketSubmission,
  AuditLog,
  ImportBatch,
  KamarOverview,
  SubmitPiketPayload,
  SubmitPiketResult,
  ValidatedImportRow,
} from '@/types';
import { createClient } from './supabase/client';

// Initial In-Memory Seed Data (Fallback if Supabase is not reachable)
let memorySettings: EventSettings = {
  id: '30f65553-f4c7-4281-b2d0-94a5c4a6c7d8',
  event_name: "Ujian Muraja'ah Akhir Tahun",
  event_subtitle: 'Penentuan Piket Kamar Guru',
  committee_name: "Panitia Ujian Muraja'ah Akhir Tahun",
  academic_year: '1447–1448 H',
  form_status: 'OPEN',
  waktu_buka: null,
  whatsapp_number: '6281234567890',
  whatsapp_label: 'Bantuan Panitia',
  updated_at: new Date().toISOString(),
  updated_by: 'System',
};

let memoryKamar: Kamar[] = [
  { id: '782d7de4-593a-4850-8ffc-03a789bc78ce', nama_kamar: 'Gontor', limit_piket: 2, ada_piket: true, aktif: true, urutan: 1, created_at: new Date().toISOString() },
  { id: '629e60d6-866f-45cb-b8d7-d49b2f83efb3', nama_kamar: 'Gandy', limit_piket: 1, ada_piket: true, aktif: true, urutan: 2, created_at: new Date().toISOString() },
  { id: '5edcc4d0-801c-433a-8c89-b9c8fe677ade', nama_kamar: 'Perdos Saudi', limit_piket: 2, ada_piket: true, aktif: true, urutan: 3, created_at: new Date().toISOString() },
  { id: '4faac5fd-761b-4865-9148-e518e06445ad', nama_kamar: 'Perdos UNIDA Siman', limit_piket: 3, ada_piket: true, aktif: true, urutan: 4, created_at: new Date().toISOString() },
  { id: '99ed1fe5-e378-4d22-a9b4-632712e60eb1', nama_kamar: 'Wisma Darussalam', limit_piket: 2, ada_piket: true, aktif: true, urutan: 5, created_at: new Date().toISOString() },
  { id: '3448b111-9fa7-4fec-88c9-598d9753907e', nama_kamar: 'Santorini', limit_piket: 2, ada_piket: true, aktif: true, urutan: 6, created_at: new Date().toISOString() },
  { id: '097980ff-27c9-4670-8b01-512c10b7a86f', nama_kamar: 'Kukusan', limit_piket: 2, ada_piket: true, aktif: true, urutan: 7, created_at: new Date().toISOString() },
];

let memoryGuru: Guru[] = [
  { id: 'd753c14a-bb11-406a-a808-9b1e3ee17fad', rnk: 1, nama: 'K.H. Hasan Abdullah Sahal', kamar_id: '782d7de4-593a-4850-8ffc-03a789bc78ce', tahun: '1447-1448', aktif: true, created_at: new Date().toISOString() },
  { id: 'f27e5720-d4eb-48f1-8cb4-e3adab6f195d', rnk: 2, nama: 'Prof. Dr. K.H. Amal Fathullah Zarkasyi, M.A.', kamar_id: '782d7de4-593a-4850-8ffc-03a789bc78ce', tahun: '1447-1448', aktif: true, created_at: new Date().toISOString() },
  { id: '7921a8d0-ae05-4c07-b25a-4b07f8fe301c', rnk: 3, nama: 'K.H. Akrim Mariyat, Dipl.A.Ed.', kamar_id: '782d7de4-593a-4850-8ffc-03a789bc78ce', tahun: '1447-1448', aktif: true, created_at: new Date().toISOString() },
  { id: '7aa6086a-7bb1-4ba2-8ef9-0414902eb142', rnk: 1, nama: 'Ustadz Ahmad Fathoni, M.Pd.', kamar_id: '629e60d6-866f-45cb-b8d7-d49b2f83efb3', tahun: '1447-1448', aktif: true, created_at: new Date().toISOString() },
  { id: '2863e41c-32b0-4ecb-99f5-7e50882e564c', rnk: 2, nama: 'Ustadz Budi Santoso, Lc.', kamar_id: '629e60d6-866f-45cb-b8d7-d49b2f83efb3', tahun: '1447-1448', aktif: true, created_at: new Date().toISOString() },
];

let memorySubmissions: PiketSubmission[] = [];
let memoryAuditLogs: AuditLog[] = [];
let memoryImportBatches: ImportBatch[] = [];

// Helper to filter junk categories (alumni, sampah, ampash, etc.)
export function isJunkCategory(name: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n.includes('sampah') ||
    n.includes('ampash') ||
    n.includes('alumni') ||
    n.includes('tamu') ||
    n.includes('kosong')
  );
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co') && !url.includes('sample-project') && !url.includes('your-project'));
}

export const DataService = {
  // 1. Settings
  async getSettings(): Promise<EventSettings> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('event_settings').select('*').limit(1).single();
        if (!error && data) {
          const now = new Date();
          let effectiveStatus = data.form_status;
          if (data.waktu_buka && new Date(data.waktu_buka) > now) {
            effectiveStatus = 'CLOSED';
          }
          if (data.waktu_tutup && new Date(data.waktu_tutup) < now) {
            effectiveStatus = 'CLOSED';
          }
          return {
            ...memorySettings,
            ...data,
            form_status: effectiveStatus,
          };
        }
      } catch (err) {
        console.warn('Supabase getSettings fallback to local:', err);
      }
    }

    const now = new Date();
    let effectiveStatus = memorySettings.form_status;
    if (memorySettings.waktu_buka && new Date(memorySettings.waktu_buka) > now) {
      effectiveStatus = 'CLOSED';
    }
    if (memorySettings.waktu_tutup && new Date(memorySettings.waktu_tutup) < now) {
      effectiveStatus = 'CLOSED';
    }

    return { ...memorySettings, form_status: effectiveStatus };
  },

  async updateSettings(settings: Partial<EventSettings>, actor = 'Admin'): Promise<EventSettings> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const current = await this.getSettings();
        const { data, error } = await supabase
          .from('event_settings')
          .update({ ...settings, updated_at: new Date().toISOString(), updated_by: actor })
          .eq('id', current.id)
          .select()
          .single();
        if (!error && data) {
          return { ...memorySettings, ...data };
        }
      } catch (err) {
        console.warn('Supabase updateSettings fallback to local:', err);
      }
    }

    const oldData = { ...memorySettings };
    memorySettings = {
      ...memorySettings,
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: actor,
    };

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'UPDATE_SETTINGS',
      entity_type: 'event_settings',
      entity_id: memorySettings.id,
      old_data: oldData,
      new_data: memorySettings,
      created_at: new Date().toISOString(),
    });

    return { ...memorySettings };
  },

  // 2. Kamar & Overview
  async getKamarOverviewList(options?: { onlyPiket?: boolean }): Promise<KamarOverview[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const [settingsRes, kamarRes, guruRes, subRes] = await Promise.all([
          supabase.from('event_settings').select('*').limit(1).single(),
          supabase.from('kamar').select('*').order('urutan'),
          supabase.from('guru').select('*').eq('aktif', true),
          supabase.from('piket_submissions').select('*, piket_submission_members(*, guru(*))').order('submitted_at', { ascending: true }),
        ]);

        if (!kamarRes.error && kamarRes.data && kamarRes.data.length > 0) {
          const settings = settingsRes.data || memorySettings;
          let rooms = kamarRes.data;
          if (options?.onlyPiket) {
            rooms = rooms.filter((k) => (k.ada_piket ?? true) && k.aktif && !isJunkCategory(k.nama_kamar));
          }
          const allGurus = guruRes.data || [];
          const allSubs = subRes.data || [];

          return rooms.map((k) => {
            const kamarGurus = allGurus.filter((g) => g.kamar_id === k.id && !isJunkCategory(g.nama));
            const kamarSubs = allSubs.filter((s) => s.kamar_id === k.id);
            const activeSub = kamarSubs.find((s) => s.status === 'SUCCESS');
            const activeMembers = activeSub?.piket_submission_members || [];
            const totalPiket = activeMembers.length;

            const firstSub = kamarSubs[0];
            const latestSub = kamarSubs[kamarSubs.length - 1];

            const initialGuruNames = firstSub ? (firstSub.piket_submission_members || []).map((m: any) => m.guru?.nama || 'Guru') : [];
            const latestGuruNames = latestSub ? (latestSub.piket_submission_members || []).map((m: any) => m.guru?.nama || 'Guru') : [];

            const limitPiket = k.limit_piket ?? 1;
            const adaPiket = k.ada_piket ?? true;

            let status_penetapan: KamarOverview['status_penetapan'] = 'Belum ditetapkan';
            if (!k.aktif) {
              status_penetapan = 'Nonaktif';
            } else if (!adaPiket) {
              status_penetapan = 'Non-Piket';
            } else if (settings.form_status === 'CLOSED') {
              status_penetapan = totalPiket >= limitPiket && limitPiket > 0 ? 'Terpenuhi' : (totalPiket > 0 ? 'Sebagian' : 'Form ditutup');
            } else if (totalPiket >= limitPiket && limitPiket > 0) {
              status_penetapan = 'Terpenuhi';
            } else if (totalPiket > 0) {
              status_penetapan = 'Sebagian';
            } else {
              status_penetapan = 'Belum ditetapkan';
            }

            return {
              id: k.id,
              nama_kamar: k.nama_kamar,
              limit_piket: limitPiket,
              ada_piket: adaPiket,
              aktif: k.aktif,
              urutan: k.urutan || 0,
              updated_at: k.updated_at || k.created_at,
              total_guru: kamarGurus.length,
              total_piket_terpilih: totalPiket,
              status_penetapan,
              has_revisions: kamarSubs.length > 1,
              revision_count: Math.max(0, kamarSubs.length - 1),
              initial_submitted_at: firstSub?.submitted_at || null,
              initial_guru_names: initialGuruNames,
              latest_submitted_at: latestSub?.submitted_at || null,
              latest_guru_names: latestGuruNames,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getKamarOverviewList error, falling back:', err);
      }
    }

    const settings = await this.getSettings();
    let rooms = memoryKamar;
    if (options?.onlyPiket) {
      rooms = rooms.filter((k) => k.ada_piket && k.aktif && !isJunkCategory(k.nama_kamar));
    }

    return rooms.map((k) => {
      const kamarGurus = memoryGuru.filter((g) => g.kamar_id === k.id && g.aktif && !isJunkCategory(g.nama));
      const totalGuru = kamarGurus.length;
      
      const allKamarSubmissions = memorySubmissions
        .filter((s) => s.kamar_id === k.id)
        .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

      const activeSubmission = memorySubmissions.find((s) => s.kamar_id === k.id && s.status === 'SUCCESS');
      const activeMembers = activeSubmission?.members || [];
      const totalPiket = activeMembers.length;

      const hasRevisions = allKamarSubmissions.length > 1;
      const revisionCount = Math.max(0, allKamarSubmissions.length - 1);

      const firstSub = allKamarSubmissions[0];
      const latestSub = allKamarSubmissions[allKamarSubmissions.length - 1];

      const initialGuruNames = firstSub ? (firstSub.members || []).map((m) => m.guru?.nama || 'Guru') : [];
      const latestGuruNames = latestSub ? (latestSub.members || []).map((m) => m.guru?.nama || 'Guru') : [];

      let status_penetapan: KamarOverview['status_penetapan'] = 'Belum ditetapkan';
      if (!k.aktif) {
        status_penetapan = 'Nonaktif';
      } else if (!k.ada_piket) {
        status_penetapan = 'Non-Piket';
      } else if (settings.form_status === 'CLOSED') {
        status_penetapan = totalPiket >= k.limit_piket && k.limit_piket > 0 ? 'Terpenuhi' : (totalPiket > 0 ? 'Sebagian' : 'Form ditutup');
      } else if (totalPiket >= k.limit_piket && k.limit_piket > 0) {
        status_penetapan = 'Terpenuhi';
      } else if (totalPiket > 0) {
        status_penetapan = 'Sebagian';
      } else {
        status_penetapan = 'Belum ditetapkan';
      }

      return {
        id: k.id,
        nama_kamar: k.nama_kamar,
        limit_piket: k.limit_piket,
        ada_piket: k.ada_piket,
        aktif: k.aktif,
        urutan: k.urutan,
        updated_at: k.updated_at || k.created_at,
        total_guru: totalGuru,
        total_piket_terpilih: totalPiket,
        status_penetapan,
        has_revisions: hasRevisions,
        revision_count: revisionCount,
        initial_submitted_at: firstSub?.submitted_at || null,
        initial_guru_names: initialGuruNames,
        latest_submitted_at: latestSub?.submitted_at || null,
        latest_guru_names: latestGuruNames,
      };
    });
  },

  async getPiketActiveRooms(): Promise<Kamar[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('kamar')
          .select('*')
          .eq('aktif', true)
          .order('urutan');
        if (!error && data && data.length > 0) {
          return data
            .filter((k) => (k.ada_piket ?? true) && !isJunkCategory(k.nama_kamar))
            .map((k) => ({
              ...k,
              ada_piket: k.ada_piket ?? true,
            }));
        }
      } catch (err) {
        console.warn('Supabase getPiketActiveRooms fallback:', err);
      }
    }
    return memoryKamar.filter((k) => k.ada_piket && k.aktif && !isJunkCategory(k.nama_kamar));
  },

  async getKamarDetail(id: string): Promise<{ 
    kamar: Kamar; 
    gurus: Guru[]; 
    activePiketCount: number;
    currentSelectedGuruIds: string[];
    isPreviousSubmission: boolean;
  } | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: kamar, error: kErr } = await supabase.from('kamar').select('*').eq('id', id).single();
        if (!kErr && kamar) {
          const { data: gurusRaw } = await supabase.from('guru').select('*').eq('kamar_id', id).eq('aktif', true).order('rnk');
          const { data: activeSubs } = await supabase.from('piket_submissions')
            .select('*, piket_submission_members(*)')
            .eq('kamar_id', id)
            .eq('status', 'SUCCESS')
            .order('submitted_at', { ascending: false });

          const activeSub = activeSubs?.[0];
          const currentSelectedGuruIds = (activeSub?.piket_submission_members || []).map((m: any) => m.guru_id);

          const { data: otherSubs } = await supabase.from('piket_submissions')
            .select('piket_submission_members(guru_id)')
            .neq('kamar_id', id)
            .eq('status', 'SUCCESS');
          
          const otherAssignedIds = new Set(
            (otherSubs || []).flatMap((s: any) => (s.piket_submission_members || []).map((m: any) => m.guru_id))
          );

          const fullKamar: Kamar = {
            ...kamar,
            ada_piket: kamar.ada_piket ?? true,
          };

          const gurus: Guru[] = (gurusRaw || [])
            .filter((g) => !isJunkCategory(g.nama))
            .map((g) => ({
              ...g,
              kamar: fullKamar,
              is_piket_active: otherAssignedIds.has(g.id),
            }));

          return {
            kamar: fullKamar,
            gurus,
            activePiketCount: currentSelectedGuruIds.length,
            currentSelectedGuruIds,
            isPreviousSubmission: Boolean(activeSub),
          };
        }
      } catch (err) {
        console.warn('Supabase getKamarDetail fallback:', err);
      }
    }

    const kamar = memoryKamar.find((k) => k.id === id);
    if (!kamar) return null;

    const activeSubmission = memorySubmissions.find((s) => s.kamar_id === id && s.status === 'SUCCESS');
    const currentSelectedGuruIds = (activeSubmission?.members || []).map((m) => m.guru_id);

    const otherRoomsActiveSubmissions = memorySubmissions.filter((s) => s.kamar_id !== id && s.status === 'SUCCESS');
    const otherRoomsAssignedGuruIds = new Set(
      otherRoomsActiveSubmissions.flatMap((s) => (s.members || []).map((m) => m.guru_id))
    );

    const gurus = memoryGuru
      .filter((g) => g.kamar_id === id && g.aktif && !isJunkCategory(g.nama))
      .map((g) => ({
        ...g,
        kamar,
        is_piket_active: otherRoomsAssignedGuruIds.has(g.id),
      }))
      .sort((a, b) => (a.rnk || 999) - (b.rnk || 999));

    return { 
      kamar, 
      gurus, 
      activePiketCount: currentSelectedGuruIds.length,
      currentSelectedGuruIds,
      isPreviousSubmission: Boolean(activeSubmission)
    };
  },

  async updateKamarLimit(kamarId: string, newLimit: number, actor = 'Admin'): Promise<Kamar> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('kamar')
          .update({ limit_piket: Math.max(0, newLimit), updated_at: new Date().toISOString() })
          .eq('id', kamarId)
          .select()
          .single();
        if (!error && data) {
          return { ...data, ada_piket: data.ada_piket ?? true };
        }
      } catch (err) {
        console.warn('Supabase updateKamarLimit fallback:', err);
      }
    }

    const kamar = memoryKamar.find((k) => k.id === kamarId);
    if (!kamar) throw new Error('Kamar tidak ditemukan.');

    const oldLimit = kamar.limit_piket;
    kamar.limit_piket = Math.max(0, newLimit);
    kamar.updated_at = new Date().toISOString();

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'UPDATE_KAMAR_LIMIT',
      entity_type: 'kamar',
      entity_id: kamarId,
      old_data: { limit_piket: oldLimit, nama_kamar: kamar.nama_kamar },
      new_data: { limit_piket: kamar.limit_piket, nama_kamar: kamar.nama_kamar },
      created_at: new Date().toISOString(),
    });

    return { ...kamar };
  },

  async toggleKamarAdaPiket(kamarId: string, adaPiket: boolean, actor = 'Admin'): Promise<Kamar> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('kamar')
          .update({ ada_piket: adaPiket, updated_at: new Date().toISOString() })
          .eq('id', kamarId)
          .select()
          .single();
        if (!error && data) {
          return { ...data, ada_piket: data.ada_piket ?? true };
        }
      } catch (err) {
        console.warn('Supabase toggleKamarAdaPiket fallback:', err);
      }
    }

    const kamar = memoryKamar.find((k) => k.id === kamarId);
    if (!kamar) throw new Error('Kamar tidak ditemukan.');

    const oldVal = kamar.ada_piket;
    kamar.ada_piket = adaPiket;
    kamar.updated_at = new Date().toISOString();

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'TOGGLE_KAMAR_PIKET',
      entity_type: 'kamar',
      entity_id: kamarId,
      old_data: { ada_piket: oldVal, nama_kamar: kamar.nama_kamar },
      new_data: { ada_piket: kamar.ada_piket, nama_kamar: kamar.nama_kamar },
      created_at: new Date().toISOString(),
    });

    return { ...kamar };
  },

  async resetKamarPiket(kamarId: string, actor = 'Admin'): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('piket_submissions')
          .update({ status: 'CANCELLED' })
          .eq('kamar_id', kamarId)
          .eq('status', 'SUCCESS');
        
        return {
          success: true,
          message: `Penetapan piket kamar berhasil dibatalkan di database.`,
        };
      } catch (err) {
        console.warn('Supabase resetKamarPiket fallback:', err);
      }
    }

    const kamar = memoryKamar.find((k) => k.id === kamarId);
    if (!kamar) throw new Error('Kamar tidak ditemukan.');

    let cancelledCount = 0;
    memorySubmissions.forEach((sub) => {
      if (sub.kamar_id === kamarId && sub.status === 'SUCCESS') {
        sub.status = 'CANCELLED';
        cancelledCount++;
      }
    });

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'RESET_PIKET',
      entity_type: 'kamar',
      entity_id: kamarId,
      old_data: { status: 'SUCCESS' },
      new_data: { status: 'CANCELLED', cancelled_count: cancelledCount },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Seluruh penetapan piket kamar ${kamar.nama_kamar} berhasil dibatalkan.`,
    };
  },

  // 3. Submit Piket (Atomic Submission, Revision Tracking & Idempotency)
  async submitPiket(payload: SubmitPiketPayload): Promise<SubmitPiketResult> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_piket', {
          p_kamar_id: payload.kamar_id,
          p_guru_ids: payload.guru_ids,
          p_submitted_by: payload.submitted_by || 'Petugas Kamar',
          p_client_request_id: payload.client_request_id,
        });

        if (rpcErr) {
          console.error('Supabase submit_piket RPC error:', rpcErr);
          throw new Error(rpcErr.message || 'Gagal menyimpan ke database Supabase.');
        }

        if (rpcRes) {
          return {
            success: Boolean(rpcRes.success),
            idempotent: Boolean(rpcRes.idempotent),
            submission_id: rpcRes.submission_id,
            is_revision: Boolean(rpcRes.is_revision),
            message: rpcRes.message || 'Penetapan piket berhasil disimpan.',
          };
        }
      } catch (err: any) {
        // If error was thrown explicitly from RPC constraint, rethrow so UI displays user friendly reason
        if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
          throw err;
        }
        console.warn('Supabase submitPiket RPC unavailable, falling back to local:', err);
      }
    }

    const existing = memorySubmissions.find(
      (s) => s.client_request_id === payload.client_request_id && s.status === 'SUCCESS'
    );
    if (existing) {
      return {
        success: true,
        idempotent: true,
        submission_id: existing.id,
        message: 'Penetapan telah tersimpan sebelumnya.',
      };
    }

    const settings = await this.getSettings();
    if (settings.form_status === 'CLOSED') {
      throw new Error('FORM_CLOSED: Form penentuan piket saat ini telah ditutup oleh panitia.');
    }
    if (settings.form_status === 'MAINTENANCE') {
      throw new Error('FORM_MAINTENANCE: Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.');
    }

    if (!payload.guru_ids || payload.guru_ids.length === 0) {
      throw new Error('NO_GURU_SELECTED: Anda belum memilih guru untuk penetapan piket.');
    }

    const kamar = memoryKamar.find((k) => k.id === payload.kamar_id);
    if (!kamar) throw new Error('KAMAR_NOT_FOUND: Kamar tidak ditemukan.');
    if (!kamar.aktif) throw new Error('KAMAR_INACTIVE: Kamar ini berstatus nonaktif.');
    if (!kamar.ada_piket) throw new Error('KAMAR_NO_PIKET: Kamar ini tidak memerlukan tugas piket.');

    for (const gid of payload.guru_ids) {
      const g = memoryGuru.find((guru) => guru.id === gid && guru.kamar_id === payload.kamar_id && guru.aktif);
      if (!g) {
        throw new Error(`INVALID_GURU_SELECTION: Satu atau lebih guru tidak terdaftar di kamar ${kamar.nama_kamar}.`);
      }
    }

    if (payload.guru_ids.length > kamar.limit_piket) {
      throw new Error(
        `LIMIT_EXCEEDED: Jumlah guru yang dipilih (${payload.guru_ids.length}) melebihi batas limit ${kamar.limit_piket} orang untuk kamar ${kamar.nama_kamar}.`
      );
    }

    const otherRoomsAssigned = new Set(
      memorySubmissions
        .filter((s) => s.kamar_id !== payload.kamar_id && s.status === 'SUCCESS')
        .flatMap((s) => (s.members || []).map((m) => m.guru_id))
    );
    for (const gid of payload.guru_ids) {
      if (otherRoomsAssigned.has(gid)) {
        const g = memoryGuru.find((guru) => guru.id === gid);
        throw new Error(`GURU_ALREADY_ASSIGNED: Guru ${g?.nama || ''} sudah ditetapkan sebagai piket aktif di kamar lain.`);
      }
    }

    const existingActiveSub = memorySubmissions.find((s) => s.kamar_id === payload.kamar_id && s.status === 'SUCCESS');
    const isRevision = Boolean(existingActiveSub);
    let previousGuruNames: string[] = [];

    if (existingActiveSub) {
      previousGuruNames = (existingActiveSub.members || []).map((m) => m.guru?.nama || 'Guru');
      existingActiveSub.status = 'CANCELLED';
    }

    const previousSubmissionsCount = memorySubmissions.filter((s) => s.kamar_id === payload.kamar_id).length;
    const versionNumber = previousSubmissionsCount + 1;

    const submissionId = `sub_${Date.now()}`;
    const newSubmission: PiketSubmission = {
      id: submissionId,
      kamar_id: payload.kamar_id,
      submitted_by: payload.submitted_by || 'Petugas Kamar',
      submitted_at: new Date().toISOString(),
      status: 'SUCCESS',
      client_request_id: payload.client_request_id,
      notes: payload.notes || null,
      version: versionNumber,
      is_revision: isRevision,
      replaced_submission_id: existingActiveSub?.id || null,
      kamar,
      members: payload.guru_ids.map((gid) => {
        const g = memoryGuru.find((guru) => guru.id === gid);
        return {
          id: `mem_${Math.random().toString(36).substring(2, 9)}`,
          submission_id: submissionId,
          guru_id: gid,
          created_at: new Date().toISOString(),
          guru: g,
        };
      }),
    };

    memorySubmissions.unshift(newSubmission);

    const newGuruNames = payload.guru_ids.map((gid) => memoryGuru.find((g) => g.id === gid)?.nama || 'Guru');

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: payload.submitted_by || 'Petugas Kamar',
      action: isRevision ? 'REVISE_PIKET' : 'SUBMIT_PIKET',
      entity_type: 'kamar',
      entity_id: payload.kamar_id,
      old_data: isRevision ? { submission_id: existingActiveSub?.id, guru_names: previousGuruNames } : null,
      new_data: {
        submission_id: submissionId,
        kamar_nama: kamar.nama_kamar,
        version: versionNumber,
        guru_names: newGuruNames,
        is_revision: isRevision,
      },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      idempotent: false,
      submission_id: submissionId,
      is_revision: isRevision,
      message: isRevision
        ? `Revisi penetapan untuk kamar ${kamar.nama_kamar} berhasil diperbarui.`
        : `Penetapan ${payload.guru_ids.length} guru untuk kamar ${kamar.nama_kamar} berhasil disimpan.`,
    };
  },

  // 4. Guru Management
  async getGuruList(params?: { search?: string; kamarId?: string; page?: number; limit?: number }): Promise<{
    gurus: Guru[];
    total: number;
  }> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from('guru').select('*, kamar(*)', { count: 'exact' }).eq('aktif', true);

        if (params?.kamarId && params.kamarId !== 'ALL') {
          query = query.eq('kamar_id', params.kamarId);
        }

        if (params?.search) {
          query = query.ilike('nama', `%${params.search}%`);
        }

        const page = params?.page || 1;
        const limit = params?.limit || 50;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query.order('rnk', { ascending: true }).range(from, to);
        if (!error && data) {
          const cleaned = data.filter((g) => !isJunkCategory(g.nama)).map((g) => ({
            ...g,
            kamar: g.kamar ? { ...g.kamar, ada_piket: g.kamar.ada_piket ?? true } : undefined,
          }));
          return { gurus: cleaned, total: count || cleaned.length };
        }
      } catch (err) {
        console.warn('Supabase getGuruList fallback:', err);
      }
    }

    let list = [...memoryGuru].filter((g) => !isJunkCategory(g.nama));

    if (params?.kamarId && params.kamarId !== 'ALL') {
      list = list.filter((g) => g.kamar_id === params.kamarId);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((g) => g.nama.toLowerCase().includes(q));
    }

    const total = list.length;
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit).map((g) => ({
      ...g,
      kamar: memoryKamar.find((k) => k.id === g.kamar_id),
    }));

    return { gurus: paginated, total };
  },

  // 5. Histori Piket & Submissions
  async getPiketSubmissions(): Promise<PiketSubmission[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('piket_submissions')
          .select('*, kamar(*), piket_submission_members(*, guru(*))')
          .order('submitted_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          return data.map((s) => ({
            id: s.id,
            kamar_id: s.kamar_id,
            submitted_by: s.submitted_by,
            submitted_at: s.submitted_at,
            status: s.status,
            client_request_id: s.client_request_id,
            notes: s.notes,
            version: 1,
            is_revision: false,
            replaced_submission_id: null,
            kamar: s.kamar ? { ...s.kamar, ada_piket: s.kamar.ada_piket ?? true } : undefined,
            members: (s.piket_submission_members || []).map((m: any) => ({
              id: m.id,
              submission_id: s.id,
              guru_id: m.guru_id,
              created_at: m.created_at,
              guru: m.guru,
            })),
          }));
        }
      } catch (err) {
        console.warn('Supabase getPiketSubmissions fallback:', err);
      }
    }

    return memorySubmissions.map((s) => ({
      ...s,
      kamar: memoryKamar.find((k) => k.id === s.kamar_id),
      members: (s.members || []).map((m) => ({
        ...m,
        guru: memoryGuru.find((g) => g.id === m.guru_id),
      })),
    }));
  },

  // 6. Import Execution (Auto-filters junk categories)
  async executeImport(
    validRows: ValidatedImportRow[],
    mode: 'SYNC' | 'APPEND',
    fileName: string,
    actor = 'Admin'
  ): Promise<ImportBatch> {
    const batchId = `batch_${Date.now()}`;

    // Filter out rows that are junk/alumni/ampash
    const cleanedRows = validRows.filter(
      (r) => !isJunkCategory(r.nama) && !isJunkCategory(r.nama_kamar)
    );

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        // 1. Get or create kamar in Supabase
        const { data: existingKamar } = await supabase.from('kamar').select('*');
        const roomMap = new Map<string, string>();
        (existingKamar || []).forEach((k) => roomMap.set(k.nama_kamar.toLowerCase(), k.id));

        for (const r of cleanedRows) {
          const key = r.nama_kamar.toLowerCase();
          if (!roomMap.has(key)) {
            const { data: newK } = await supabase
              .from('kamar')
              .insert({
                nama_kamar: r.nama_kamar,
                limit_piket: 2,
                ada_piket: true,
                aktif: true,
                urutan: (roomMap.size + 1),
              })
              .select()
              .single();
            if (newK) {
              roomMap.set(key, newK.id);
            }
          }
        }

        // 2. Insert batch record
        const { data: batchData } = await supabase
          .from('import_batches')
          .insert({
            file_name: fileName,
            total_rows: cleanedRows.length,
            valid_rows: cleanedRows.length,
            invalid_rows: validRows.length - cleanedRows.length,
            status: 'IMPORTED',
            imported_by: actor,
          })
          .select()
          .single();

        const activeBatchId = batchData?.id || batchId;

        // 3. Upsert Gurus
        for (const r of cleanedRows) {
          const kamarId = roomMap.get(r.nama_kamar.toLowerCase());
          if (kamarId) {
            await supabase.from('guru').upsert(
              {
                rnk: r.rnk || 1,
                nama: r.nama,
                kamar_id: kamarId,
                tahun: r.tahun,
                aktif: true,
                source_import_batch_id: activeBatchId,
              },
              { onConflict: 'nama,kamar_id' }
            );
          }
        }

        return {
          id: activeBatchId,
          file_name: fileName,
          total_rows: cleanedRows.length,
          valid_rows: cleanedRows.length,
          invalid_rows: validRows.length - cleanedRows.length,
          status: 'IMPORTED',
          imported_by: actor,
          created_at: new Date().toISOString(),
        };
      } catch (err) {
        console.warn('Supabase executeImport fallback:', err);
      }
    }

    const roomMap = new Map<string, string>();
    for (const r of cleanedRows) {
      if (!roomMap.has(r.nama_kamar)) {
        let existingKamar = memoryKamar.find(
          (k) => k.nama_kamar.toLowerCase() === r.nama_kamar.toLowerCase()
        );
        if (!existingKamar) {
          existingKamar = {
            id: `k_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            nama_kamar: r.nama_kamar,
            limit_piket: 2,
            ada_piket: true,
            aktif: true,
            urutan: memoryKamar.length + 1,
            created_at: new Date().toISOString(),
          };
          memoryKamar.push(existingKamar);
        }
        roomMap.set(r.nama_kamar, existingKamar.id);
      }
    }

    if (mode === 'SYNC') {
      const newGuruKeys = new Set(cleanedRows.map((r) => `${r.nama.toLowerCase()}___${r.nama_kamar.toLowerCase()}`));
      memoryGuru.forEach((g) => {
        const kamar = memoryKamar.find((k) => k.id === g.kamar_id);
        const key = `${g.nama.toLowerCase()}___${kamar?.nama_kamar.toLowerCase()}`;
        if (!newGuruKeys.has(key)) {
          g.aktif = false;
        }
      });
    }

    cleanedRows.forEach((r) => {
      const kamarId = roomMap.get(r.nama_kamar)!;
      let existingGuru = memoryGuru.find(
        (g) => g.nama.toLowerCase() === r.nama.toLowerCase() && g.kamar_id === kamarId
      );

      if (existingGuru) {
        existingGuru.rnk = r.rnk || existingGuru.rnk;
        existingGuru.tahun = r.tahun;
        existingGuru.aktif = true;
        existingGuru.source_import_batch_id = batchId;
        existingGuru.updated_at = new Date().toISOString();
      } else {
        memoryGuru.push({
          id: `g_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          rnk: r.rnk || memoryGuru.length + 1,
          nama: r.nama,
          kamar_id: kamarId,
          tahun: r.tahun,
          aktif: true,
          source_import_batch_id: batchId,
          created_at: new Date().toISOString(),
        });
      }
    });

    const batch: ImportBatch = {
      id: batchId,
      file_name: fileName,
      total_rows: cleanedRows.length,
      valid_rows: cleanedRows.length,
      invalid_rows: validRows.length - cleanedRows.length,
      status: 'IMPORTED',
      imported_by: actor,
      created_at: new Date().toISOString(),
    };

    memoryImportBatches.unshift(batch);

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'IMPORT_GURU',
      entity_type: 'import_batches',
      entity_id: batchId,
      new_data: { file_name: fileName, mode, total_imported: cleanedRows.length },
      created_at: new Date().toISOString(),
    });

    return batch;
  },

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs fallback:', err);
      }
    }
    return memoryAuditLogs.slice(0, limit);
  },

  async getImportBatches(): Promise<ImportBatch[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('import_batches')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getImportBatches fallback:', err);
      }
    }
    return memoryImportBatches;
  },
};
