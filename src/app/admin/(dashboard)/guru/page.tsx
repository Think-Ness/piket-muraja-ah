'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Guru, Kamar } from '@/types';
import { DataService } from '@/lib/data-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';

export default function AdminGuruPage() {
  const { showToast } = useToast();
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [kamarList, setKamarList] = useState<Kamar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKamarId, setSelectedKamarId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add Guru Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '',
    kamar_id: '',
    rnk: '',
    tahun: '1447-1448',
    aktif: true,
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit / Transfer Room Guru Modal State
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [editForm, setEditForm] = useState({
    nama: '',
    kamar_id: '',
    rnk: '',
    tahun: '1447-1448',
    aktif: true,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Guru Modal State
  const [deletingGuru, setDeletingGuru] = useState<Guru | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

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

  // Handlers for Add Guru
  const handleOpenAddModal = () => {
    setAddForm({
      nama: '',
      kamar_id: kamarList[0]?.id || '',
      rnk: String(gurus.length + 1),
      tahun: '1447-1448',
      aktif: true,
    });
    setIsAddModalOpen(true);
  };

  const handleExecuteAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nama.trim()) {
      showToast('Nama guru tidak boleh kosong.', 'error');
      return;
    }
    if (!addForm.kamar_id) {
      showToast('Kamar harus dipilih.', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const newGuru = await DataService.createGuru({
        nama: addForm.nama,
        kamar_id: addForm.kamar_id,
        rnk: addForm.rnk ? parseInt(addForm.rnk, 10) : null,
        tahun: addForm.tahun,
        aktif: addForm.aktif,
      });

      showToast(`Guru ${newGuru.nama} berhasil ditambahkan ke ${newGuru.kamar?.nama_kamar || 'kamar'}.`, 'success');
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan guru.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handlers for Edit Guru / Pindah Kamar
  const handleOpenEditModal = (guru: Guru) => {
    setEditingGuru(guru);
    setEditForm({
      nama: guru.nama,
      kamar_id: guru.kamar_id,
      rnk: guru.rnk ? String(guru.rnk) : '',
      tahun: guru.tahun || '1447-1448',
      aktif: guru.aktif ?? true,
    });
  };

  const handleExecuteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;
    if (!editForm.nama.trim()) {
      showToast('Nama guru tidak boleh kosong.', 'error');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const isRoomChanged = editForm.kamar_id !== editingGuru.kamar_id;
      const updated = await DataService.updateGuru(editingGuru.id, {
        nama: editForm.nama,
        kamar_id: editForm.kamar_id,
        rnk: editForm.rnk ? parseInt(editForm.rnk, 10) : null,
        tahun: editForm.tahun,
        aktif: editForm.aktif,
      });

      showToast(
        isRoomChanged
          ? `Perpindahan kamar untuk ${updated.nama} berhasil dipindahkan ke ${updated.kamar?.nama_kamar || 'kamar baru'}.`
          : `Data guru ${updated.nama} berhasil diperbarui.`,
        'success'
      );
      setEditingGuru(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui data guru.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handlers for Delete Guru
  const handleOpenDeleteModal = (guru: Guru) => {
    setDeletingGuru(guru);
  };

  const handleExecuteDelete = async () => {
    if (!deletingGuru) return;
    setIsSubmittingDelete(true);
    try {
      const res = await DataService.deleteGuru(deletingGuru.id, 'Admin');
      showToast(res.message, 'success');
      setDeletingGuru(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus guru.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Master Data Guru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data guru, tambah guru baru, edit, hapus, atau atur perpindahan kamar tanpa perlu import ulang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
            <UserPlus className="h-3.5 w-3.5" />
            <span>Tambah Guru</span>
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
                <th>Kamar Saat Ini</th>
                <th>Tahun</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Memuat data guru...
                  </td>
                </tr>
              ) : paginatedGurus.length > 0 ? (
                paginatedGurus.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-slate-500 font-mono text-xs">{g.rnk || '-'}</td>
                    <td className="font-semibold text-slate-900">{g.nama}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {g.kamar?.nama_kamar || '-'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">{g.tahun}</td>
                    <td>
                      <Badge variant={g.aktif ? 'success' : 'neutral'} size="sm">
                        {g.aktif ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(g)}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit / Pindah</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(g)}
                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
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

      {/* Add Guru Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Data Guru Baru"
        description="Tambahkan guru baru ke dalam sistem penugasan kamar."
        maxWidth="md"
      >
        <form onSubmit={handleExecuteAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Guru *</label>
            <Input
              type="text"
              placeholder="Contoh: Ustadz Ahmad Fauzi"
              value={addForm.nama}
              onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penugasan Kamar *</label>
              <select
                value={addForm.kamar_id}
                onChange={(e) => setAddForm({ ...addForm, kamar_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              >
                <option value="" disabled>Pilih Kamar</option>
                {kamarList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kamar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. RNK / Urutan</label>
              <Input
                type="number"
                placeholder="1, 2, 3..."
                value={addForm.rnk}
                onChange={(e) => setAddForm({ ...addForm, rnk: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
              <Input
                type="text"
                value={addForm.tahun}
                onChange={(e) => setAddForm({ ...addForm, tahun: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan</label>
              <select
                value={addForm.aktif ? 'true' : 'false'}
                onChange={(e) => setAddForm({ ...addForm, aktif: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmittingAdd}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingAdd}
            >
              {isSubmittingAdd ? 'Menyimpan...' : 'Simpan Guru'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit / Transfer Room Guru Modal */}
      <Dialog
        isOpen={Boolean(editingGuru)}
        onClose={() => setEditingGuru(null)}
        title={`Edit Data Guru: ${editingGuru?.nama}`}
        description="Perbarui informasi guru atau pindahkan penugasan ke kamar lain."
        maxWidth="md"
      >
        {editingGuru && (
          <form onSubmit={handleExecuteEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Guru *</label>
              <Input
                type="text"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                required
              />
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Perpindahan Kamar</span>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Pilih kamar baru jika ustadz/guru ini dipindahkan tugasnya ke kamar lain.
              </p>
              <select
                value={editForm.kamar_id}
                onChange={(e) => setEditForm({ ...editForm, kamar_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white rounded-md border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                required
              >
                {kamarList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kamar} {k.id === editingGuru.kamar_id ? '(Kamar Saat Ini)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. RNK / Urutan</label>
                <Input
                  type="number"
                  value={editForm.rnk}
                  onChange={(e) => setEditForm({ ...editForm, rnk: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <Input
                  type="text"
                  value={editForm.tahun}
                  onChange={(e) => setEditForm({ ...editForm, tahun: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan</label>
              <select
                value={editForm.aktif ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, aktif: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingGuru(null)}
                disabled={isSubmittingEdit}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={Boolean(deletingGuru)}
        onClose={() => setDeletingGuru(null)}
        title={`Hapus Guru: ${deletingGuru?.nama}`}
        description="Apakah Anda yakin ingin menghapus data guru ini dari sistem?"
        maxWidth="sm"
      >
        {deletingGuru && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Konfirmasi Penghapusan</span>
              </div>
              <p className="leading-relaxed">
                Guru <strong className="font-semibold text-rose-950">{deletingGuru.nama}</strong> ({deletingGuru.kamar?.nama_kamar || 'Kamar'}) akan dihapus dari daftar master guru dan riwayat penetapan aktif terkait.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingGuru(null)}
                disabled={isSubmittingDelete}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExecuteDelete}
                disabled={isSubmittingDelete}
              >
                {isSubmittingDelete ? 'Menghapus...' : 'Ya, Hapus Guru'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
