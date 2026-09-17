'use client';

import React from 'react';
import Link from 'next/link';
import { EventSettings } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { FloatingWhatsApp } from '@/components/ui/floating-whatsapp';
import { Shield, Lock } from 'lucide-react';

export interface AppShellProps {
  settings: EventSettings;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ settings, children }) => {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.committee_name || "Logo Panitia"}
                className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-xs shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
                <Shield className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {settings.committee_name || "Panitia Ujian Muraja'ah Akhir Tahun"}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {settings.event_name || "Ujian Muraja'ah Akhir Tahun"}
              </h1>
            </div>
          </Link>

          {/* Right Header: Form Status Badge */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">Status:</span>
            <StatusBadge status={settings.form_status} size="sm" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {children}
      </main>

      {/* Floating WhatsApp Contact Button */}
      <FloatingWhatsApp
        phoneNumber={settings.whatsapp_number || '6281234567890'}
        label={settings.whatsapp_label || 'Hubungi Panitia'}
        eventName={settings.event_name}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{settings.event_name} • Tahun Akademik {settings.academic_year}</span>
          <span className="text-[11px] text-slate-400">Form Penentuan Piket Kamar Guru</span>
        </div>
      </footer>
    </div>
  );
};
