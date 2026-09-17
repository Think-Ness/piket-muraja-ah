import * as XLSX from 'xlsx';
import { RawExcelRow } from '@/types';

export function parseExcelFile(buffer: ArrayBuffer): RawExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false,
  });

  // Normalize column keys (case-insensitive and trim)
  return jsonData.map((row) => {
    const normalizedRow: RawExcelRow = {};
    for (const key of Object.keys(row)) {
      const trimmedKey = key.trim().toLowerCase();
      const val = typeof row[key] === 'string' ? row[key].trim() : row[key];

      if (trimmedKey === 'rnk' || trimmedKey === 'no' || trimmedKey === 'rank') {
        normalizedRow.RNK = val;
      } else if (trimmedKey === 'nama' || trimmedKey === 'nama guru' || trimmedKey === 'nama lengkap') {
        normalizedRow.Nama = val;
      } else if (trimmedKey === 'kamar' || trimmedKey === 'nama kamar') {
        normalizedRow.Kamar = val;
      } else if (trimmedKey === 'tahun' || trimmedKey === 'thn' || trimmedKey === 'tahun ajaran') {
        normalizedRow.Tahun = val;
      } else {
        normalizedRow[key] = val;
      }
    }
    return normalizedRow;
  });
}
