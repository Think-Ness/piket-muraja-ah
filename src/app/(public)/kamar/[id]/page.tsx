'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Kamar, Guru } from '@/types';
import { DataService } from '@/lib/data-service';
import { parseUserFriendlyError } from '@/lib/errors';
import { GuruRow } from '@/components/kamar/guru-row';
import { StickyBar } from '@/components/kamar/sticky-bar';
import { ConfirmationModal } from '@/components/kamar/confirmation-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export default function DetailKamarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [kamar, setKamar] = useState<Kamar | null>(null);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [activePiketCount, setActivePiketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuruIds, setSelectedGuruIds] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await DataService.getKamarDetail(resolvedParams.id);
      if (data) {
        setKamar(data.kamar);
        setGurus(data.gurus);
        setActivePiketCount(data.activePiketCount);
      } else {
        setErrorMessage('Data kamar tidak ditemukan.');
      }
    } catch (err: any) {
      setErrorMessage(parseUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const filteredGurus = useMemo(() => {
    if (!search.trim()) return gurus;
    const q = search.toLowerCase();
    return gurus.filter((g) => g.nama.toLowerCase().includes(q));
  }, [gurus, search]);

  const selectedGurusList = useMemo(() => {
    return gurus.filter((g) => selectedGuruIds.includes(g.id));
  }, [gurus, selectedGuruIds]);

  const remainingQuota = useMemo(() => {
    if (!kamar) return 0;
    return Math.max(0, kamar.limit_piket - activePiketCount);
  }, [kamar, activePiketCount]);

  const handleToggleGuru = (guruId: string) => {
    setErrorMessage(null);
    if (selectedGuruIds.includes(guruId)) {
      setSelectedGuruIds((prev) => prev.filter((id) => id !== guruId));
    } else {
      if (!kamar) return;
      if (selectedGuruIds.length >= remainingQuota) {
        showToast(`Batas kuota piket kamar ini maksimal ${kamar.limit_piket} orang.`, 'error');
        return;
      }
      setSelectedGuruIds((prev) => [...prev, guruId]);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!kamar || selectedGuruIds.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Generate client_request_id for idempotency
    const clientRequestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const result = await DataService.submitPiket({
        kamar_id: kamar.id,
        guru_ids: selectedGuruIds,
        client_request_id: clientRequestId,
        submitted_by: 'Petugas Panitia',
      });

      if (result.success) {
        setSubmittedCount(selectedGuruIds.length);
        setIsSuccess(true);
        setIsModalOpen(false);
        showToast(result.message || 'Penetapan berhasil disimpan.', 'success');
      }
    } catch (err: any) {
      const userFriendly = parseUserFriendlyError(err);
      setErrorMessage(userFriendly);
      setIsModalOpen(false);
      showToast(userFriendly, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="h-6 w-28 skeleton-box" />
        <div className="h-28 w-full skeleton-box rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 w-full skeleton-box rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!kamar) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-3 text-sm font-semibold text-red-900">Kamar Tidak Ditemukan</h2>
        <p className="mt-1 text-xs text-red-700">Data kamar yang Anda cari tidak tersedia dalam sistem.</p>
        <Link href="/" className="inline-block mt-4">
          <Button variant="outline" size="sm">Kembali ke Daftar Kamar</Button>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Penetapan Berhasil Disimpan
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kamar <span className="font-semibold text-slate-900">{kamar.nama_kamar}</span> telah berhasil ditetapkan sebanyak <span className="font-semibold text-slate-900">{submittedCount} orang guru piket</span>.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                Kembali ke Daftar Kamar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsSuccess(false);
                setSelectedGuruIds([]);
                loadData();
              }}
            >
              Lihat Kembali Kamar Ini
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Kamar</span>
        </Link>
      </div>

      {/* Room Detail Header Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Detail Penetapan Piket
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {kamar.nama_kamar}
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Anggota:</span>
              <div className="text-sm font-bold text-slate-900">{gurus.length} guru</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 font-medium">Limit Kuota:</span>
              <div className="text-sm font-bold text-slate-900">{kamar.limit_piket} orang</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 font-medium">Terpilih:</span>
              <div className="text-sm font-bold text-slate-900">
                {selectedGuruIds.length} / {remainingQuota}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concurrency or System Error Banner */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-3 text-xs text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Penetapan tidak dapat diproses</p>
              <p className="mt-0.5 text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="shrink-0 bg-white border-red-200 text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Muat Data Terbaru</span>
          </Button>
        </div>
      )}

      {/* Search & Selection Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama guru..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 self-center font-medium">
          Menampilkan {filteredGurus.length} dari {gurus.length} guru
        </div>
      </div>

      {/* Gurus Selection List */}
      <div className="space-y-2.5">
        {filteredGurus.length > 0 ? (
          filteredGurus.map((guru) => {
            const isSelected = selectedGuruIds.includes(guru.id);
            const isQuotaFull = selectedGuruIds.length >= remainingQuota;
            const isDisabled = !isSelected && isQuotaFull;

            return (
              <GuruRow
                key={guru.id}
                guru={guru}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onToggle={handleToggleGuru}
              />
            );
          })
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Tidak ada guru yang sesuai dengan pencarian &quot;{search}&quot;.
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary & Proceed Bar */}
      <StickyBar
        selectedCount={selectedGuruIds.length}
        limitPiket={kamar.limit_piket}
        onProceed={() => setIsModalOpen(true)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={isSubmitting}
        kamar={kamar}
        selectedGurus={selectedGurusList}
      />
    </div>
  );
}
