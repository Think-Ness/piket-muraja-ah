'use client';

import React, { useEffect, useState } from 'react';
import { PiketSubmission } from '@/types';
import { DataService } from '@/lib/data-service';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Download, RefreshCw, ShieldCheck, User } from 'lucide-react';

export default function AdminPiketPage() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<PiketSubmission[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Histori Penetapan Piket
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Riwayat seluruh transaksi penetapan piket guru kamar beserta catatan audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            <Download className="h-3.5 w-3.5" />
            <span>Export XLSX</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
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
    </div>
  );
}
