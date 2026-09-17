'use client';

import React from 'react';
import clsx from 'clsx';
import { Guru } from '@/types';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface GuruRowProps {
  guru: Guru;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (guruId: string) => void;
}

export const GuruRow: React.FC<GuruRowProps> = ({
  guru,
  isSelected,
  isDisabled,
  onToggle,
}) => {
  const isAssigned = guru.is_piket_active;

  return (
    <div
      onClick={() => {
        if (!isDisabled && !isAssigned) {
          onToggle(guru.id);
        }
      }}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={isDisabled || isAssigned ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!isDisabled && !isAssigned) onToggle(guru.id);
        }
      }}
      className={clsx(
        'group flex items-center justify-between p-3.5 sm:p-4 rounded-lg border transition-all duration-150 select-none min-h-[52px]',
        isAssigned
          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          : isSelected
          ? 'bg-slate-900/5 border-slate-900 ring-1 ring-slate-900 cursor-pointer'
          : isDisabled
          ? 'bg-white border-slate-200 opacity-50 cursor-not-allowed'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer'
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Custom Accessible Checkbox */}
        <div
          className={clsx(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
            isSelected
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'border-slate-300 bg-white group-hover:border-slate-400'
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </div>

        {/* Teacher Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {guru.nama}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            {guru.rnk && <span>RNK #{guru.rnk}</span>}
            {guru.rnk && <span>•</span>}
            <span>Tahun {guru.tahun}</span>
          </div>
        </div>
      </div>

      {/* Assignment Status */}
      <div className="shrink-0 ml-3">
        {isAssigned ? (
          <Badge variant="neutral" size="sm">
            Sudah Piket
          </Badge>
        ) : isSelected ? (
          <Badge variant="accent" size="sm">
            Terpilih
          </Badge>
        ) : null}
      </div>
    </div>
  );
};
