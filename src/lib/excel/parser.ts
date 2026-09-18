import * as XLSX from 'xlsx';
import { RawExcelRow } from '@/types';

/**
 * Normalizes a header string by lowercasing, replacing non-breaking spaces,
 * tabs, newlines, underscores, hyphens, and multiple spaces.
 */
function cleanHeaderString(header: any): string {
  if (header === null || header === undefined) return '';
  return String(header)
    .replace(/\u00A0/g, ' ') // Replace NBSP
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[_\-]+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Parses any Excel / CSV file array buffer into structured RawExcelRow array.
 * Intelligently auto-detects header row, handles multi-sheet workbooks,
 * supports title offsets, and maps various Indonesian & English column naming conventions.
 */
export function parseExcelFile(buffer: ArrayBuffer): RawExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  // 1. Find the best sheet that actually contains teacher / room data
  let bestSheetName = workbook.SheetNames[0];
  let bestSheetData: any[][] = [];
  let bestScore = -1;

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    // Convert sheet to 2D array of rows
    const raw2D: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (!raw2D || raw2D.length === 0) continue;

    // Score sheet by looking for keyword matches in the first 10 rows
    let sheetScore = 0;
    const maxScanRows = Math.min(raw2D.length, 12);
    for (let r = 0; r < maxScanRows; r++) {
      const row = raw2D[r] || [];
      for (const cell of row) {
        const cleaned = cleanHeaderString(cell);
        if (cleaned.includes('nama') || cleaned.includes('guru') || cleaned.includes('ustadz')) sheetScore += 3;
        if (cleaned.includes('kamar') || cleaned.includes('asrama')) sheetScore += 3;
        if (cleaned.includes('rank') || cleaned.includes('rnk') || cleaned === 'no') sheetScore += 1;
        if (cleaned.includes('tahun') || cleaned.includes('thn')) sheetScore += 1;
        if (cleaned.includes('limit') || cleaned.includes('kuota')) sheetScore += 2;
        if (cleaned.includes('piket')) sheetScore += 2;
      }
    }

    if (sheetScore > bestScore) {
      bestScore = sheetScore;
      bestSheetName = sheetName;
      bestSheetData = raw2D;
    }
  }

  // Fallback to first sheet if no score was computed
  if (bestSheetData.length === 0) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    bestSheetData = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });
  }

  if (bestSheetData.length === 0) {
    throw new Error('Lembar kerja Excel kosong atau tidak memiliki data.');
  }

  // 2. Identify the exact Header Row index (scan first 15 rows)
  let headerRowIndex = 0;
  let maxHeaderMatch = 0;

  const maxHeaderScan = Math.min(bestSheetData.length, 15);
  for (let r = 0; r < maxHeaderScan; r++) {
    const row = bestSheetData[r] || [];
    let matchCount = 0;

    for (const cell of row) {
      const c = cleanHeaderString(cell);
      if (
        c === 'nama' ||
        c.includes('nama guru') ||
        c.includes('nama lengkap') ||
        c.includes('nama ustadz') ||
        c === 'guru' ||
        c === 'kamar' ||
        c.includes('nama kamar') ||
        c === 'rank' ||
        c === 'rnk' ||
        c === 'no' ||
        c === 'no.' ||
        c === 'nomor' ||
        c === 'tahun' ||
        c.includes('limit') ||
        c.includes('kuota') ||
        c.includes('piket')
      ) {
        matchCount++;
      }
    }

    if (matchCount > maxHeaderMatch) {
      maxHeaderMatch = matchCount;
      headerRowIndex = r;
    }
  }

  const headerRow = bestSheetData[headerRowIndex] || [];

  // 3. Map Column Index to Standard Fields
  const colMap: {
    rnk?: number;
    nama?: number;
    kamar?: number;
    tahun?: number;
    limit_kamar?: number;
    ada_piket?: number;
    other: { [key: string]: number };
  } = {
    other: {},
  };

  headerRow.forEach((cellHeader, colIdx) => {
    const h = cleanHeaderString(cellHeader);
    if (!h) return;

    if (
      colMap.nama === undefined &&
      (h === 'nama' ||
        h.includes('nama guru') ||
        h.includes('nama lengkap') ||
        h.includes('nama ustadz') ||
        h === 'guru' ||
        h === 'ustadz' ||
        h === 'pengajar')
    ) {
      colMap.nama = colIdx;
    } else if (
      colMap.kamar === undefined &&
      (h === 'kamar' ||
        h.includes('nama kamar') ||
        h === 'ruang' ||
        h === 'asrama' ||
        h === 'lokasi')
    ) {
      colMap.kamar = colIdx;
    } else if (
      colMap.rnk === undefined &&
      (h === 'rnk' ||
        h === 'rank' ||
        h === 'no' ||
        h === 'no.' ||
        h === 'nomor' ||
        h === 'no urut' ||
        h === 'urutan')
    ) {
      colMap.rnk = colIdx;
    } else if (
      colMap.tahun === undefined &&
      (h === 'tahun' ||
        h === 'thn' ||
        h.includes('tahun ajaran') ||
        h === 'angkatan' ||
        h === 'periode' ||
        h === 'masa')
    ) {
      colMap.tahun = colIdx;
    } else if (
      colMap.limit_kamar === undefined &&
      (h === 'limit' ||
        h.includes('limit kamar') ||
        h.includes('limit_kamar') ||
        h.includes('limit piket') ||
        h.includes('limit_piket') ||
        h.includes('kuota') ||
        h.includes('kuota piket') ||
        h === 'max' ||
        h === 'maks')
    ) {
      colMap.limit_kamar = colIdx;
    } else if (
      colMap.ada_piket === undefined &&
      (h === 'ada piket' ||
        h === 'ada_piket' ||
        h === 'piket' ||
        h === 'tugas piket' ||
        h === 'status piket' ||
        h === 'is piket' ||
        h === 'is_piket')
    ) {
      colMap.ada_piket = colIdx;
    } else {
      colMap.other[String(cellHeader).trim()] = colIdx;
    }
  });

  // Fallback if no header keyword matches (assume standard columns: 0=Rank, 1=Nama, 2=Kamar, 3=Tahun, 4=Limit, 5=AdaPiket)
  if (colMap.nama === undefined && headerRow.length >= 2) {
    colMap.rnk = 0;
    colMap.nama = 1;
    colMap.kamar = 2;
    if (headerRow.length >= 4) colMap.tahun = 3;
    if (headerRow.length >= 5) colMap.limit_kamar = 4;
    if (headerRow.length >= 6) colMap.ada_piket = 5;
  }

  // 4. Extract data rows
  const result: RawExcelRow[] = [];
  for (let r = headerRowIndex + 1; r < bestSheetData.length; r++) {
    const row = bestSheetData[r] || [];

    // Check if row is completely empty
    const hasContent = row.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
    if (!hasContent) continue;

    const rowObj: RawExcelRow = {};

    if (colMap.rnk !== undefined && row[colMap.rnk] !== undefined) {
      rowObj.RNK = typeof row[colMap.rnk] === 'string' ? row[colMap.rnk].trim() : row[colMap.rnk];
    }
    if (colMap.nama !== undefined && row[colMap.nama] !== undefined) {
      rowObj.Nama = typeof row[colMap.nama] === 'string' ? row[colMap.nama].trim() : row[colMap.nama];
    }
    if (colMap.kamar !== undefined && row[colMap.kamar] !== undefined) {
      rowObj.Kamar = typeof row[colMap.kamar] === 'string' ? row[colMap.kamar].trim() : row[colMap.kamar];
    }
    if (colMap.tahun !== undefined && row[colMap.tahun] !== undefined) {
      rowObj.Tahun = typeof row[colMap.tahun] === 'string' ? row[colMap.tahun].trim() : row[colMap.tahun];
    }
    if (colMap.limit_kamar !== undefined && row[colMap.limit_kamar] !== undefined) {
      rowObj.Limit_Kamar = typeof row[colMap.limit_kamar] === 'string' ? row[colMap.limit_kamar].trim() : row[colMap.limit_kamar];
    }
    if (colMap.ada_piket !== undefined && row[colMap.ada_piket] !== undefined) {
      rowObj.Ada_Piket = typeof row[colMap.ada_piket] === 'string' ? row[colMap.ada_piket].trim() : row[colMap.ada_piket];
    }

    // Capture other fields
    for (const [key, colIdx] of Object.entries(colMap.other)) {
      if (row[colIdx] !== undefined) {
        rowObj[key] = typeof row[colIdx] === 'string' ? row[colIdx].trim() : row[colIdx];
      }
    }

    // Only include if there is at least a name or room
    if (rowObj.Nama || rowObj.Kamar) {
      result.push(rowObj);
    }
  }

  return result;
}
