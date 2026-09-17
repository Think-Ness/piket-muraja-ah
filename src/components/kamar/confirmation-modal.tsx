'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Guru, Kamar } from '@/types';
import { ShieldCheck, Check } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  kamar: Kamar;
  selectedGurus: Guru[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  kamar,
  selectedGurus,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title="Simpan Penetapan Piket"
      description="Periksa kembali daftar guru yang akan ditetapkan sebelum menyimpan."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Meta summary card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-slate-500 font-medium">Kamar</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">{kamar.nama_kamar}</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Batas Limit</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">{kamar.limit_piket} orang</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Jumlah Dipilih</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedGurus.length} orang</div>
          </div>
        </div>

        {/* Selected Gurus List */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Guru yang Ditetapkan:
          </div>
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {selectedGurus.map((guru, idx) => (
              <div key={guru.id} className="flex items-center gap-3 px-3.5 py-2.5 text-xs">
                <span className="font-semibold text-slate-400 w-4">{idx + 1}.</span>
                <span className="font-medium text-slate-900 flex-1">{guru.nama}</span>
                <span className="text-slate-400">{guru.tahun}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11.5px] text-slate-500 leading-relaxed">
          Setelah penetapan disimpan, guru yang dipilih akan tercatat dalam sistem piket dan tidak dapat dipilih untuk kamar lain pada periode ini.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Batalkan
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Simpan Penetapan'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
