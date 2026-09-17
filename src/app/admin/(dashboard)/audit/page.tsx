'use client';

import React, { useEffect, useState } from 'react';
import { AuditLog } from '@/types';
import { DataService } from '@/lib/data-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { RefreshCw, History, Eye, User } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Audit Trail & Log Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Catatan kronologis seluruh perubahan master data, submit piket, dan konfigurasi sistem.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-dense">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Operator</th>
                <th>Aktivitas</th>
                <th>Entitas</th>
                <th>Target ID</th>
                <th className="text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="text-xs font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{log.actor_id}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="text-xs text-slate-600 capitalize">{log.entity_type}</td>
                    <td className="text-xs font-mono text-slate-500">{log.entity_id || '-'}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Lihat</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                    Belum ada riwayat audit log.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Detail Rekaman Audit Log"
        description="Rincian payload perubahan data sebelum dan sesudah tindakan."
        width="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Log:</span>
                <span className="font-mono text-slate-900">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span className="text-slate-900">{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="font-semibold text-slate-900">{selectedLog.actor_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aksi:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
              </div>
            </div>

            {selectedLog.old_data && (
              <div>
                <span className="block font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Data Sebelumnya (Old Data):
                </span>
                <pre className="rounded-lg border border-slate-200 bg-slate-900 text-slate-100 p-3 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.old_data, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_data && (
              <div>
                <span className="block font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Data Baru (New Data):
                </span>
                <pre className="rounded-lg border border-slate-200 bg-slate-900 text-slate-100 p-3 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
