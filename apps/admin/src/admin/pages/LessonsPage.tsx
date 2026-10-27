import React, { useState } from 'react';
import { FileText, Plus, Clock } from 'lucide-react';
import { adminApi, LessonRow } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { STATUS_LABELS } from '../api/labels';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LessonEditor } from '../components/editors/LessonEditor';
import { ErrorBlock } from '../components/ui/PageState';

interface LessonsPageProps {
  onNavigate: (path: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = () => {
  const { can } = useStaff();
  const initialSubject = new URLSearchParams(window.location.search).get('subject') ?? 'all';
  const [subjectFilter, setSubjectFilter] = useState(initialSubject);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  // undefined: list; null: new lesson; string: lesson slug.
  const [editing, setEditing] = useState<string | null | undefined>(undefined);

  const subjects = useAdminData(() => adminApi.subjects(), []);
  const lessons = useAdminData(
    () => adminApi.lessons({ subject_id: subjectFilter === 'all' ? undefined : subjectFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
    [subjectFilter, statusFilter],
    30000,
  );
  const subjectName = (id: string) => subjects.data?.items.find((s) => s.id === id)?.title_ru ?? id;
  const rows = (lessons.data?.items ?? []).filter(
    (l) => !search.trim() || l.latest.title_ru.toLowerCase().includes(search.trim().toLowerCase()) || l.slug.includes(search.trim().toLowerCase()),
  );

  if (editing !== undefined) {
    return (
      <LessonEditor
        slug={editing ?? undefined}
        onClose={() => {
          setEditing(undefined);
          lessons.reload();
        }}
      />
    );
  }

  const columns: ColumnDef<LessonRow>[] = [
    {
      key: 'title',
      header: 'Урок',
      cell: (l) => (
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{l.latest.title_ru}</div>
            <div className="text-[11px] text-[#78716C] mt-0.5">
              {subjectName(l.subject_id)} · {l.topic_title} · <span className="font-mono">{l.slug}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'minutes',
      header: 'Длительность',
      cell: (l) => (
        <span className="text-xs text-[#5C574F] flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#A8A29E]" /> {l.latest.estimated_minutes} мин
        </span>
      ),
    },
    { key: 'version', header: 'Версия', cell: (l) => <span className="font-mono text-xs">v{l.latest.version}</span> },
    {
      key: 'status',
      header: 'Последняя версия',
      cell: (l) => <StatusBadge status={l.latest.status} label={STATUS_LABELS[l.latest.status]} />,
    },
    {
      key: 'published',
      header: 'Видят ученики',
      cell: (l) => <span className="text-xs">{l.has_published ? 'да' : 'нет'}</span>,
    },
    { key: 'completed_by', header: 'Завершили', cell: (l) => <span className="font-mono text-xs">{l.completed_by}</span> },
    { key: 'author', header: 'Автор', cell: (l) => <span className="text-xs text-[#5C574F]">{l.latest.author}</span> },
  ];

  const filters: TableFilter[] = [
    {
      key: 'subject',
      label: 'Предмет',
      selectedValue: subjectFilter,
      onChange: setSubjectFilter,
      options: [{ label: 'Все предметы', value: 'all' }, ...(subjects.data?.items ?? []).map((s) => ({ label: s.title_ru, value: s.id }))],
    },
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Все статусы', value: 'all' },
        ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Уроки</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Черновик → рецензия → утверждение → публикация. Ученики видят только опубликованную версию.
          </p>
        </div>
        {can('content.create') && (
          <button
            onClick={() => setEditing(null)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Создать урок
          </button>
        )}
      </div>

      {lessons.error && <ErrorBlock text={lessons.error} onRetry={lessons.reload} />}

      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={(l) => l.slug}
        searchPlaceholder="Поиск по названию или коду…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onRowClick={(l) => setEditing(l.slug)}
        emptyMessage={lessons.loading ? 'Загрузка…' : 'Уроков нет'}
        emptySubtitle="Создайте урок или импортируйте черновики командой сервера"
      />
    </div>
  );
};
