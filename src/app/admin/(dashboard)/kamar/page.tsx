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
  ToggleRight
} from 'lucide-react';

export default function AdminKamarPage() {
  const { showToast } = useToast();
  const [kamarList, setKamarList] = useState<KamarOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Limit Drawer State
  const [editingKamar, setEditingKamar] = useState<KamarOverview | null>(null);
  const [newLimit, setNewLimit] = useState<number>(1);
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

  const filteredKamar = kamarList.filter((k) =>
    k.nama_kamar.toLowerCase().includes(search.toLowerCase())
  );

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
    const requiredText = resettingKamar.nama_kamar.toUpperCase();
    if (typedConfirmation.trim().toUpperCase() !== requiredText) {
      showToast(`Ketik "${requiredText}" dengan tepat untuk konfirmasi.`, 'error');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Kamar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur status tugas piket per kamar, batas kuota limit, dan periksa riwayat revisi penetapan.
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
          Total: {filteredKamar.length} kamar
        </div>
      </div>

      {/* Kamar Management Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
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
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Memuat data kamar...
                  </td>
                </tr>
              ) : filteredKamar.length > 0 ? (
                filteredKamar.map((k, idx) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-slate-400 text-xs w-10">{idx + 1}</td>
                    <td className="font-semibold text-slate-900">{k.nama_kamar}</td>
                    <td>
                      <button
                        onClick={() => handleToggleAdaPiket(k)}
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
                    <td>{k.total_guru} orang</td>
                    <td className="font-semibold">
                      {k.ada_piket ? `${k.limit_piket} orang` : '-'}
                    </td>
                    <td>
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
                          onClick={() => setInspectingRevisionKamar(k)}
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
                        onClick={() => handleOpenEditLimit(k)}
                        disabled={!k.ada_piket}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit Limit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenReset(k)}
                        disabled={k.total_piket_terpilih === 0}
                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada kamar ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <span className="font-bold text-purple-900 uppercase tracking-wider">
                    Revisi Terakhir
                  </span>
                  <Badge variant="accent" size="sm">Versi {inspectingRevisionKamar.revision_count + 1}</Badge>
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

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInspectingRevisionKamar(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit Limit Drawer */}
      <Drawer
        isOpen={Boolean(editingKamar)}
        onClose={() => setEditingKamar(null)}
        title="Edit Limit Kuota Piket"
        description="Ubah jumlah maksimal guru yang dapat piket untuk kamar ini."
        width="md"
      >
        {editingKamar && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Kamar:</span>
                <span className="font-semibold text-slate-900">{editingKamar.nama_kamar}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Anggota:</span>
                <span className="font-semibold text-slate-900">{editingKamar.total_guru} orang</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Piket Aktif Saat Ini:</span>
                <span className="font-semibold text-slate-900">{editingKamar.total_piket_terpilih} orang</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Limit Piket Baru
              </label>
              <Input
                type="number"
                min={0}
                max={20}
                value={newLimit}
                onChange={(e) => setNewLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            {/* Warning if new limit < active piket count */}
            {newLimit < editingKamar.total_piket_terpilih && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Perhatian:</span> Limit baru ({newLimit}) berada di bawah jumlah piket aktif saat ini ({editingKamar.total_piket_terpilih}). Data piket yang sudah ada tidak akan dihapus otomatis.
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditingKamar(null)}
                disabled={isSavingLimit}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveLimit}
                isLoading={isSavingLimit}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reset Piket Confirmation Modal */}
      <Dialog
        isOpen={Boolean(resettingKamar)}
        onClose={() => setResettingKamar(null)}
        title="Reset Penetapan Piket Kamar"
        description="Tindakan ini akan membatalkan seluruh status piket aktif pada kamar yang dipilih."
        maxWidth="md"
      >
        {resettingKamar && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 space-y-1 leading-relaxed">
              <p className="font-semibold">Peringatan Operasional:</p>
              <p>
                Anda akan membatalkan penetapan piket untuk kamar{' '}
                <span className="font-bold underline">{resettingKamar.nama_kamar}</span>.
                Data histori tetap tersimpan di database untuk keperluan audit log.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ketik <span className="font-bold text-slate-900 uppercase">{resettingKamar.nama_kamar}</span> untuk melanjutkan konfirmasi:
              </label>
              <Input
                type="text"
                placeholder={resettingKamar.nama_kamar.toUpperCase()}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => setResettingKamar(null)}
                disabled={isResetting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmReset}
                isLoading={isResetting}
                disabled={
                  typedConfirmation.trim().toUpperCase() !== resettingKamar.nama_kamar.toUpperCase() ||
                  isResetting
                }
              >
                Reset Penetapan
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
