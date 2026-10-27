import React, { useEffect, useState } from 'react';
import { Plus, Upload, FileQuestion } from 'lucide-react';
import { adminApi, Question } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { DIFFICULTY_LABELS, STATUS_LABELS } from '../api/labels';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, fmtDate } from '../components/ui/PageState';

interface QuestionsPageProps {
  onNavigate: (path: string) => void;
}

export const QuestionsPage: React.FC<QuestionsPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const [subjectFilter, setSubjectFilter] = useState(new URLSearchParams(window.location.search).get('subject') ?? 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const subjects = useAdminData(() => adminApi.subjects(), []);
  const questions = useAdminData(
    () =>
      adminApi.questions({
        subject_id: subjectFilter === 'all' ? undefined : subjectFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debounced,
        page_size: 200,
      }),
    [subjectFilter, statusFilter, debounced],
    30000,
  );
  const subjectName = (id: string) => subjects.data?.items.find((s) => s.id === id)?.title_ru ?? id;

  const columns: ColumnDef<Question>[] = [
    {
      key: 'text_ru',
      header: 'Вопрос',
      cell: (q) => (
        <div className="flex items-start gap-2.5 max-w-xl">
          <FileQuestion className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[#171717] line-clamp-2">{q.text_ru}</div>
            <div className="text-[11px] text-[#78716C] mt-0.5">
              {subjectName(q.subject_id)}
              {q.external_id ? ` · ID ${q.external_id}` : ''} · {q.options.length} варианта · ответ {q.correct_label}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'difficulty', header: 'Сложность', cell: (q) => <span className="text-xs">{DIFFICULTY_LABELS[q.difficulty]}</span> },
    { key: 'points', header: 'Баллы', cell: (q) => <span className="font-mono text-xs">{q.points}</span> },
    { key: 'status', header: 'Статус', cell: (q) => <StatusBadge status={q.status} label={STATUS_LABELS[q.status]} /> },
    { key: 'author', header: 'Автор', cell: (q) => <span className="text-xs text-[#5C574F]">{q.author ?? '—'}</span> },
    { key: 'updated_at', header: 'Изменён', sortable: true, cell: (q) => <span className="text-[11px] font-mono text-[#78716C]">{fmtDate(q.updated_at, true)}</span> },
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
      options: [{ label: 'Все статусы', value: 'all' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value }))],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Банк вопросов</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            {questions.data ? `${questions.data.total} вопросов по выбранным условиям` : 'Загрузка…'}. В практику и экзамены попадают только опубликованные.
          </p>
        </div>
        {can('content.create') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/admin/content/questions/import')}
              className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#78716C]" /> Импорт CSV
            </button>
            <button
              onClick={() => onNavigate('/admin/content/questions/new')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Новый вопрос
            </button>
          </div>
        )}
      </div>

      {questions.error && <ErrorBlock text={questions.error} onRetry={questions.reload} />}

      <DataTable
        data={questions.data?.items ?? []}
        columns={columns}
        keyExtractor={(q) => q.id}
        searchPlaceholder="Поиск по тексту или ID…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        pageSize={25}
        onRowClick={(q) => onNavigate(`/admin/content/questions/${q.id}`)}
        emptyMessage={questions.loading ? 'Загрузка…' : 'Вопросов нет'}
        emptySubtitle="Создайте вопрос или импортируйте файл CSV"
      />
    </div>
  );
};
