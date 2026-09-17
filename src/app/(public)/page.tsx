'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Kamar, Guru, EventSettings } from '@/types';
import { DataService } from '@/lib/data-service';
import { parseUserFriendlyError } from '@/lib/errors';
import { GuruRow } from '@/components/kamar/guru-row';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { 
  Search, 
  DoorOpen, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  KeyRound,
  Trash2
} from 'lucide-react';

type WizardStep = 1 | 2 | 3;

export default function PublicFormWizardPage() {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [piketRooms, setPiketRooms] = useState<Kamar[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Selected Room Data
  const [currentRoom, setCurrentRoom] = useState<Kamar | null>(null);
  const [roomGurus, setRoomGurus] = useState<Guru[]>([]);
  const [selectedGuruIds, setSelectedGuruIds] = useState<string[]>([]);
  const [isPreviousSubmission, setIsPreviousSubmission] = useState(false);
  const [searchGuru, setSearchGuru] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [isRevisionSubmission, setIsRevisionSubmission] = useState(false);

  // PIN Reset Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isResettingWithPin, setIsResettingWithPin] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [st, rooms] = await Promise.all([
          DataService.getSettings(),
          DataService.getPiketActiveRooms(),
        ]);
        setSettings(st);
        setPiketRooms(rooms);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Filtered rooms for Step 1 search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return piketRooms;
    const q = searchQuery.toLowerCase();
    return piketRooms.filter((r) => r.nama_kamar.toLowerCase().includes(q));
  }, [piketRooms, searchQuery]);

  // Load room details when moving to Step 2
  const handleSelectRoomAndProceed = async (roomId: string) => {
    if (!roomId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await DataService.getKamarDetail(roomId);
      if (data) {
        setCurrentRoom(data.kamar);
        setRoomGurus(data.gurus);
        setSelectedRoomId(roomId);
        setSelectedGuruIds(data.currentSelectedGuruIds || []);
        setIsPreviousSubmission(data.isPreviousSubmission);
        setIsDropdownOpen(false);
        setCurrentStep(2);
      } else {
        setErrorMessage('Data kamar tidak ditemukan.');
      }
    } catch (err: any) {
      setErrorMessage(parseUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Filtered gurus for Step 2
  const filteredGurus = useMemo(() => {
    if (!searchGuru.trim()) return roomGurus;
    const q = searchGuru.toLowerCase();
    return roomGurus.filter((g) => g.nama.toLowerCase().includes(q));
  }, [roomGurus, searchGuru]);

  const selectedGurusList = useMemo(() => {
    return roomGurus.filter((g) => selectedGuruIds.includes(g.id));
  }, [roomGurus, selectedGuruIds]);

  const handleToggleGuru = (guruId: string) => {
    setErrorMessage(null);
    if (selectedGuruIds.includes(guruId)) {
      setSelectedGuruIds((prev) => prev.filter((id) => id !== guruId));
    } else {
      if (!currentRoom) return;
      if (selectedGuruIds.length >= currentRoom.limit_piket) {
        showToast(`Batas kuota piket kamar ini maksimal ${currentRoom.limit_piket} orang.`, 'error');
        return;
      }
      setSelectedGuruIds((prev) => [...prev, guruId]);
    }
  };

  const handleExecuteSubmit = async () => {
    if (!currentRoom || selectedGuruIds.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const clientRequestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

    try {
      const result = await DataService.submitPiket({
        kamar_id: currentRoom.id,
        guru_ids: selectedGuruIds,
        client_request_id: clientRequestId,
        submitted_by: 'Petugas Kamar',
        is_edit: isPreviousSubmission,
      });

      if (result.success) {
        setSubmittedCount(selectedGuruIds.length);
        setIsRevisionSubmission(Boolean(result.is_revision));
        setIsSuccess(true);
        showToast(result.message, 'success');
      }
    } catch (err: any) {
      const userFriendly = parseUserFriendlyError(err);
      setErrorMessage(userFriendly);
      showToast(userFriendly, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPinReset = async () => {
    if (!currentRoom) return;
    if (pinInput.trim() !== '121212') {
      showToast('PIN keamanan salah. Masukkan PIN 121212.', 'error');
      return;
    }

    setIsResettingWithPin(true);
    try {
      await DataService.resetKamarPiket(currentRoom.id, 'Public User via PIN 121212');
      setSelectedGuruIds([]);
      setIsPreviousSubmission(false);
      setIsPinModalOpen(false);
      setPinInput('');
      showToast(`Penetapan kamar ${currentRoom.nama_kamar} berhasil direset (dikosongkan).`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset penetapan kamar.', 'error');
    } finally {
      setIsResettingWithPin(false);
    }
  };

  const handleResetForm = () => {
    setCurrentStep(1);
    setSelectedRoomId('');
    setCurrentRoom(null);
    setRoomGurus([]);
    setSelectedGuruIds([]);
    setIsSuccess(false);
    setErrorMessage(null);
    setSearchQuery('');
    setSearchGuru('');
    setIsDropdownOpen(false);
  };

  if (loading && currentStep === 1 && !currentRoom) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <div className="h-6 w-48 skeleton-box mx-auto" />
        <div className="h-40 w-full skeleton-box rounded-xl" />
      </div>
    );
  }

  // Success Screen
  if (isSuccess && currentRoom) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isRevisionSubmission ? 'Revisi Penetapan Berhasil Disimpan' : 'Penetapan Piket Berhasil Disimpan'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kamar <span className="font-semibold text-slate-900">{currentRoom.nama_kamar}</span> telah berhasil ditetapkan sebanyak <span className="font-semibold text-slate-900">{submittedCount} orang guru piket</span>.
          </p>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs text-left space-y-1.5">
            <div className="font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Guru yang Ditetapkan:
            </div>
            {selectedGurusList.map((g, idx) => (
              <div key={g.id} className="flex items-center gap-2 text-slate-800">
                <span className="font-bold text-slate-400">{idx + 1}.</span>
                <span>{g.nama}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleResetForm}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Isi Form Kamar Lain</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Wizard Progress Steps Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          {/* Step 1 Tab */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
                currentStep >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={`font-semibold hidden sm:inline ${currentStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
              Pilih Kamar
            </span>
          </div>

          <div className={`h-px flex-1 mx-3 ${currentStep >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`} />

          {/* Step 2 Tab */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
                currentStep >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={`font-semibold hidden sm:inline ${currentStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
              Pilih Anggota Piket
            </span>
          </div>

          <div className={`h-px flex-1 mx-3 ${currentStep >= 3 ? 'bg-slate-900' : 'bg-slate-200'}`} />

          {/* Step 3 Tab */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
                currentStep === 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className={`font-semibold hidden sm:inline ${currentStep === 3 ? 'text-slate-900' : 'text-slate-500'}`}>
              Review & Submit
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Perhatian</span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: CARI & PILIH KAMAR (CLEAN DROPDOWN ONLY) */}
      {currentStep === 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Langkah 1 dari 3
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Pilih Kamar Guru
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ketik atau cari nama kamar tempat Anda bertugas piket pada ujian muraja&apos;ah akhir tahun.
            </p>
          </div>

          {/* Searchable Dropdown Input */}
          <div className="space-y-2 max-w-lg mx-auto">
            <label className="text-xs font-semibold text-slate-700 block">
              Cari & Pilih Kamar:
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Ketik nama kamar (contoh: Gontor, Gandy, dll)..."
                className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-2xs font-medium"
              />

              {/* Autocomplete Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(room.nama_kamar);
                          setIsDropdownOpen(false);
                          handleSelectRoomAndProceed(room.id);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <DoorOpen className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              Kamar {room.nama_kamar}
                            </span>
                            <span className="text-slate-400 text-xs ml-2">
                              (Limit {room.limit_piket} Guru)
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Tidak ada kamar yang sesuai dengan &quot;{searchQuery}&quot;.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PILIH ANGGOTA KAMAR */}
      {currentStep === 2 && currentRoom && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Step 2 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Langkah 2 dari 3
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Kamar {currentRoom.nama_kamar}
              </h2>
            </div>
            <div className="bg-slate-100 px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-800 self-start sm:self-auto">
              Batas Kuota: <span className="font-bold">{currentRoom.limit_piket} orang</span>
            </div>
          </div>

          {/* Previous Submission Info Banner with PIN Reset Option */}
          {isPreviousSubmission && (
            <div className="p-3.5 rounded-lg border border-sky-200 bg-sky-50 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Mode Edit Penetapan:</span> Kamar ini sebelumnya sudah pernah disubmit. Anda dapat langsung mengubah pilihan guru atau mereset penetapan kamar.
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPinInput('');
                  setIsPinModalOpen(true);
                }}
                className="shrink-0 h-7 text-[11px] bg-white text-rose-700 hover:bg-rose-50 border-rose-200 font-semibold"
              >
                <Trash2 className="h-3 w-3" />
                <span>Reset Penetapan (PIN)</span>
              </Button>
            </div>
          )}

          {/* Search Guru */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchGuru}
              onChange={(e) => setSearchGuru(e.target.value)}
              placeholder="Cari nama guru di kamar ini..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Gurus Selection List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredGurus.length > 0 ? (
              filteredGurus.map((guru) => {
                const isSelected = selectedGuruIds.includes(guru.id);
                const isQuotaFull = selectedGuruIds.length >= currentRoom.limit_piket;
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
              <div className="p-6 text-center text-xs text-slate-500 rounded-lg border border-slate-200">
                Tidak ada guru yang sesuai pencarian.
              </div>
            )}
          </div>

          {/* Step 2 Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ganti Kamar</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={selectedGuruIds.length === 0}
              onClick={() => setCurrentStep(3)}
            >
              <span>Lanjut ke Review ({selectedGuruIds.length} Dipilih)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & SUBMIT */}
      {currentStep === 3 && currentRoom && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Step 3 Header */}
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Langkah 3 dari 3
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Review & Konfirmasi Penetapan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Periksa kembali daftar guru yang akan ditetapkan sebelum menyimpan data.
            </p>
          </div>

          {/* Room Summary Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Kamar:</span>
              <span className="font-bold text-slate-900">Kamar {currentRoom.nama_kamar}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Batas Kuota:</span>
              <span className="font-semibold text-slate-900">{currentRoom.limit_piket} orang</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Jumlah Dipilih:</span>
              <span className="font-bold text-emerald-700">{selectedGuruIds.length} orang</span>
            </div>
          </div>

          {/* Selected Gurus List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Daftar Guru Terpilih ({selectedGurusList.length} orang):
            </span>
            <div className="space-y-2">
              {selectedGurusList.map((g, idx) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{g.nama}</div>
                      <div className="text-[11px] text-slate-500">Tahun: {g.tahun}</div>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali Edit</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecuteSubmit}
              isLoading={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isPreviousSubmission ? 'Simpan Revisi Penetapan' : 'Simpan Penetapan Piket'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* PIN Verification Modal to Reset Room */}
      <Dialog
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={`Reset Penetapan: Kamar ${currentRoom?.nama_kamar}`}
        description="Masukkan PIN keamanan untuk mengosongkan penetapan piket pada kamar ini kembali ke status awal."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Verifikasi PIN Keamanan</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Gunakan PIN <strong>121212</strong> untuk mereset penetapan guru pada kamar ini.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Masukkan PIN:
            </label>
            <Input
              type="password"
              placeholder="121212"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              maxLength={6}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPinModalOpen(false)}
              disabled={isResettingWithPin}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmPinReset}
              disabled={isResettingWithPin || pinInput.length === 0}
            >
              {isResettingWithPin ? 'Mereset...' : 'Konfirmasi Reset'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
