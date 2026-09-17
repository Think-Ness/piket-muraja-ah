'use client';

import React, { useEffect, useState } from 'react';
import { EventSettings, FormStatus } from '@/types';
import { DataService } from '@/lib/data-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { 
  SlidersHorizontal, 
  Save, 
  Lock, 
  Shield, 
  MessageCircle, 
  CalendarClock 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [committeeName, setCommitteeName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [formStatus, setFormStatus] = useState<FormStatus>('OPEN');

  // WhatsApp & CP Fields
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappLabel, setWhatsappLabel] = useState('');

  // Schedule Fields
  const [waktuBuka, setWaktuBuka] = useState('');
  const [waktuTutup, setWaktuTutup] = useState('');

  // Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await DataService.getSettings();
      setSettings(data);
      setEventName(data.event_name);
      setEventSubtitle(data.event_subtitle);
      setCommitteeName(data.committee_name);
      setAcademicYear(data.academic_year);
      setFormStatus(data.form_status);
      setWhatsappNumber(data.whatsapp_number || '6281234567890');
      setWhatsappLabel(data.whatsapp_label || 'Hubungi Panitia Piket');
      setWaktuBuka(data.waktu_buka ? new Date(data.waktu_buka).toISOString().slice(0, 16) : '');
      setWaktuTutup(data.waktu_tutup ? new Date(data.waktu_tutup).toISOString().slice(0, 16) : '');
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await DataService.updateSettings(
        {
          event_name: eventName,
          event_subtitle: eventSubtitle,
          committee_name: committeeName,
          academic_year: academicYear,
          form_status: formStatus,
          whatsapp_number: whatsappNumber,
          whatsapp_label: whatsappLabel,
          waktu_buka: waktuBuka ? new Date(waktuBuka).toISOString() : null,
          waktu_tutup: waktuTutup ? new Date(waktuTutup).toISOString() : null,
        },
        'Admin'
      );
      setSettings(updated);
      showToast('Konfigurasi sistem & jadwal berhasil disimpan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (supabaseUrl && !supabaseUrl.includes('sample-project')) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      showToast('Password admin berhasil diperbarui.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-40 skeleton-box" />
        <div className="h-64 w-full skeleton-box rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Sistem & Jadwal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur informasi kegiatan, kontak WhatsApp panitia, jadwal buka/tutup form otomatis, dan keamanan akun.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Group 1: Informasi Kegiatan */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <SlidersHorizontal className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Informasi Kegiatan & Panitia
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nama Kegiatan"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Subtitle / Deskripsi Form"
              value={eventSubtitle}
              onChange={(e) => setEventSubtitle(e.target.value)}
              required
            />
            <Input
              label="Nama Panitia Penyelenggara"
              value={committeeName}
              onChange={(e) => setCommitteeName(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Tahun Akademik / Hijriyah"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Group 2: Kontak WhatsApp Panitia */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Contact Person WhatsApp (Icon Floating)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor WhatsApp (dengan kode negara)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Contoh: 6281234567890"
              required
            />
            <Input
              label="Teks Label Tombol"
              value={whatsappLabel}
              onChange={(e) => setWhatsappLabel(e.target.value)}
              placeholder="Contoh: Bantuan Panitia"
              required
            />
          </div>
        </div>

        {/* Group 3: Jadwal Waktu Buka & Tutup Form Otomatis */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CalendarClock className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Jadwal Waktu Buka & Tutup Form
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Waktu Buka Otomatis (Opsional)
              </label>
              <input
                type="datetime-local"
                value={waktuBuka}
                onChange={(e) => setWaktuBuka(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Form otomatis dapat diisi setelah waktu ini tercapai.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Waktu Tutup Otomatis (Opsional)
              </label>
              <input
                type="datetime-local"
                value={waktuTutup}
                onChange={(e) => setWaktuTutup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Form otomatis terkunci setelah batas waktu ini berakhir.
              </p>
            </div>
          </div>
        </div>

        {/* Group 4: Status Form Publik Manual */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Status Form Publik (Manual Override)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'OPEN' as FormStatus,
                label: 'Dibuka (OPEN)',
                desc: 'Form aktif menerima submit.',
              },
              {
                id: 'CLOSED' as FormStatus,
                label: 'Ditutup (CLOSED)',
                desc: 'Form dikunci dan ditutup panitia.',
              },
              {
                id: 'MAINTENANCE' as FormStatus,
                label: 'Pemeliharaan',
                desc: 'Perbaikan data panitia.',
              },
            ].map((st) => (
              <label
                key={st.id}
                onClick={() => setFormStatus(st.id)}
                className={`p-3.5 rounded-lg border cursor-pointer text-xs transition-colors flex flex-col justify-between ${
                  formStatus === st.id
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900">{st.label}</div>
                  <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">{st.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      formStatus === st.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
                    }`}
                  >
                    {formStatus === st.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            <span>Simpan Semua Pengaturan</span>
          </Button>
        </div>
      </form>

      {/* Group 5: Administrator Security */}
      <form onSubmit={handleUpdatePassword} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Akun & Keamanan Administrator
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password Baru"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
            required
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="outline" size="md" isLoading={isUpdatingPassword}>
            Perbarui Password Admin
          </Button>
        </div>
      </form>
    </div>
  );
}
