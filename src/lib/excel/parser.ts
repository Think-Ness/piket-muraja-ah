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

export interface ParsedWorkbookResult {
  selectedSheet: string;
  sheetNames: string[];
  rows: RawExcelRow[];
}

/**
 * Parses any Excel / CSV file array buffer into structured RawExcelRow array with sheet metadata.
 * Intelligently auto-detects header row, scores sheets based on teacher+room columns,
 * supports title offsets, and maps various Indonesian & English column naming conventions.
 */
export function parseExcelWorkbook(buffer: ArrayBuffer, targetSheetName?: string): ParsedWorkbookResult {
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const sheetNames = workbook.SheetNames;

  // 1. Determine which sheet to parse
  let bestSheetName = sheetNames[0];
  let bestScore = -1;

  if (targetSheetName && sheetNames.includes(targetSheetName)) {
    bestSheetName = targetSheetName;
  } else {
    // Automatically find the sheet with the most valid data containing both Nama and Kamar
    for (const name of sheetNames) {
      const ws = workbook.Sheets[name];
      if (!ws) continue;

      const raw2D: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
      });

      if (!raw2D || raw2D.length === 0) continue;

      let sheetScore = 0;
      const maxScanRows = Math.min(raw2D.length, 15);
      for (let r = 0; r < maxScanRows; r++) {
        const row = raw2D[r] || [];
        let namaCol = -1;
        let kamarCol = -1;

        row.forEach((cell, idx) => {
          const s = cleanHeaderString(cell);
          if (s === 'nama' || s.includes('nama guru') || s.includes('nama lengkap') || s === 'guru' || s === 'ustadz') {
            namaCol = idx;
          }
          if (s === 'kamar' || s.includes('nama kamar') || s === 'asrama' || s === 'ruang') {
            kamarCol = idx;
          }
        });

        if (namaCol !== -1 && kamarCol !== -1) {
          // Count non-empty data rows below header
          let validDataRows = 0;
          for (let i = r + 1; i < raw2D.length; i++) {
            const dataRow = raw2D[i] || [];
            if (dataRow[namaCol] && String(dataRow[namaCol]).trim() !== '') {
              validDataRows++;
            }
          }
          sheetScore = 10000 + validDataRows;
          break;
        } else if (namaCol !== -1) {
          let validDataRows = 0;
          for (let i = r + 1; i < raw2D.length; i++) {
            const dataRow = raw2D[i] || [];
            if (dataRow[namaCol] && String(dataRow[namaCol]).trim() !== '') {
              validDataRows++;
            }
          }
          sheetScore = Math.max(sheetScore, 1000 + validDataRows);
        }
      }

      if (sheetScore > bestScore) {
        bestScore = sheetScore;
        bestSheetName = name;
      }
    }
  }

  const selectedSheet = bestSheetName;
  const ws = workbook.Sheets[selectedSheet];
  if (!ws) {
    throw new Error(`Lembar kerja '${selectedSheet}' tidak ditemukan.`);
  }

  const raw2D: any[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (raw2D.length === 0) {
    throw new Error(`Lembar kerja '${selectedSheet}' kosong atau tidak memiliki data.`);
  }

  // 2. Identify the exact Header Row index (scan first 15 rows)
  let headerRowIndex = 0;
  let maxHeaderMatch = 0;

  const maxHeaderScan = Math.min(raw2D.length, 15);
  for (let r = 0; r < maxHeaderScan; r++) {
    const row = raw2D[r] || [];
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
        c === 'asrama' ||
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

  const headerRow = raw2D[headerRowIndex] || [];

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
  const rows: RawExcelRow[] = [];
  for (let r = headerRowIndex + 1; r < raw2D.length; r++) {
    const row = raw2D[r] || [];

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

    // Include if there is either a name or a room
    if (rowObj.Nama || rowObj.Kamar) {
      rows.push(rowObj);
    }
  }

  return {
    selectedSheet,
    sheetNames,
    rows,
  };
}

/**
 * Backwards compatible parseExcelFile
 */
export function parseExcelFile(buffer: ArrayBuffer, targetSheetName?: string): RawExcelRow[] {
  return parseExcelWorkbook(buffer, targetSheetName).rows;
}
