import React from 'react';
import Link from 'next/link';
import { KamarOverview } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { ArrowRight, Users, ShieldCheck } from 'lucide-react';

export const KamarCard: React.FC<{ kamar: KamarOverview }> = ({ kamar }) => {
  const isFulfilled = kamar.total_piket_terpilih >= kamar.limit_piket && kamar.limit_piket > 0;

  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition-colors duration-150 hover:border-slate-300 hover:shadow-sm">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">{kamar.nama_kamar}</h3>
          <StatusBadge status={kamar.status_penetapan} size="sm" />
        </div>

        {/* Room Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
          <div>
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Anggota
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{kamar.total_guru} orang</div>
          </div>
          <div>
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Piket Terpilih
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              <span className={isFulfilled ? 'text-emerald-700' : 'text-slate-900'}>
                {kamar.total_piket_terpilih}
              </span>
              <span className="text-slate-400 font-normal"> / {kamar.limit_piket}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Link */}
      <div className="mt-4 pt-1 flex items-center justify-end">
        <Link
          href={`/kamar/${kamar.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors focus:outline-none"
        >
          Lihat anggota
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
