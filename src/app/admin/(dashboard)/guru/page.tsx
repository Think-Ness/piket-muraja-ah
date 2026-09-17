'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Guru, Kamar } from '@/types';
import { DataService } from '@/lib/data-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminGuruPage() {
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [kamarList, setKamarList] = useState<Kamar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKamarId, setSelectedKamarId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, kData] = await Promise.all([
        DataService.getGuruList({ limit: 1000 }),
        DataService.getKamarOverviewList(),
      ]);
      setGurus(gData.gurus);
      setKamarList(kData);
    } catch (err) {
      console.error('Error loading gurus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGurus = useMemo(() => {
    return gurus.filter((g) => {
      const matchSearch = g.nama.toLowerCase().includes(search.toLowerCase());
      const matchKamar = selectedKamarId === 'ALL' || g.kamar_id === selectedKamarId;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AKTIF' && g.aktif) ||
        (statusFilter === 'NONAKTIF' && !g.aktif);
      return matchSearch && matchKamar && matchStatus;
    });
  }, [gurus, search, selectedKamarId, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGurus.length / itemsPerPage));
  const paginatedGurus = filteredGurus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Master Data Guru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar seluruh guru dan penugasan kamar dari hasil import Excel.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama guru..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        {/* Filter Kamar */}
        <div>
          <select
            value={selectedKamarId}
            onChange={(e) => {
              setSelectedKamarId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="ALL">Semua Kamar ({kamarList.length})</option>
            {kamarList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kamar}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Hanya Aktif</option>
            <option value="NONAKTIF">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
                <th className="w-12">RNK</th>
                <th>Nama Guru</th>
                <th>Kamar</th>
                <th>Tahun</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Memuat data guru...
                  </td>
                </tr>
              ) : paginatedGurus.length > 0 ? (
                paginatedGurus.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-slate-500 font-mono text-xs">{g.rnk || '-'}</td>
                    <td className="font-semibold text-slate-900">{g.nama}</td>
                    <td>{g.kamar?.nama_kamar || '-'}</td>
                    <td className="text-slate-500 text-xs">{g.tahun}</td>
                    <td>
                      <Badge variant={g.aktif ? 'success' : 'neutral'} size="sm">
                        {g.aktif ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada guru yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredGurus.length)} dari {filteredGurus.length} guru
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium">
              Hal {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
