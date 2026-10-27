import React, { useState } from 'react';
import {
  History,
  Shield,
  Download,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { AuditLogEvent } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExportDialog } from '../components/ui/ExportDialog';

export const AuditPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const logs = adminService.getAuditLogs({
    search,
    module: moduleFilter,
  });

  const columns: ColumnDef<AuditLogEvent>[] = [
    {
      key: 'timestamp',
      header: 'Время (UTC+5)',
      sortable: true,
      cell: (ev) => (
        <span className="font-mono text-xs text-[#78716C]">
          {new Date(ev.timestamp).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: 'Инициатор (Actor)',
      sortable: true,
      cell: (ev) => (
        <div>
          <div className="font-semibold text-xs text-[#171717]">{ev.actorName}</div>
          <span className="px-1.5 py-0.2 rounded bg-[#F0EEE8] font-mono text-[9px] text-[#5C574F]">
            {ev.actorRole}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Действие',
      sortable: true,
      cell: (ev) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FAF9F6] border border-[#E2DED5] text-[#171717]">
          {ev.action}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Модуль',
      sortable: true,
      cell: (ev) => (
        <span className="text-xs text-[#5C574F] capitalize font-medium">{ev.module}</span>
      ),
    },
    {
      key: 'resourceTitle',
      header: 'Затронутый ресурс',
      cell: (ev) => (
        <div className="max-w-xs truncate">
          <span className="text-xs font-semibold text-[#171717]">{ev.resourceTitle}</span>
          <div className="text-[10px] font-mono text-[#A8A29E]">{ev.resourceId}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Результат',
      cell: (ev) => <StatusBadge status={ev.status} />,
    },
    {
      key: 'correlationId',
      header: 'Correlation ID',
      cell: (ev) => <span className="font-mono text-[10px] text-[#A8A29E]">{ev.correlationId}</span>,
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'module',
      label: 'Модуль',
      selectedValue: moduleFilter,
      onChange: setModuleFilter,
      options: [
        { label: 'Все модули', value: 'all' },
        { label: 'Школы', value: 'schools' },
        { label: 'Пользователи', value: 'users' },
        { label: 'Вопросы ЕНТ', value: 'questions' },
        { label: 'Учебный план', value: 'curriculum' },
        { label: 'Экзамены', value: 'exams' },
        { label: 'Финансы', value: 'finance' },
      ],
    },
  ];

  const handleExport = (format: 'csv' | 'json') => {
    const exportData = logs.map((l) => ({
      EventID: l.id,
      Timestamp: l.timestamp,
      Actor: l.actorName,
      Role: l.actorRole,
      Action: l.action,
      Module: l.module,
      ResourceID: l.resourceId,
      ResourceTitle: l.resourceTitle,
      Status: l.status,
      CorrelationID: l.correlationId,
      PreviousValue: JSON.stringify(l.previousValue || {}),
      NewValue: JSON.stringify(l.newValue || {}),
    }));

    const blob = new Blob(
      [
        format === 'csv'
          ? Object.keys(exportData[0]).join(',') +
            '\n' +
            exportData.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')).join('\n')
          : JSON.stringify(exportData, null, 2),
      ],
      { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qazmind_audit_log_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Журнал административного аудита</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Неизменяемый реестр ключевых действий администраторов: кто, когда, какой ресурс изменил и с какими значениями.
          </p>
        </div>

        <button
          onClick={() => setExportOpen(true)}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[#78716C]" /> Выгрузка аудита (CSV)
        </button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchPlaceholder="Поиск по действию, ресурсу или инициатору..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onRowClick={(l) => setSelectedEvent(l)}
      />

      {/* Audit Event Detail Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF5A36]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Аудиторская запись #{selectedEvent.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-semibold text-[#78716C] hover:text-[#171717]"
              >
                Закрыть
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg">
                <div>
                  <span className="text-[#78716C] block">Инициатор действия:</span>
                  <span className="font-bold text-[#171717]">{selectedEvent.actorName}</span>
                  <span className="text-[10px] text-[#FF5A36] block font-mono">
                    Роль: {selectedEvent.actorRole}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] block">Время фиксации:</span>
                  <span className="font-mono text-[#171717]">
                    {new Date(selectedEvent.timestamp).toLocaleString('ru-RU')}
                  </span>
                  <span className="text-[10px] text-[#A8A29E] block font-mono">
                    IP: {selectedEvent.ipAddress || '127.0.0.1'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#78716C]">Операция:</span>
                <div className="font-mono font-bold text-sm text-[#FF5A36]">
                  {selectedEvent.action}
                </div>
                <div className="text-[#78716C]">
                  Модуль: <strong className="text-[#171717]">{selectedEvent.module}</strong> •
                  Ресурс: <strong className="text-[#171717]">{selectedEvent.resourceTitle}</strong> (ID: {selectedEvent.resourceId})
                </div>
              </div>

              {/* Diffs: Previous vs New */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="font-semibold text-[#78716C] block mb-1">Предыдущее состояние:</span>
                  <pre className="p-3 bg-[#FFF1F2] border border-[#FCA5A5]/40 rounded-lg font-mono text-[11px] text-[#991B1B] overflow-x-auto min-h-[80px]">
                    {selectedEvent.previousValue
                      ? JSON.stringify(selectedEvent.previousValue, null, 2)
                      : '— (Не применимо / Создание)'}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-[#78716C] block mb-1">Новое состояние:</span>
                  <pre className="p-3 bg-[#EBF7F2] border border-[#A7F3D0]/60 rounded-lg font-mono text-[11px] text-[#1D6A53] overflow-x-auto min-h-[80px]">
                    {selectedEvent.newValue
                      ? JSON.stringify(selectedEvent.newValue, null, 2)
                      : '—'}
                  </pre>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-between font-mono text-[11px] text-[#78716C]">
                <span>Request Correlation ID:</span>
                <span className="text-[#171717] font-bold">{selectedEvent.correlationId}</span>
              </div>
            </div>

            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#171717] rounded-md cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportDialog
        isOpen={exportOpen}
        title="Экспорт журнала аудита"
        itemCount={logs.length}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};
