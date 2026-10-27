import React, { useState } from 'react';
import { GraduationCap, ExternalLink, Mail, Building2, Search } from 'lucide-react';
import { UserAccount } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';

interface TeachersPageProps {
  onNavigate: (path: string) => void;
}

export const TeachersPage: React.FC<TeachersPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');

  const teachers = adminService.getUsers({ role: 'teacher', search });

  const columns: ColumnDef<UserAccount>[] = [
    {
      key: 'name',
      header: 'Преподаватель',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center font-bold text-xs text-[#FF5A36]">
            {t.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{t.name}</div>
            <div className="text-[11px] text-[#78716C]">{t.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      header: 'Школа / Организация',
      sortable: true,
      cell: (t) => (
        <span className="text-xs text-[#171717]">{t.organizationName || '—'}</span>
      ),
    },
    {
      key: 'assignedClasses',
      header: 'Закрепленные классы',
      cell: (t) => (
        <div className="flex flex-wrap gap-1">
          {(t.assignedClasses || ['11-А', '11-Б']).map((c) => (
            <span
              key={c}
              className="px-1.5 py-0.5 rounded bg-[#F0EEE8] text-[10px] font-mono text-[#5C574F]"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAssignmentsCount',
      header: 'Создано заданий',
      sortable: true,
      cell: (t) => (
        <span className="text-xs font-semibold text-[#171717]">
          {t.createdAssignmentsCount || 0}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Последний вход',
      sortable: true,
      cell: (t) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(t.lastActiveAt).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      cell: (t) => (
        <button
          onClick={() => onNavigate(`/admin/users/${t.id}`)}
          className="text-xs text-[#FF5A36] font-medium hover:underline cursor-pointer"
        >
          Профиль →
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Преподаватели платформы</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Учителя школ, прикрепленные классы и мониторинг активности создания домашних срезов ЕНТ.
        </p>
      </div>

      <DataTable
        data={teachers}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Поиск преподавателя по имени или школе..."
        searchValue={search}
        onSearchChange={setSearch}
        onRowClick={(t) => onNavigate(`/admin/users/${t.id}`)}
      />
    </div>
  );
};
