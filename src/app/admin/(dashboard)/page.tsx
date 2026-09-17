'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { KamarOverview, EventSettings } from '@/types';
import { DataService } from '@/lib/data-service';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { 
  Search, 
  Download, 
  RefreshCw, 
  DoorOpen, 
  Users, 
  ShieldCheck, 
  History,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { showToast } = useToast();
  const [kamarList, setKamarList] = useState<KamarOverview[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [kData, sData] = await Promise.all([
        DataService.getKamarOverviewList(),
        DataService.getSettings(),
      ]);
      setKamarList(kData);
      setSettings(sData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredKamar = useMemo(() => {
    return kamarList.filter((k) => {
      const matchSearch = k.nama_kamar.toLowerCase().includes(search.toLowerCase());
      const matchFilter = 
        statusFilter === 'ALL' || 
        (statusFilter === 'REVISI' && k.has_revisions) ||
        k.status_penetapan === statusFilter;
      return matchSearch && matchFilter;
    });
  }, [kamarList, search, statusFilter]);

  const stats = useMemo(() => {
    const totalKamar = kamarList.length;
    const piketRooms = kamarList.filter((k) => k.ada_piket);
    const nonPiketRooms = kamarList.filter((k) => !k.ada_piket).length;
    const totalGuru = kamarList.reduce((acc, k) => acc + k.total_guru, 0);
    const totalPiket = kamarList.reduce((acc, k) => acc + k.total_piket_terpilih, 0);
    const fulfilled = piketRooms.filter((k) => k.status_penetapan === 'Terpenuhi').length;
    const partial = piketRooms.filter((k) => k.status_penetapan === 'Sebagian').length;
    const pending = piketRooms.filter((k) => k.status_penetapan === 'Belum ditetapkan').length;
    const revisedCount = kamarList.filter((k) => k.has_revisions).length;

    return { totalKamar, totalGuru, totalPiket, fulfilled, partial, pending, nonPiketRooms, revisedCount };
  }, [kamarList]);

  const handleExport = () => {
    window.open(`/api/export/kamar?format=xlsx`, '_blank');
    showToast(`Mengekspor rekap kamar lengkap ke Excel (.xlsx)...`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Monitoring Panitia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pemantauan seluruh status kamar guru & deteksi revisi — {settings?.event_name || 'Ujian Muraja\'ah'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            className="shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export Excel (.xlsx)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Horizontal Compact KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs text-xs">
        <div>
          <span className="text-slate-500 font-medium">Total Kamar</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.totalKamar}</div>
        </div>
        <div>
          <span className="text-emerald-700 font-medium">Terpenuhi</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">{stats.fulfilled}</div>
        </div>
        <div>
          <span className="text-amber-700 font-medium">Sebagian / Belum</span>
          <div className="text-lg font-bold text-amber-800 mt-0.5">{stats.partial + stats.pending}</div>
        </div>
        <div>
          <span className="text-purple-700 font-medium">Ada Revisi / Edit</span>
          <div className="text-lg font-bold text-purple-800 mt-0.5">{stats.revisedCount}</div>
        </div>
        <div>
          <span className="text-slate-700 font-medium">Total Guru Piket</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.totalPiket}</div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kamar..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'REVISI', label: `Revisi (${stats.revisedCount})` },
            { id: 'Belum ditetapkan', label: 'Belum' },
            { id: 'Sebagian', label: 'Sebagian' },
            { id: 'Terpenuhi', label: 'Terpenuhi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kamar Monitoring Table with Revision Badges */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
                <th>Kamar</th>
                <th>Tugas Piket</th>
                <th>Anggota</th>
                <th>Limit Kuota</th>
                <th>Piket Terpilih</th>
                <th>Status</th>
                <th>Lencana Perubahan</th>
                <th>Terakhir Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Memuat data kamar...
                  </td>
                </tr>
              ) : filteredKamar.length > 0 ? (
                filteredKamar.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="font-semibold text-slate-900">{k.nama_kamar}</td>
                    <td>
                      <Badge variant={k.ada_piket ? 'neutral' : 'warning'} size="sm">
                        {k.ada_piket ? 'Ada Piket' : 'Non-Piket'}
                      </Badge>
                    </td>
                    <td>{k.total_guru} orang</td>
                    <td>{k.ada_piket ? `${k.limit_piket} orang` : '-'}</td>
                    <td className="font-medium">
                      {k.ada_piket ? (
                        <>
                          <span className={k.total_piket_terpilih >= k.limit_piket ? 'text-emerald-700 font-semibold' : ''}>
                            {k.total_piket_terpilih}
                          </span>{' '}
                          / {k.limit_piket}
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={k.status_penetapan} size="sm" />
                    </td>
                    <td>
                      {k.has_revisions ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
                          <History className="h-3 w-3" />
                          <span>Ada Perubahan ({k.revision_count}x edit)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs">
                      {k.updated_at ? new Date(k.updated_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada data kamar yang sesuai.
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
