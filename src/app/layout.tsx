import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: "Sistem Penentuan Piket Kamar Guru — Ujian Muraja'ah Akhir Tahun",
  description: "Aplikasi penentuan dan pemantauan piket kamar guru untuk Panitia Ujian Muraja'ah Akhir Tahun",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
