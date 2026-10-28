import React, { useEffect, useState } from 'react';
import { Plus, Upload, FileQuestion, Send, Trash2 } from 'lucide-react';
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
  const [selected, setSelected] = useState<string[]>([]);
  const [allFound, setAllFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // A different filter is a different set of questions: the selection does not carry over.
  useEffect(() => {
    setSelected([]);
    setAllFound(false);
  }, [subjectFilter, statusFilter, debounced]);

  const items = questions.data?.items ?? [];
  const total = questions.data?.total ?? 0;
  const count = allFound ? total : selected.length;
  const canSelectAllFound = !allFound && items.length > 0 && selected.length >= Math.min(25, items.length) && total > selected.length;

  const run = async (action: 'submit' | 'delete') => {
    if (count === 0 || busy) return;
    const text =
      action === 'delete'
        ? `Удалить безвозвратно черновики из выбранных (${count})? Вопросы на проверке, утверждённые и опубликованные не удаляются.`
        : `Отправить на рецензию черновики из выбранных (${count})? Остальные статусы будут пропущены.`;
    if (!window.confirm(text)) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await adminApi.bulkQuestions({
        action,
        ...(allFound
          ? {
              filter: {
                subject_id: subjectFilter === 'all' ? undefined : subjectFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: debounced,
              },
            }
          : { ids: selected }),
      });
      setNotice({
        kind: 'ok',
        text: `${action === 'delete' ? 'Удалено' : 'Отправлено на рецензию'}: ${result.done}.${result.skipped ? ` Пропущено (не черновики): ${result.skipped}.` : ''}`,
      });
      setSelected([]);
      setAllFound(false);
      questions.reload();
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Не удалось выполнить действие' });
    } finally {
      setBusy(false);
    }
  };

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
              <Upload className="w-3.5 h-3.5 text-[#78716C]" /> Импорт
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

      {notice && (
        <div
          role="status"
          className={`text-xs px-3 py-2 rounded-md border ${notice.kind === 'ok' ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'}`}
        >
          {notice.text}
        </div>
      )}

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-md border border-[#FFD9CF] bg-[#FFF7F5] text-xs text-[#171717]">
          <span className="font-semibold">Выбрано: {count}</span>
          {canSelectAllFound && (
            <button onClick={() => setAllFound(true)} className="underline text-[#E84D2B] cursor-pointer">
              Выбрать все {total} по текущим условиям
            </button>
          )}
          {allFound && (
            <button
              onClick={() => {
                setAllFound(false);
                setSelected([]);
              }}
              className="underline text-[#78716C] cursor-pointer"
            >
              Снять выбор
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {can('content.edit') && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run('submit')}
                  className="px-3 py-1.5 font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> На рецензию
                </button>
                <button
                  disabled={busy}
                  onClick={() => run('delete')}
                  className="px-3 py-1.5 font-semibold text-[#991B1B] bg-white border border-[#FECACA] hover:bg-[#FEF2F2] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <DataTable
        selectable={can('content.edit')}
        selectedIds={allFound ? items.map((q) => q.id) : selected}
        onSelectionChange={(ids) => {
          setAllFound(false);
          setSelected(ids);
        }}
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
        emptySubtitle="Создайте вопрос или импортируйте файл"
      />
    </div>
  );
};
