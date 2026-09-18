'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { 
  LayoutDashboard, 
  DoorOpen, 
  Users, 
  ShieldCheck, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  History, 
  LogOut, 
  Menu, 
  X,
  ExternalLink,
  Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DataService } from '@/lib/data-service';

export interface AdminShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/kamar', label: 'Kamar', icon: DoorOpen },
  { href: '/admin/guru', label: 'Guru', icon: Users },
  { href: '/admin/piket', label: 'Histori Piket', icon: ShieldCheck },
  { href: '/admin/import', label: 'Import Excel', icon: FileSpreadsheet },
  { href: '/admin/settings', label: 'Pengaturan', icon: SlidersHorizontal },
  { href: '/admin/audit', label: 'Audit Log', icon: History },
];

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<{
    event_name?: string;
    academic_year?: string;
    logo_url?: string | null;
  } | null>(null);

  React.useEffect(() => {
    DataService.getSettings()
      .then((s) => {
        setSettings({
          event_name: s.event_name,
          academic_year: s.academic_year,
          logo_url: s.logo_url,
        });
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    router.push('/admin/login');
  };

  const isNavActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const logoUrl = settings?.logo_url;
  const brandTitle = settings?.event_name ? settings.event_name.toUpperCase() : "MURAJA'AH 1447";

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Panitia"
              className="h-7 w-7 rounded object-contain bg-white p-0.5 shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-white shrink-0">
              <Shield className="h-4 w-4" />
            </div>
          )}
          <span className="font-bold text-sm tracking-tight truncate">
            {brandTitle}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-800"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] bg-slate-900 text-slate-100 flex flex-col p-4 shadow-xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-sm">Navigasi Admin</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-1 flex-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                      active
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-800 space-y-1">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Lihat Form Publik</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-md"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Panitia"
              className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-xs"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-white shadow-xs shrink-0">
              <Shield className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              PANEL ADMIN
            </div>
            <div className="text-sm font-bold text-white tracking-tight leading-tight line-clamp-2" title={brandTitle}>
              {brandTitle}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150',
                  active
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon className={clsx('h-4 w-4', active ? 'text-white' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-slate-800 space-y-1 text-xs">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Halaman Form</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar Panel</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
