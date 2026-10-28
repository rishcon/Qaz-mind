import React, { useState } from 'react';
import { adminApi, SchoolAssignmentRow } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, ForbiddenBlock, fmtDate } from '../components/ui/PageState';

interface AssignmentsPageProps {
  onNavigate: (path: string) => void;
}

const STATUS: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'draft', label: 'Черновик' },
  published: { badge: 'active', label: 'Идёт' },
  closed: { badge: 'archived', label: 'Закрыто' },
  archived: { badge: 'archived', label: 'В архиве' },
};

/** Assignments given in all schools. Student answers are not shown here: only status and counts. */
export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const allowed = can('schools.read');
  const data = useAdminData(() => (allowed ? adminApi.schoolAssignments() : Promise.resolve({ items: [] })), [allowed], 60000);
  if (!allowed) return <ForbiddenBlock />;

  const needle = search.trim().toLowerCase();
  const rows = (data.data?.items ?? []).filter(
    (a) => (status === 'all' || a.status === status) && (!needle || [a.title, a.organization_name, a.created_by].some((x) => x.toLowerCase().includes(needle))),
  );

  const columns: ColumnDef<SchoolAssignmentRow>[] = [
    {
      key: 'title',
      header: 'Задание',
      cell: (a) => (
        <div>
          <div className="font-semibold text-xs text-[#171717]">{a.title}</div>
          <div className="text-[11px] text-[#78716C]">
            {a.subject_id} · {a.question_count} вопр. · классов: {a.class_count}
          </div>
        </div>
      ),
    },
    { key: 'organization_name', header: 'Школа', cell: (a) => <span className="text-xs">{a.organization_name}</span> },
    { key: 'created_by', header: 'Учитель', cell: (a) => <span className="text-xs">{a.created_by}</span> },
    { key: 'due_at', header: 'Срок', cell: (a) => <span className="text-xs text-[#5C574F]">{a.due_at ? fmtDate(a.due_at, true) : 'без срока'}</span> },
    { key: 'submitted_students', header: 'Сдали', cell: (a) => <span className="text-xs font-semibold">{a.submitted_students}</span> },
    { key: 'status', header: 'Статус', cell: (a) => <StatusBadge status={STATUS[a.status]?.badge ?? a.status} label={STATUS[a.status]?.label} /> },
  ];

  const filters: TableFilter[] = [
    {
      key: 'status',
      label: 'Статус',
      selectedValue: status,
      onChange: setStatus,
      options: [
        { label: 'Все', value: 'all' },
        { label: 'Идут', value: 'published' },
        { label: 'Черновики', value: 'draft' },
        { label: 'Закрытые', value: 'closed' },
        { label: 'В архиве', value: 'archived' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Школьные задания</h1>
        <p className="text-xs text-[#78716C] mt-0.5">Задания всех школ. Создают и закрывают их учителя; здесь платформа видит только статус и число сдавших.</p>
      </div>
      {data.error && <ErrorBlock text={data.error} onRetry={data.reload} />}
      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Поиск по названию, школе или учителю..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        emptyMessage={data.loading ? 'Загрузка…' : 'Заданий пока нет'}
        onRowClick={(a) => onNavigate(`/admin/schools/${a.organization_id}`)}
      />
    </div>
  );
};
