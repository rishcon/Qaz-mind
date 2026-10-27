import React, { useState } from 'react';
import { Activity, Clock, User, Filter, Search, ArrowRight, Shield } from 'lucide-react';
import { UserActivityEvent } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';

interface ActivityPageProps {
  onNavigate: (path: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<UserActivityEvent | null>(null);

  const activities = adminService.getUserActivity({
    search,
    eventType: typeFilter,
  });

  const columns: ColumnDef<UserActivityEvent>[] = [
    {
      key: 'timestamp',
      header: 'Время (UTC+5 / Астана)',
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
      key: 'userName',
      header: 'Пользователь',
      sortable: true,
      cell: (ev) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center font-bold text-[10px] text-[#5C574F]">
            {ev.userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{ev.userName}</div>
            <span className="text-[10px] text-[#78716C] capitalize">{ev.userRole}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'eventType',
      header: 'Тип события',
      sortable: true,
      cell: (ev) => {
        const typeLabels: Record<string, string> = {
          exam_submitted: 'Сдача экзамена ЕНТ',
          lesson_completed: 'Завершение урока',
          login: 'Авторизация в системе',
          practice_started: 'Практическая сессия',
          onboarding_complete: 'Онбординг завершен',
        };
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F0EEE8] text-[#5C574F]">
            {typeLabels[ev.eventType] || ev.eventType}
          </span>
        );
      },
    },
    {
      key: 'resourceName',
      header: 'Объект / Ресурс',
      cell: (ev) => (
        <span className="text-xs text-[#171717] font-medium truncate max-w-xs block">
          {ev.resourceName || ev.resourceType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Результат',
      cell: (ev) => <StatusBadge status={ev.status} />,
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'eventType',
      label: 'Событие',
      selectedValue: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: 'Все события', value: 'all' },
        { label: 'Сдача экзамена', value: 'exam_submitted' },
        { label: 'Урок завершен', value: 'lesson_completed' },
        { label: 'Авторизация (Login)', value: 'login' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">История активности платформы</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Хронологический поток образовательных сессий учащихся и преподавателей с защитой персональных данных.
        </p>
      </div>

      <DataTable
        data={activities}
        columns={columns}
        keyExtractor={(ev) => ev.id}
        searchPlaceholder="Поиск по имени пользователя или ресурсу..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onRowClick={(ev) => setSelectedEvent(ev)}
      />

      {/* Drawer / Modal Detail */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Детализация события #{selectedEvent.id}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-semibold text-[#78716C] hover:text-[#171717]"
              >
                Закрыть
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E2DED5]">
                <span className="text-[#78716C]">Пользователь:</span>
                <span className="font-semibold text-[#171717]">{selectedEvent.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2DED5]">
                <span className="text-[#78716C]">Тип:</span>
                <span className="font-mono text-[#FF5A36]">{selectedEvent.eventType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2DED5]">
                <span className="text-[#78716C]">Ресурс:</span>
                <span className="font-semibold text-[#171717]">{selectedEvent.resourceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2DED5]">
                <span className="text-[#78716C]">Время:</span>
                <span className="font-mono text-[#78716C]">
                  {new Date(selectedEvent.timestamp).toLocaleString('ru-RU')}
                </span>
              </div>
              {selectedEvent.metadata && (
                <div className="mt-2">
                  <span className="text-[#78716C] block mb-1">Метаданные сессии:</span>
                  <pre className="p-2.5 rounded bg-[#FAF9F6] border border-[#E2DED5] font-mono text-[11px] text-[#171717] overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#171717] rounded-md"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
