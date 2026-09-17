'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export interface StickyBarProps {
  selectedCount: number;
  limitPiket: number;
  onProceed: () => void;
  disabled?: boolean;
}

export const StickyBar: React.FC<StickyBarProps> = ({
  selectedCount,
  limitPiket,
  onProceed,
  disabled = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200 shadow-lg px-4 py-3.5 sm:px-8 transition-transform duration-200 ease-in-out">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
            {selectedCount}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900">
              {selectedCount} guru dipilih
            </div>
            <div className="text-[11px] text-slate-500">
              Maksimal kuota kamar: {limitPiket} orang
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onProceed}
          disabled={disabled}
          variant="primary"
          size="md"
          className="shadow-sm font-semibold"
        >
          <span className="hidden sm:inline">Lanjutkan ke Konfirmasi</span>
          <span className="sm:hidden">Lanjutkan</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
