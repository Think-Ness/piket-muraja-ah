'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcelFile } from '@/lib/excel/parser';
import { validateExcelRows } from '@/lib/excel/validator';
import { ImportValidationResult } from '@/types';
import { DataService } from '@/lib/data-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Info
} from 'lucide-react';

type Step = 'UPLOAD' | 'PREVIEW' | 'COMPLETE';

export default function AdminImportPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'SYNC' | 'APPEND'>('SYNC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedBatch, setImportedBatch] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const rawRows = parseExcelFile(buffer);
      const validation = validateExcelRows(uploadedFile.name, rawRows);
      setValidationResult(validation);
      setStep('PREVIEW');
    } catch (err: any) {
      showToast(err.message || 'Gagal membaca file Excel.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult) return;

    const validRowsToImport = validationResult.rows.filter((r) => r.isValid);
    if (validRowsToImport.length === 0) {
      showToast('Tidak ada baris data valid untuk diimpor.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const batch = await DataService.executeImport(
        validRowsToImport,
        importMode,
        validationResult.fileName,
        'Admin'
      );
      setImportedBatch(batch);
      setStep('COMPLETE');
      showToast(`Import berhasil: ${validRowsToImport.length} data guru disimpan.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan proses import.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Import Master Data Kamar & Guru
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Impor master data menggunakan file template spreadsheet Excel (.xlsx / .xls / .csv).
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 'UPLOAD' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            1
          </span>
          <span className={`font-semibold ${step === 'UPLOAD' ? 'text-slate-900' : 'text-slate-500'}`}>
            Upload File
          </span>
        </div>

        <div className="h-px w-12 bg-slate-200" />

        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 'PREVIEW' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            2
          </span>
          <span className={`font-semibold ${step === 'PREVIEW' ? 'text-slate-900' : 'text-slate-500'}`}>
            Validasi & Preview
          </span>
        </div>

        <div className="h-px w-12 bg-slate-200" />

        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 'COMPLETE' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </span>
          <span className={`font-semibold ${step === 'COMPLETE' ? 'text-emerald-800' : 'text-slate-500'}`}>
            Selesai
          </span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'UPLOAD' && (
        <div className="space-y-6">
          {/* Template Guidance */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <Info className="h-4 w-4 text-slate-500" />
              <span>Format Kolom Wajib Template Excel:</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Pastikan file Excel memiliki baris header pertama dengan susunan kolom berikut:
            </p>
            <div className="overflow-x-auto">
              <table className="border border-slate-200 text-slate-800 rounded bg-slate-50 text-xs w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 font-semibold bg-slate-100">
                    <th className="p-2 w-16">RNK</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Kamar</th>
                    <th className="p-2">Tahun</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 text-slate-500">1</td>
                    <td className="p-2">K.H. Hasan Abdullah Sahal</td>
                    <td className="p-2 font-medium">Gontor</td>
                    <td className="p-2">1447-1448</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center hover:border-slate-400 transition-colors">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Pilih file data Kamar & Guru
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Mendukung format .xlsx, .xls, atau .csv. Sistem akan memvalidasi seluruh baris sebelum melakukan import.
            </p>

            <div className="mt-6 flex justify-center">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                <UploadCloud className="h-4 w-4" />
                <span>Pilih File Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Validation */}
      {step === 'PREVIEW' && validationResult && (
        <div className="space-y-6">
          {/* Validation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs">
              <span className="text-slate-500 font-medium">Total Baris File:</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{validationResult.totalRows}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs">
              <span className="text-emerald-800 font-medium">Baris Valid:</span>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">{validationResult.validCount}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs">
              <span className="text-amber-800 font-medium">Peringatan:</span>
              <div className="text-lg font-bold text-amber-800 mt-0.5">{validationResult.warningCount}</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3.5 text-xs">
              <span className="text-rose-800 font-medium">Baris Error:</span>
              <div className="text-lg font-bold text-rose-800 mt-0.5">{validationResult.errorCount}</div>
            </div>
          </div>

          {/* Import Mode Selection */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-3">
            <span className="font-semibold text-slate-900 uppercase tracking-wider block">
              Pilih Strategi Rekonsiliasi Import:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setImportMode('SYNC')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  importMode === 'SYNC'
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">Sync Master Data (Disarankan)</div>
                <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">
                  Menjadikan file ini sebagai sumber kebenaran master terbaru. Guru baru ditambahkan, perubahan diperbarui, dan guru yang tidak ada dinonaktifkan.
                </p>
              </label>

              <label
                onClick={() => setImportMode('APPEND')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  importMode === 'APPEND'
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">Append Mode</div>
                <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">
                  Menambahkan data baru tanpa mengubah atau menonaktifkan master data lama.
                </p>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
              <span>Preview Baris Data ({validationResult.rows.length} baris)</span>
              <span>Kamar terdeteksi: {validationResult.uniqueKamarNames.length}</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse table-dense">
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>RNK</th>
                    <th>Nama Guru</th>
                    <th>Kamar</th>
                    <th>Tahun</th>
                    <th>Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.rows.slice(0, 100).map((r) => (
                    <tr key={r.rowNumber} className={!r.isValid ? 'bg-rose-50/50' : ''}>
                      <td className="text-slate-400 font-mono">#{r.rowNumber}</td>
                      <td>{r.rnk || '-'}</td>
                      <td className="font-semibold text-slate-900">{r.nama || '<Kosong>'}</td>
                      <td>{r.nama_kamar || '<Kosong>'}</td>
                      <td>{r.tahun}</td>
                      <td>
                        {r.isValid ? (
                          r.warnings.length > 0 ? (
                            <span className="text-amber-700 font-medium">Valid (Warning)</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Valid</span>
                          )
                        ) : (
                          <span className="text-rose-700 font-semibold">{r.errors.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setStep('UPLOAD');
                setValidationResult(null);
              }}
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ganti File</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecuteImport}
              isLoading={isProcessing}
              disabled={validationResult.validCount === 0 || isProcessing}
            >
              <span>Jalankan Import ({validationResult.validCount} Data)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'COMPLETE' && importedBatch && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Import Selesai dengan Sukses
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            File <span className="font-semibold text-slate-900">{importedBatch.file_name}</span> telah berhasil diproses. Sebanyak <span className="font-semibold text-slate-900">{importedBatch.valid_rows} baris data</span> telah disinkronkan ke database.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/admin/guru')}
              className="w-full sm:w-auto"
            >
              Lihat Master Guru
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setStep('UPLOAD');
                setFile(null);
                setValidationResult(null);
              }}
              className="w-full sm:w-auto"
            >
              Import File Lain
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
