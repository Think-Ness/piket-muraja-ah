import * as XLSX from 'xlsx';
import { Guru, KamarOverview, PiketSubmission } from '@/types';

export function exportComprehensiveExcelWorkbook(
  kamarList: KamarOverview[],
  submissions: PiketSubmission[]
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Rekapitulasi Status Kamar
  const rekapData = kamarList.map((k, idx) => ({
    'No': idx + 1,
    'Nama Kamar': k.nama_kamar,
    'Tugas Piket': k.ada_piket ? 'Ada Piket' : 'Non-Piket',
    'Jumlah Anggota': k.total_guru,
    'Limit Kuota': k.ada_piket ? k.limit_piket : 0,
    'Piket Terpilih': k.ada_piket ? k.total_piket_terpilih : 0,
    'Status Penetapan': k.status_penetapan,
    'Ada Perubahan / Revisi': k.has_revisions ? `Ya (${k.revision_count}x edit)` : 'Tidak',
    'Terakhir Update': k.updated_at ? new Date(k.updated_at).toLocaleString('id-ID') : '-',
  }));
  const wsRekap = XLSX.utils.json_to_sheet(rekapData);
  XLSX.utils.book_append_sheet(workbook, wsRekap, 'Rekapitulasi Kamar');

  // Sheet 2: Detail Penetapan Guru Aktif
  const activeSubmissions = submissions.filter((s) => s.status === 'SUCCESS');
  const detailData: any[] = [];
  let rowNo = 1;

  activeSubmissions.forEach((sub) => {
    (sub.members || []).forEach((m) => {
      detailData.push({
        'No': rowNo++,
        'RNK': m.guru?.rnk || '-',
        'Nama Guru Piket': m.guru?.nama || '-',
        'Kamar': sub.kamar?.nama_kamar || '-',
        'Tahun': m.guru?.tahun || '-',
        'Status Transaksi': sub.status,
        'Versi Penetapan': `Versi ${sub.version || 1}`,
        'Apakah Revisi': sub.is_revision ? 'Ya' : 'Penetapan Awal',
        'Waktu Penetapan': new Date(sub.submitted_at).toLocaleString('id-ID'),
        'Operator / Petugas': sub.submitted_by || 'Petugas Kamar',
      });
    });
  });
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(workbook, wsDetail, 'Detail Guru Piket');

  // Sheet 3: Riwayat Revisi & Perubahan
  const revisions = submissions.filter((s) => s.is_revision);
  const revisiData = revisions.map((sub, idx) => ({
    'No': idx + 1,
    'Kamar': sub.kamar?.nama_kamar || '-',
    'Versi Revisi': `Versi ${sub.version || 2}`,
    'Guru yang Ditetapkan Saat Ini': (sub.members || []).map((m) => m.guru?.nama).join(', '),
    'Waktu Revisi': new Date(sub.submitted_at).toLocaleString('id-ID'),
    'Operator Pengubah': sub.submitted_by || 'Petugas Kamar',
  }));
  const wsRevisi = XLSX.utils.json_to_sheet(revisiData);
  XLSX.utils.book_append_sheet(workbook, wsRevisi, 'Riwayat Revisi');

  return workbook;
}

export function exportKamarOverviewToWorkbook(kamarList: KamarOverview[]): XLSX.WorkBook {
  const data = kamarList.map((k, idx) => ({
    'No': idx + 1,
    'Kamar': k.nama_kamar,
    'Tugas Piket': k.ada_piket ? 'Ada Piket' : 'Non-Piket',
    'Jumlah Anggota': k.total_guru,
    'Limit Piket': k.limit_piket,
    'Jumlah Piket': k.total_piket_terpilih,
    'Status': k.status_penetapan,
    'Ada Perubahan': k.has_revisions ? `Ya (${k.revision_count}x edit)` : 'Tidak',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kamar');
  return workbook;
}

export function exportPiketSubmissionsWithMasterGuruToWorkbook(
  gurus: Guru[],
  submissions: PiketSubmission[]
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Create a fast lookup map for active piket teachers
  const activePiketMap = new Map<string, {
    kamarNama: string;
    submittedAt: string;
    submittedBy: string;
    isRevision: boolean;
  }>();

  const successSubs = submissions.filter((s) => s.status === 'SUCCESS');
  successSubs.forEach((sub) => {
    (sub.members || []).forEach((m) => {
      const gId = m.guru_id || m.guru?.id;
      if (gId) {
        activePiketMap.set(gId, {
          kamarNama: sub.kamar?.nama_kamar || '-',
          submittedAt: sub.submitted_at,
          submittedBy: sub.submitted_by || 'Petugas Kamar',
          isRevision: Boolean(sub.is_revision),
        });
      }
    });
  });

  // ==========================================
  // SHEET 1: Master Data Guru & Status Piket
  // ==========================================
  const sheet1Data = gurus.map((g, idx) => {
    const piketInfo = activePiketMap.get(g.id);
    const isPiket = Boolean(piketInfo);

    return {
      'No': idx + 1,
      'RNK': g.rnk || idx + 1,
      'Nama Guru': g.nama,
      'Kamar': g.kamar?.nama_kamar || '-',
      'Tahun': g.tahun || '-',
      'Status Guru': g.aktif ? 'Aktif' : 'Nonaktif',
      'Terpilih Piket': isPiket ? 'PIKET AKTIF' : '-',
      'Waktu Penetapan': piketInfo?.submittedAt ? new Date(piketInfo.submittedAt).toLocaleString('id-ID') : '-',
      'Disubmit Oleh': piketInfo?.submittedBy || '-',
    };
  });

  const wsSheet1 = XLSX.utils.json_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(workbook, wsSheet1, 'Data Guru & Status Piket');

  // ==========================================
  // SHEET 2: Detail Hasil Submit Piket
  // ==========================================
  const sheet2Data: any[] = [];
  let subRowNo = 1;

  submissions.forEach((sub) => {
    (sub.members || []).forEach((m) => {
      sheet2Data.push({
        'No': subRowNo++,
        'RNK': m.guru?.rnk || '-',
        'Nama Guru Piket': m.guru?.nama || '-',
        'Kamar': sub.kamar?.nama_kamar || '-',
        'Tahun': m.guru?.tahun || sub.kamar?.nama_kamar || '-',
        'Waktu Penetapan': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('id-ID') : '-',
        'Operator / Disubmit Oleh': sub.submitted_by || 'Petugas Kamar',
        'Status Transaksi': sub.status,
        'Versi Penetapan': `Versi ${sub.version || 1}`,
        'Revisi': sub.is_revision ? 'Ya (Revisi)' : 'Penetapan Pertama',
        'Catatan': sub.notes || '-',
      });
    });
  });

  const wsSheet2 = XLSX.utils.json_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(workbook, wsSheet2, 'Hasil Submit Piket');

  return workbook;
}

export function exportPiketDetailToWorkbook(
  submissions: PiketSubmission[],
  gurus?: Guru[]
): XLSX.WorkBook {
  if (gurus && gurus.length > 0) {
    return exportPiketSubmissionsWithMasterGuruToWorkbook(gurus, submissions);
  }

  const workbook = XLSX.utils.book_new();
  const sheet2Data: any[] = [];
  let subRowNo = 1;

  submissions.forEach((sub) => {
    (sub.members || []).forEach((m) => {
      sheet2Data.push({
        'No': subRowNo++,
        'RNK': m.guru?.rnk || '-',
        'Nama Guru Piket': m.guru?.nama || '-',
        'Kamar': sub.kamar?.nama_kamar || '-',
        'Tahun': m.guru?.tahun || '-',
        'Waktu Penetapan': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('id-ID') : '-',
        'Operator / Disubmit Oleh': sub.submitted_by || 'Petugas Kamar',
        'Status Transaksi': sub.status,
        'Revisi': sub.is_revision ? 'Ya (Revisi)' : 'Penetapan Pertama',
        'Catatan': sub.notes || '-',
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(workbook, ws, 'Hasil Submit Piket');
  return workbook;
}

export function workbookToBuffer(workbook: XLSX.WorkBook, type: 'xlsx' | 'csv'): Uint8Array {
  if (type === 'csv') {
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const csvString = XLSX.utils.sheet_to_csv(sheet);
    const encoder = new TextEncoder();
    return encoder.encode(csvString);
  }

  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}
