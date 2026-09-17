import React from 'react';
import { DataService } from '@/lib/data-service';
import { AppShell } from '@/components/layout/app-shell';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await DataService.getSettings();

  return <AppShell settings={settings}>{children}</AppShell>;
}
