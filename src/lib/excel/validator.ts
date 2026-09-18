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

    const nama = row.Nama !== undefined && row.Nama !== null ? String(row.Nama).trim() : '';
    const nama_kamar = row.Kamar !== undefined && row.Kamar !== null ? String(row.Kamar).trim() : '';
    const tahun = row.Tahun !== undefined && row.Tahun !== null ? String(row.Tahun).trim() : '';
    
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

    // Process optional Ada_Piket
    let ada_piket = true;
    if (row.Ada_Piket !== undefined && row.Ada_Piket !== null && String(row.Ada_Piket).trim() !== '') {
      const piketStr = String(row.Ada_Piket).trim().toLowerCase();
      if (['tidak', 'false', '0', 'tidak ada', 'non', 'non-piket', 'off', 'bukan'].includes(piketStr)) {
        ada_piket = false;
      } else {
        ada_piket = true;
      }
    }

    // Process optional Limit_Kamar
    let limit_kamar = ada_piket ? 2 : 0;
    if (row.Limit_Kamar !== undefined && row.Limit_Kamar !== null && String(row.Limit_Kamar).trim() !== '') {
      const parsedLimit = parseInt(String(row.Limit_Kamar).trim(), 10);
      if (!isNaN(parsedLimit) && parsedLimit >= 0) {
        limit_kamar = parsedLimit;
        if (limit_kamar === 0) {
          ada_piket = false;
        }
      } else {
        warnings.push(`Nilai limit '${row.Limit_Kamar}' tidak valid. Menggunakan default (${ada_piket ? 2 : 0}).`);
      }
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
      limit_kamar,
      ada_piket,
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
