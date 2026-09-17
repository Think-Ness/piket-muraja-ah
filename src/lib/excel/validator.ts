import { RawExcelRow, ValidatedImportRow, ImportValidationResult } from '@/types';

export function validateExcelRows(fileName: string, rawRows: RawExcelRow[]): ImportValidationResult {
  const validatedRows: ValidatedImportRow[] = [];
  const kamarNamesSet = new Set<string>();
  const seenTeacherKamar = new Map<string, number>();

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for 1-indexed header offset in Excel
    const errors: string[] = [];
    const warnings: string[] = [];

    const nama = typeof row.Nama === 'string' ? row.Nama.trim() : '';
    const nama_kamar = typeof row.Kamar === 'string' ? row.Kamar.trim() : '';
    const tahun = typeof row.Tahun === 'string' ? row.Tahun.trim() : (row.Tahun ? String(row.Tahun).trim() : '');
    
    let rnk: number | null = null;
    if (row.RNK !== undefined && row.RNK !== null && String(row.RNK).trim() !== '') {
      const parsedRnk = parseInt(String(row.RNK).trim(), 10);
      if (isNaN(parsedRnk)) {
        warnings.push(`Format RNK '${row.RNK}' bukan angka valid. Akan diatur otomatis.`);
      } else {
        rnk = parsedRnk;
      }
    }

    if (!nama) {
      errors.push('Nama guru tidak boleh kosong.');
    }

    if (!nama_kamar) {
      errors.push('Nama kamar tidak boleh kosong.');
    } else {
      kamarNamesSet.add(nama_kamar);
    }

    if (!tahun) {
      warnings.push('Kolom Tahun kosong. Akan menggunakan default tahun kegiatan aktif.');
    }

    // Duplicate detection in file
    if (nama && nama_kamar) {
      const key = `${nama.toLowerCase()}___${nama_kamar.toLowerCase()}`;
      if (seenTeacherKamar.has(key)) {
        const prevRow = seenTeacherKamar.get(key);
        warnings.push(`Terdeteksi duplikat data dengan baris ${prevRow} (Nama & Kamar sama).`);
      } else {
        seenTeacherKamar.set(key, rowNumber);
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
      if (warnings.length > 0) {
        warningCount++;
      }
    } else {
      errorCount++;
    }

    validatedRows.push({
      rowNumber,
      rnk,
      nama,
      nama_kamar,
      tahun: tahun || '1447-1448',
      isValid,
      errors,
      warnings,
    });
  });

  return {
    fileName,
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errorCount,
    rows: validatedRows,
    uniqueKamarNames: Array.from(kamarNamesSet).sort(),
  };
}
