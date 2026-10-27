import React, { useEffect, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { adminApi, StudentRow } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ExportDialog } from '../components/ui/ExportDialog';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, fmtDate } from '../components/ui/PageState';

interface UsersPageProps {
  onNavigate: (path: string) => void;
}

const PAGE_SIZE = 100;

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [dialog, setDialog] = useState<{ user: StudentRow; next: 'active' | 'disabled' } | null>(null);
  const [reason, setReason] = useState('');

  // Search runs on the server, a moment after typing stops.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, error, loading, reload } = useAdminData(
    () => adminApi.users({ search: debounced, status: statusFilter, page, page_size: PAGE_SIZE }),
    [debounced, statusFilter, page],
    30000,
  );
  const users = data?.items ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const confirmStatus = async () => {
    if (!dialog) return;
    const ok = await runAction(
      () => adminApi.setUserStatus(dialog.user.id, dialog.next, reason.trim()),
      dialog.next === 'disabled' ? 'Доступ приостановлен, сессии ученика завершены.' : 'Доступ восстановлен.',
      setResult,
    );
    setDialog(null);
    setReason('');
    if (ok) reload();
  };

  const columns: ColumnDef<StudentRow>[] = [
    {
      key: 'name',
      header: 'Ученик',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#F0EEE8] border border-[#E2DED5] flex items-center justify-center font-bold text-xs text-[#5C574F]">
            {u.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{u.name}</div>
            <div className="text-[11px] text-[#78716C]">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'onboarding_completed',
      header: 'Профиль',
      cell: (u) => (
        <span className="text-xs text-[#5C574F]">
          {u.onboarding_completed ? `Цель ${u.target_score ?? '—'} / 140` : 'Онбординг не пройден'}
        </span>
      ),
    },
    {
      key: 'lessons_completed',
      header: 'Уроков пройдено',
      sortable: true,
      cell: (u) => <span className="font-mono text-xs text-[#171717]">{u.lessons_completed}</span>,
    },
    {
      key: 'created_at',
      header: 'Регистрация',
      sortable: true,
      cell: (u) => <span className="text-[11px] font-mono text-[#78716C]">{fmtDate(u.created_at)}</span>,
    },
    {
      key: 'last_seen_at',
      header: 'Последняя активность',
      sortable: true,
      cell: (u) => <span className="text-[11px] font-mono text-[#78716C]">{fmtDate(u.last_seen_at, true)}</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (u) =>
        u.status === 'disabled' ? (
          <StatusBadge status="disabled" label="Заблокирован" />
        ) : u.email_verified ? (
          <StatusBadge status="active" />
        ) : (
          <StatusBadge status="unverified" />
        ),
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      headerClassName: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {can('users.suspend') &&
            (u.status === 'active' ? (
              <button
                onClick={() => setDialog({ user: u, next: 'disabled' })}
                className="px-2 py-1 text-[11px] font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FDF2F2] cursor-pointer"
              >
                Заблокировать
              </button>
            ) : (
              <button
                onClick={() => setDialog({ user: u, next: 'active' })}
                className="px-2 py-1 text-[11px] font-medium text-[#258568] bg-white border border-[#A7F3D0] rounded hover:bg-[#EBF7F2] cursor-pointer"
              >
                Разблокировать
              </button>
            ))}
          <button
            onClick={() => onNavigate(`/admin/users/${u.id}`)}
            className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] cursor-pointer"
            title="Открыть карточку"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: (value) => {
        setStatusFilter(value);
        setPage(1);
      },
      options: [
        { label: 'Все', value: 'all' },
        { label: 'Активные', value: 'active' },
        { label: 'Email не подтверждён', value: 'unverified' },
        { label: 'Заблокированные', value: 'disabled' },
      ],
    },
  ];

  const handleExport = (format: 'csv' | 'json', options: { includePii: boolean }) => {
    if (users.length === 0) {
      setResult({ tone: 'error', text: 'Список пуст: выгружать нечего.' });
      return;
    }
    const rows = users.map((u) => ({
      ID: u.id,
      Имя: u.name,
      Email: options.includePii ? u.email : '[скрыто]',
      Статус: u.status,
      EmailПодтверждён: u.email_verified ? 'да' : 'нет',
      Регистрация: u.created_at,
      УроковПройдено: u.lessons_completed,
    }));
    const content =
      format === 'csv'
        ? [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
        : JSON.stringify(rows, null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qazmind_users_${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Ученики</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            {data ? `${data.total} учётных записей в базе` : 'Загрузка…'}. Список обновляется каждые 30 секунд.
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[#78716C]" /> Экспорт
        </button>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      {error && <ErrorBlock text={error} onRetry={reload} />}

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Поиск по имени или email…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        pageSize={25}
        onRowClick={(u) => onNavigate(`/admin/users/${u.id}`)}
        emptyMessage={loading ? 'Загрузка…' : 'Учеников не найдено'}
        emptySubtitle={debounced || statusFilter !== 'all' ? 'Измените поиск или фильтр' : 'Ученики появятся после регистрации в QazMind Web'}
      />

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2.5 py-1 border border-[#E2DED5] rounded bg-white disabled:opacity-40 cursor-pointer">
            Назад
          </button>
          <span>
            Страница {page} из {pages}
          </span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2.5 py-1 border border-[#E2DED5] rounded bg-white disabled:opacity-40 cursor-pointer">
            Далее
          </button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={dialog !== null}
        title={dialog?.next === 'disabled' ? `Заблокировать: ${dialog?.user.name}` : `Разблокировать: ${dialog?.user.name}`}
        message={
          dialog?.next === 'disabled'
            ? 'Ученик не сможет войти, его текущие сессии завершатся. Действие обратимо и записывается в журнал.'
            : 'Ученик снова сможет войти в QazMind Web.'
        }
        variant={dialog?.next === 'disabled' ? 'danger' : 'primary'}
        confirmLabel={dialog?.next === 'disabled' ? 'Заблокировать' : 'Разблокировать'}
        confirmDisabled={reason.trim().length < 3}
        onConfirm={() => void confirmStatus()}
        onCancel={() => {
          setDialog(null);
          setReason('');
        }}
      >
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина (видна в журнале аудита)"
          className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
        />
      </ConfirmationDialog>

      <ExportDialog
        isOpen={exportOpen}
        title="Экспорт списка учеников"
        itemCount={users.length}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};
