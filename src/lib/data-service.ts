import { 
  EventSettings, 
  Kamar, 
  Guru, 
  KamarOverview, 
  PiketSubmission, 
  AuditLog, 
  ImportBatch, 
  SubmitPiketPayload, 
  SubmitPiketResult,
  ValidatedImportRow
} from '@/types';
import { createClient } from '@/lib/supabase/client';

// Initial in-memory database state matching seed.sql (clean master rooms)
let memorySettings: EventSettings = {
  id: 'e0000000-0000-0000-0000-000000000001',
  event_name: "Ujian Muraja'ah Akhir Tahun",
  event_subtitle: "Penentuan Piket Kamar Guru",
  committee_name: "Panitia Ujian Muraja'ah Akhir Tahun",
  academic_year: "1447–1448 H",
  form_status: 'OPEN',
  whatsapp_number: '6281234567890',
  whatsapp_label: 'Hubungi Panitia Piket',
  waktu_buka: null,
  waktu_tutup: null,
  updated_at: new Date().toISOString(),
  updated_by: 'System'
};

// Rooms list: Exclude junk/alumni/non-piket categories
let memoryKamar: Kamar[] = [
  { id: 'k01', nama_kamar: 'Gontor', limit_piket: 2, ada_piket: true, aktif: true, urutan: 1, created_at: new Date().toISOString() },
  { id: 'k02', nama_kamar: 'Gandy', limit_piket: 1, ada_piket: true, aktif: true, urutan: 2, created_at: new Date().toISOString() },
  { id: 'k03', nama_kamar: 'Perdos Saudi', limit_piket: 2, ada_piket: true, aktif: true, urutan: 3, created_at: new Date().toISOString() },
  { id: 'k04', nama_kamar: 'Perdos UNIDA Siman', limit_piket: 3, ada_piket: true, aktif: true, urutan: 4, created_at: new Date().toISOString() },
  { id: 'k05', nama_kamar: 'Wisma Darussalam', limit_piket: 2, ada_piket: true, aktif: true, urutan: 5, created_at: new Date().toISOString() },
  { id: 'k06', nama_kamar: 'Aligarh', limit_piket: 1, ada_piket: true, aktif: true, urutan: 6, created_at: new Date().toISOString() },
  { id: 'k07', nama_kamar: 'Syam', limit_piket: 2, ada_piket: true, aktif: true, urutan: 7, created_at: new Date().toISOString() },
  { id: 'k08', nama_kamar: 'Makkah', limit_piket: 2, ada_piket: true, aktif: true, urutan: 8, created_at: new Date().toISOString() },
  { id: 'k09', nama_kamar: 'Madinah', limit_piket: 2, ada_piket: true, aktif: true, urutan: 9, created_at: new Date().toISOString() },
  { id: 'k10', nama_kamar: 'Kulliyatu-l-Banat', limit_piket: 3, ada_piket: false, aktif: true, urutan: 10, created_at: new Date().toISOString() },
  { id: 'k11', nama_kamar: 'Santiniketan', limit_piket: 1, ada_piket: true, aktif: true, urutan: 11, created_at: new Date().toISOString() },
  { id: 'k12', nama_kamar: 'Al-Azhar', limit_piket: 2, ada_piket: true, aktif: true, urutan: 12, created_at: new Date().toISOString() },
  { id: 'k13', nama_kamar: 'Qordova', limit_piket: 2, ada_piket: true, aktif: true, urutan: 13, created_at: new Date().toISOString() }
];

let memoryGuru: Guru[] = [
  // Gontor
  { id: 'g01', rnk: 1, nama: 'K.H. Hasan Abdullah Sahal', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g02', rnk: 2, nama: 'Drs. K.H. M. Akrim Mariyat, Dipl.A.Ed.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g03', rnk: 3, nama: 'Prof. Dr. K.H. Amal Fathullah Zarkasyi, M.A.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g04', rnk: 4, nama: 'H. Imam Shobari, S.Ag.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g05', rnk: 5, nama: "H. M. Syuja'i, S.Ag.", kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g06', rnk: 6, nama: 'Ust. H. Nur Hadi, M.Pd.I.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g07', rnk: 7, nama: 'Ust. H. Riza Ashari, M.Pd.I.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  { id: 'g08', rnk: 8, nama: 'Ust. H. Ahmad Saefullah, M.Pd.I.', kamar_id: 'k01', tahun: '1447-1448', aktif: true },
  // Gandy
  { id: 'g09', rnk: 9, nama: 'Ust. Dr. H. Setiawan Bin Lahuri, M.A.', kamar_id: 'k02', tahun: '1447-1448', aktif: true },
  { id: 'g10', rnk: 10, nama: 'Ust. H. Fairuz Subakir Ahmad, M.A.', kamar_id: 'k02', tahun: '1447-1448', aktif: true },
  { id: 'g11', rnk: 11, nama: 'Ust. H. Mohammad Adnan Haris, M.Pd.I.', kamar_id: 'k02', tahun: '1447-1448', aktif: true },
  { id: 'g12', rnk: 12, nama: 'Ust. H. Daniar, M.A.', kamar_id: 'k02', tahun: '1447-1448', aktif: true },
  // Perdos Saudi
  { id: 'g13', rnk: 13, nama: 'Ust. H. Suwarno, M.Pd.I.', kamar_id: 'k03', tahun: '1447-1448', aktif: true },
  { id: 'g14', rnk: 14, nama: 'Ust. H. M. Taufiq Affandi, M.Sc.', kamar_id: 'k03', tahun: '1447-1448', aktif: true },
  { id: 'g15', rnk: 15, nama: 'Ust. H. Hasib Amrullah, M.A.', kamar_id: 'k03', tahun: '1447-1448', aktif: true },
  // Perdos UNIDA
  { id: 'g16', rnk: 16, nama: 'Ust. Dr. H. Abdul Hafidz Zaid, M.A.', kamar_id: 'k04', tahun: '1447-1448', aktif: true },
  { id: 'g17', rnk: 17, nama: 'Ust. Dr. H. Khoirul Umam, M.Ec.', kamar_id: 'k04', tahun: '1447-1448', aktif: true },
  { id: 'g18', rnk: 18, nama: 'Ust. Dr. Cecep Sobar Rochmat, M.Pd.I.', kamar_id: 'k04', tahun: '1447-1448', aktif: true },
  { id: 'g19', rnk: 19, nama: 'Ust. Dr. H. Jarman Arroisi, M.A.', kamar_id: 'k04', tahun: '1447-1448', aktif: true },
];

let memorySubmissions: PiketSubmission[] = [];
let memoryAuditLogs: AuditLog[] = [
  {
    id: 'a01',
    actor_id: 'System',
    action: 'INIT_SYSTEM',
    entity_type: 'system',
    entity_id: 'system',
    new_data: { note: 'Inisialisasi sistem piket murajaah' },
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];
let memoryImportBatches: ImportBatch[] = [];

// Helper to filter out junk / non-piket categories automatically
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
  return Boolean(url && !url.includes('sample-project') && !url.includes('your-project'));
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
          return { ...data, form_status: effectiveStatus };
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
        const { data, error } = await supabase
          .from('event_settings')
          .update({ ...settings, updated_at: new Date().toISOString(), updated_by: actor })
          .eq('id', memorySettings.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateSettings fallback to local:', err);
      }
    }

    const oldData = { ...memorySettings };
    memorySettings = {
      ...memorySettings,
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: actor
    };

    memoryAuditLogs.unshift({
      id: `a_${Date.now()}`,
      actor_id: actor,
      action: 'UPDATE_SETTINGS',
      entity_type: 'event_settings',
      entity_id: memorySettings.id,
      old_data: oldData,
      new_data: memorySettings,
      created_at: new Date().toISOString()
    });

    return { ...memorySettings };
  },

  // 2. Kamar & Overview
  async getKamarOverviewList(options?: { onlyPiket?: boolean }): Promise<KamarOverview[]> {
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
    return memoryKamar.filter((k) => k.ada_piket && k.aktif && !isJunkCategory(k.nama_kamar));
  },

  async getKamarDetail(id: string): Promise<{ 
    kamar: Kamar; 
    gurus: Guru[]; 
    activePiketCount: number;
    currentSelectedGuruIds: string[];
    isPreviousSubmission: boolean;
  } | null> {
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
    return memoryAuditLogs.slice(0, limit);
  },

  async getImportBatches(): Promise<ImportBatch[]> {
    return memoryImportBatches;
  }
};
