import React, { useState } from 'react';
import { adminApi, SchoolPerson } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, ForbiddenBlock } from '../components/ui/PageState';
import { fmtDate } from '../components/ui/PageState';

interface TeachersPageProps {
  onNavigate: (path: string) => void;
}

/** Teachers and school administrators of all schools, as they are recorded on the server. */
export const TeachersPage: React.FC<TeachersPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const allowed = can('schools.read');
  const people = useAdminData(() => (allowed ? adminApi.schoolTeachers() : Promise.resolve({ items: [] })), [allowed], 60000);
  if (!allowed) return <ForbiddenBlock />;

  const needle = search.trim().toLowerCase();
  const rows = (people.data?.items ?? []).filter(
    (p) =>
      (role === 'all' || p.role === role) &&
      (!needle || [p.name, p.email, p.organization_name].some((x) => x.toLowerCase().includes(needle))),
  );

  const columns: ColumnDef<SchoolPerson>[] = [
    {
      key: 'name',
      header: 'Сотрудник школы',
      cell: (p) => (
        <div>
          <div className="font-semibold text-xs text-[#171717]">{p.name}</div>
          <div className="text-[11px] text-[#78716C]">{p.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Роль',
      cell: (p) => <span className="text-xs">{p.role === 'SCHOOL_ADMIN' ? 'Администратор школы' : 'Учитель'}</span>,
    },
    {
      key: 'organization_name',
      header: 'Школа',
      cell: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/admin/schools/${p.organization_id}`);
          }}
          className="text-xs font-medium text-[#171717] hover:text-[#FF5A36] text-left cursor-pointer"
        >
          {p.organization_name}
          {p.organization_status !== 'active' && <span className="ml-1.5"><StatusBadge status={p.organization_status} /></span>}
        </button>
      ),
    },
    { key: 'class_count', header: 'Классов', cell: (p) => <span className="text-xs">{p.class_count ?? '—'}</span> },
    { key: 'joined_at', header: 'В школе с', cell: (p) => <span className="text-xs text-[#5C574F]">{fmtDate(p.joined_at)}</span> },
  ];

  const filters: TableFilter[] = [
    {
      key: 'role',
      label: 'Роль',
      selectedValue: role,
      onChange: setRole,
      options: [
        { label: 'Все роли', value: 'all' },
        { label: 'Учителя', value: 'TEACHER' },
        { label: 'Администраторы школ', value: 'SCHOOL_ADMIN' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Учителя и администраторы школ</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Все, кто работает в школах платформы. Учителей приглашает администратор школы, платформа их список только просматривает.
        </p>
      </div>
      {people.error && <ErrorBlock text={people.error} onRetry={people.reload} />}
      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={(p) => `${p.organization_id}:${p.user_id}`}
        searchPlaceholder="Поиск по имени, email или школе..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        emptyMessage={people.loading ? 'Загрузка…' : 'Пока нет учителей'}
        onRowClick={(p) => onNavigate(`/admin/schools/${p.organization_id}`)}
      />
    </div>
  );
};
