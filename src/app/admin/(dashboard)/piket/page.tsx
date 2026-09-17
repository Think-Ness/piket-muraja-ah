'use client';

import React, { useEffect, useState } from 'react';
import { PiketSubmission } from '@/types';
import { DataService } from '@/lib/data-service';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { 
  Download, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle, 
  FileSpreadsheet, 
  User, 
  ShieldAlert,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function AdminPiketPage() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<PiketSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getPiketSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = (format: 'xlsx' | 'csv') => {
    window.open(`/api/export/piket?format=${format}`, '_blank');
    showToast(`Mengekspor detail penetapan piket (.${format})...`, 'info');
  };

  const handleExecuteReset = async (exportFirst: boolean) => {
    if (pinConfirmation.trim() !== '121212' && pinConfirmation.trim().toUpperCase() !== 'RESET') {
      showToast('Masukkan PIN 121212 atau ketik RESET untuk konfirmasi.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      if (exportFirst) {
        // Trigger download backup first
        window.open('/api/export/piket?format=xlsx', '_blank');
        showToast('Mengunduh backup data Excel...', 'info');
        // Brief pause to ensure download starts
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const res = await DataService.resetAllPiketSubmissions('Admin (Panel Histori Piket)');
      showToast(res.message, 'success');
      setIsResetModalOpen(false);
      setPinConfirmation('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset hasil submit piket.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const activeSubmissionsCount = submissions.filter((s) => s.status === 'SUCCESS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Histori Penetapan Piket
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Riwayat seluruh transaksi penetapan piket guru kamar beserta manajemen reset data submit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            <Download className="h-3.5 w-3.5" />
            <span>Export XLSX</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setPinConfirmation('');
              setIsResetModalOpen(true);
            }}
            disabled={loading || activeSubmissionsCount === 0}
            className="font-semibold shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Hasil Submit</span>
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Kamar</th>
                <th>Guru yang Ditetapkan</th>
                <th>Operator</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Memuat riwayat penetapan...
                  </td>
                </tr>
              ) : submissions.length > 0 ? (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleString('id-ID')}
                    </td>
                    <td className="font-semibold text-slate-900">{sub.kamar?.nama_kamar || '-'}</td>
                    <td>
                      <div className="space-y-1 py-1">
                        {(sub.members || []).map((m, idx) => (
                          <div key={m.id || idx} className="text-xs flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span className="font-medium text-slate-900">{m.guru?.nama || 'Guru'}</span>
                            <span className="text-slate-400">({m.guru?.tahun || '-'})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{sub.submitted_by}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={sub.status} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    Belum ada riwayat transaksi penetapan piket yang tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Dialog
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Seluruh Hasil Submit Piket"
        description="Tindakan ini akan membatalkan seluruh status penetapan piket guru yang telah masuk sehingga seluruh kamar kembali ke status belum ditetapkan."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>Peringatan Reset Data Submit</span>
            </div>
            <p className="leading-relaxed">
              Terdapat <strong>{activeSubmissionsCount} penetapan kamar aktif</strong> yang akan dibatalkan/dikosongkan. Anda dapat memilih untuk <strong>Mengekspor Backup Excel terlebih dahulu</strong> atau langsung mereset.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Ketik PIN keamanan <span className="font-bold text-slate-900">&quot;121212&quot;</span> atau <span className="font-bold text-slate-900">&quot;RESET&quot;</span> untuk konfirmasi:
            </label>
            <Input
              type="text"
              placeholder="121212"
              value={pinConfirmation}
              onChange={(e) => setPinConfirmation(e.target.value)}
              autoFocus
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              Batal
            </Button>
            
            <button
              type="button"
              onClick={() => handleExecuteReset(false)}
              disabled={isResetting || (!pinConfirmation.trim())}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isResetting ? 'Mereset...' : 'Langsung Reset'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleExecuteReset(true)}
              disabled={isResetting || (!pinConfirmation.trim())}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{isResetting ? 'Memproses...' : 'Export Dulu & Reset'}</span>
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
