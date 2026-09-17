'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KamarOverview } from '@/types';
import { DataService } from '@/lib/data-service';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Drawer } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/toast';
import { 
  Search, 
  Edit, 
  RotateCcw, 
  AlertTriangle, 
  History,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

export default function AdminKamarPage() {
  const { showToast } = useToast();
  const [kamarList, setKamarList] = useState<KamarOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Multi-selection state for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'SELECT' | 'DESELECT' | null>(null);

  const [isBulkLimitModalOpen, setIsBulkLimitModalOpen] = useState(false);
  const [bulkNewLimit, setBulkNewLimit] = useState<number>(2);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Single Edit Limit Drawer State
  const [editingKamar, setEditingKamar] = useState<KamarOverview | null>(null);
  const [newLimit, setNewLimit] = useState<number>(2);
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  // Compare Revision Changes Modal State
  const [inspectingRevisionKamar, setInspectingRevisionKamar] = useState<KamarOverview | null>(null);

  // Reset Confirmation Modal State
  const [resettingKamar, setResettingKamar] = useState<KamarOverview | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getKamarOverviewList();
      setKamarList(data);
    } catch (err) {
      console.error('Error loading kamar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global mouseup to cancel dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const filteredKamar = kamarList.filter((k) =>
    k.nama_kamar.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filteredKamar.length > 0 && filteredKamar.every((k) => selectedIds.includes(k.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKamar.map((k) => k.id));
    }
  };

  const handleRowMouseDown = (id: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedIdx !== null) {
      const start = Math.min(lastSelectedIdx, index);
      const end = Math.max(lastSelectedIdx, index);
      const rangeIds = filteredKamar.slice(start, end + 1).map((k) => k.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
      setLastSelectedIdx(index);
      return;
    }

    const isCurrentlySelected = selectedIds.includes(id);
    const mode = isCurrentlySelected ? 'DESELECT' : 'SELECT';
    setIsDragging(true);
    setDragMode(mode);
    setLastSelectedIdx(index);

    if (mode === 'SELECT') {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleRowMouseEnter = (id: string) => {
    if (!isDragging || !dragMode) return;
    if (dragMode === 'SELECT') {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else if (dragMode === 'DESELECT') {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleToggleAdaPiket = async (k: KamarOverview) => {
    const nextState = !k.ada_piket;
    try {
      await DataService.toggleKamarAdaPiket(k.id, nextState, 'Admin');
      showToast(`Status piket kamar ${k.nama_kamar} diubah menjadi: ${nextState ? 'Ada Piket' : 'Non-Piket'}.`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status piket kamar.', 'error');
    }
  };

  // Bulk Actions
  const handleExecuteBulkLimit = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await DataService.bulkUpdateKamarLimit(selectedIds, bulkNewLimit, 'Admin');
      showToast(`Limit kuota ${selectedIds.length} kamar berhasil diubah menjadi ${bulkNewLimit} orang.`, 'success');
      setIsBulkLimitModalOpen(false);
      setSelectedIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah limit masal.', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleExecuteBulkAdaPiket = async (adaPiket: boolean) => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await DataService.bulkToggleKamarAdaPiket(selectedIds, adaPiket, 'Admin');
      showToast(`${selectedIds.length} kamar berhasil diubah menjadi: ${adaPiket ? 'Ada Piket' : 'Non-Piket'}.`, 'success');
      setSelectedIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status piket masal.', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleOpenEditLimit = (k: KamarOverview) => {
    setEditingKamar(k);
    setNewLimit(k.limit_piket);
  };

  const handleSaveLimit = async () => {
    if (!editingKamar) return;
    setIsSavingLimit(true);
    try {
      await DataService.updateKamarLimit(editingKamar.id, newLimit, 'Admin');
      showToast(`Limit kamar ${editingKamar.nama_kamar} berhasil diubah menjadi ${newLimit}.`, 'success');
      setEditingKamar(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan limit.', 'error');
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleOpenReset = (k: KamarOverview) => {
    setResettingKamar(k);
    setTypedConfirmation('');
  };

  const handleConfirmReset = async () => {
    if (!resettingKamar) return;
    const input = typedConfirmation.trim().toUpperCase();
    const requiredText = resettingKamar.nama_kamar.toUpperCase();
    if (input !== '121212' && input !== requiredText) {
      showToast(`Masukkan PIN 121212 atau ketik "${requiredText}" untuk konfirmasi.`, 'error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await DataService.resetKamarPiket(resettingKamar.id, 'Admin');
      showToast(res.message, 'success');
      setResettingKamar(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset kamar.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Kamar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur status tugas piket per kamar, batas kuota limit, drag untuk pilih masal, dan periksa riwayat revisi penetapan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/import">
            <Button variant="primary" size="sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Import Excel</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="rounded-xl border border-slate-900 bg-slate-900 text-white p-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span className="font-semibold">Kamar Terpilih untuk Tindakan Masal:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkLimitModalOpen(true)}
              disabled={isProcessingBulk}
              className="h-8 px-3 text-xs bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Ubah Limit Masal</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExecuteBulkAdaPiket(true)}
              disabled={isProcessingBulk}
              className="h-8 px-3 text-xs bg-emerald-700 hover:bg-emerald-600 text-white border-none font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Set Ada Piket</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExecuteBulkAdaPiket(false)}
              disabled={isProcessingBulk}
              className="h-8 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-none font-semibold"
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              <span>Tiadakan Piket</span>
            </Button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Batal Pilih"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kamar..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: {filteredKamar.length} kamar (Tahan drag/shift untuk pilih banyak)
        </div>
      </div>

      {/* Kamar Management Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
                <th className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    title="Pilih Semua Kamar"
                  />
                </th>
                <th>No</th>
                <th>Nama Kamar</th>
                <th>Tugas Piket</th>
                <th>Anggota</th>
                <th>Limit Kuota</th>
                <th>Piket Terpilih</th>
                <th>Lencana Perubahan</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Memuat data kamar...
                  </td>
                </tr>
              ) : filteredKamar.length > 0 ? (
                filteredKamar.map((k, idx) => {
                  const isSelected = selectedIds.includes(k.id);
                  return (
                    <tr
                      key={k.id}
                      onMouseEnter={() => handleRowMouseEnter(k.id)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer select-none ${
                        isSelected ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      <td
                        className="text-center py-2"
                        onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by onMouseDown & drag
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      <td 
                        className="text-slate-400 text-xs w-8"
                        onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)}
                      >
                        {idx + 1}
                      </td>
                      <td 
                        className="font-semibold text-slate-900"
                        onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)}
                      >
                        {k.nama_kamar}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAdaPiket(k);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                            k.ada_piket
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Klik untuk mengubah status tugas piket kamar ini"
                        >
                          {k.ada_piket ? 'Ada Piket' : 'Non-Piket'}
                        </button>
                      </td>
                      <td onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)}>{k.total_guru} orang</td>
                      <td onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)} className="font-semibold">
                        {k.ada_piket ? `${k.limit_piket} orang` : '-'}
                      </td>
                      <td onMouseDown={(e) => handleRowMouseDown(k.id, idx, e)}>
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
                        {k.has_revisions ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingRevisionKamar(k);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
                          >
                            <History className="h-3 w-3" />
                            <span>Ada Revisi ({k.revision_count}x edit)</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditLimit(k);
                          }}
                          disabled={!k.ada_piket}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit Limit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReset(k);
                          }}
                          disabled={k.total_piket_terpilih === 0}
                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada kamar ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Limit Modal */}
      <Dialog
        isOpen={isBulkLimitModalOpen}
        onClose={() => setIsBulkLimitModalOpen(false)}
        title="Ubah Kuota Limit Piket Masal"
        description={`Terapkan jumlah limit kuota piket guru untuk ${selectedIds.length} kamar terpilih sekaligus.`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Batas Kuota Baru (Orang per Kamar):
            </label>
            <div className="flex items-center gap-2 mb-3">
              <Input
                type="number"
                min={0}
                max={100}
                value={bulkNewLimit}
                onChange={(e) => setBulkNewLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="font-bold text-sm"
              />
            </div>
            <div className="text-[11px] text-slate-500 mb-1.5">Pilihan Cepat:</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBulkNewLimit(val)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                    bulkNewLimit === val
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-600">
            Perubahan ini akan otomatis memperbarui batas kuota pada {selectedIds.length} kamar terpilih di database.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkLimitModalOpen(false)}
              disabled={isProcessingBulk}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteBulkLimit}
              disabled={isProcessingBulk}
            >
              {isProcessingBulk ? 'Menyimpan...' : `Terapkan (${bulkNewLimit} Orang)`}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Inspect Revision Comparison Modal */}
      <Dialog
        isOpen={Boolean(inspectingRevisionKamar)}
        onClose={() => setInspectingRevisionKamar(null)}
        title={`Riwayat Revisi: Kamar ${inspectingRevisionKamar?.nama_kamar}`}
        description="Perbandingan daftar guru yang ditetapkan saat submit pertama kali dan saat revisi/edit terakhir."
        maxWidth="lg"
      >
        {inspectingRevisionKamar && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Initial Submission Card */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Submit Pertama Kali
                  </span>
                  <Badge variant="neutral" size="sm">Versi 1</Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  Waktu: {inspectingRevisionKamar.initial_submitted_at ? new Date(inspectingRevisionKamar.initial_submitted_at).toLocaleString('id-ID') : '-'}
                </div>
                <div className="space-y-1 pt-1">
                  {(inspectingRevisionKamar.initial_guru_names || []).map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latest Revision Card */}
              <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="font-bold text-purple-900 uppercase tracking-wider">
                    Revisi Terakhir
                  </span>
                  <Badge variant="accent" size="sm">
                    Revisi ke-{inspectingRevisionKamar.revision_count}
                  </Badge>
                </div>
                <div className="text-[11px] text-purple-700">
                  Waktu: {inspectingRevisionKamar.latest_submitted_at ? new Date(inspectingRevisionKamar.latest_submitted_at).toLocaleString('id-ID') : '-'}
                </div>
                <div className="space-y-1 pt-1">
                  {(inspectingRevisionKamar.latest_guru_names || []).map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-purple-950 font-semibold">
                      <span className="text-purple-400">{i + 1}.</span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingRevisionKamar(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Single Edit Limit Drawer */}
      <Drawer
        isOpen={Boolean(editingKamar)}
        onClose={() => setEditingKamar(null)}
        title={`Edit Limit Kuota Piket: Kamar ${editingKamar?.nama_kamar}`}
        description="Atur jumlah maksimal guru yang dapat piket untuk kamar ini."
      >
        {editingKamar && (
          <div className="space-y-5 text-xs">
            <div className="space-y-3">
              <label className="font-semibold text-slate-700 block">
                Batas Kuota Limit (Orang)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newLimit}
                onChange={(e) => setNewLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="font-bold text-sm"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewLimit(val)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
                      newLimit === val
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Kamar ini saat ini memiliki {editingKamar.total_piket_terpilih} guru piket terpilih dari total {editingKamar.total_guru} anggota.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingKamar(null)}
                disabled={isSavingLimit}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveLimit}
                disabled={isSavingLimit}
              >
                {isSavingLimit ? 'Menyimpan...' : 'Simpan Limit'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Destructive Reset Confirmation Modal */}
      <Dialog
        isOpen={Boolean(resettingKamar)}
        onClose={() => setResettingKamar(null)}
        title={`Reset Penetapan Piket: Kamar ${resettingKamar?.nama_kamar}`}
        description="Tindakan ini akan membatalkan seluruh status guru yang telah piket pada kamar ini sehingga kamar kembali menjadi belum ditetapkan."
        maxWidth="md"
      >
        {resettingKamar && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>Peringatan Keamanan</span>
              </div>
              <p className="leading-relaxed">
                Tindakan ini bersifat permanen. Data riwayat penetapan untuk kamar ini akan diarsipkan sebagai dibatalkan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Masukkan PIN keamanan <span className="font-bold text-slate-900">&quot;121212&quot;</span> atau nama kamar untuk melanjutkan:
              </label>
              <Input
                type="text"
                placeholder="121212"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResettingKamar(null)}
                disabled={isResetting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReset}
                disabled={
                  isResetting ||
                  (typedConfirmation.trim().toUpperCase() !== '121212' &&
                    typedConfirmation.trim().toUpperCase() !== resettingKamar.nama_kamar.toUpperCase())
                }
              >
                {isResetting ? 'Mereset...' : 'Ya, Reset Kamar'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
