'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("muraja'ah@admin.id");
  const [password, setPassword] = useState('muraja\'ah2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      // If using local mock or connected Supabase
      if (!supabaseUrl || supabaseUrl.includes('sample-project') || supabaseUrl.includes('your-project')) {
        // Mock authentication pass for initial verification
        if (email && password) {
          router.push('/admin');
          return;
        }
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback for demo admin account if not yet seeded in remote auth
        if (email === "muraja'ah@admin.id" && password === "muraja'ah2026") {
          router.push('/admin');
          return;
        }
        setError(authError.message || 'Email atau password tidak valid.');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Panel Administrator
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Ujian Muraja&apos;ah
            </h1>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="muraja'ah@admin.id"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2 font-semibold"
            isLoading={loading}
          >
            Masuk
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Akses terbatas hanya untuk Panitia Resmi.
        </div>
      </div>
    </div>
  );
}
