'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export interface FloatingWhatsAppProps {
  phoneNumber?: string | null;
  label?: string | null;
  eventName?: string | null;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber,
  label = 'Bantuan Panitia',
  eventName = 'Ujian Muraja\'ah',
}) => {
  if (!phoneNumber) return null;

  // Clean phone number (e.g., remove '+', '-', spaces)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.substring(1);
  }

  const defaultMessage = encodeURIComponent(
    `Assalamu'alaikum Panitia ${eventName}, saya ingin bertanya mengenai pengisian form penentuan piket kamar guru.`
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  return (
    <aside
      aria-label="Kontak WhatsApp Panitia"
      className="fixed bottom-6 right-6 z-40 flex items-center"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-3 text-white shadow-lg transition-all duration-200 hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-95"
        title="Hubungi Panitia via WhatsApp"
      >
        <div className="flex h-6 w-6 items-center justify-center">
          <MessageCircle className="h-5 w-5 fill-white stroke-none" />
        </div>
        <span className="text-xs font-semibold tracking-wide pr-1">
          {label || 'Hubungi Panitia'}
        </span>
      </a>
    </aside>
  );
};
