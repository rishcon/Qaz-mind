import React, { useEffect, useState } from 'react';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { adminApi } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { actionLabel } from '../api/labels';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, fmtDate } from '../components/ui/PageState';

const PAGE_SIZE = 50;
const GROUPS = [
  { value: '', label: 'Все действия' },
  { value: 'staff.', label: 'Сотрудники и вход' },
  { value: 'user.', label: 'Ученики' },
  { value: 'question.', label: 'Вопросы' },
  { value: 'lesson.', label: 'Уроки' },
  { value: 'topic.', label: 'Темы' },
];

/** The audit log is append-only: the database refuses to change or delete its rows. */
export const AuditPage: React.FC = () => {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [debouncedActor, setDebouncedActor] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedActor(actor);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [actor]);

  const { data, error, loading, reload } = useAdminData(
    () => adminApi.audit({ action, actor: debouncedActor, result: resultFilter, page, page_size: PAGE_SIZE }),
    [action, debouncedActor, resultFilter, page],
    15000,
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const exportCsv = () => {
    if (!data?.items.length) return;
    const header = ['id', 'created_at', 'actor_email', 'action', 'target_type', 'target_id', 'result', 'request_id', 'ip', 'details'];
    const lines = data.items.map((e) =>
      [e.id, e.created_at, e.actor_email ?? '', e.action, e.target_type ?? '', e.target_id ?? '', e.result, e.request_id ?? '', e.ip ?? '', JSON.stringify(e.details)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qazmind_audit_page${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const select = 'px-2.5 py-1.5 text-xs bg-white border border-[#E2DED5] rounded-md text-[#171717] cursor-pointer';

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Журнал аудита</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            {data ? `${data.total} записей` : 'Загрузка…'}. Записи нельзя изменить или удалить. Обновляется каждые 15 секунд.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!data?.items.length}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 text-[#78716C]" /> Выгрузить страницу (CSV)
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={select}>
          {GROUPS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <select value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(1); }} className={select}>
          <option value="all">Любой результат</option>
          <option value="success">Успешно</option>
          <option value="failure">Отказ</option>
        </select>
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Email сотрудника" className={`${select} w-56`} />
      </div>

      {error && <ErrorBlock text={error} onRetry={reload} />}

      <div className="bg-white rounded-xl border border-[#E2DED5] overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-[#F7F6F2] text-[#78716C] border-b border-[#E2DED5]">
              <th className="py-2.5 px-3 w-6" />
              <th className="py-2.5 px-3">Время</th>
              <th className="py-2.5 px-3">Действие</th>
              <th className="py-2.5 px-3">Сотрудник</th>
              <th className="py-2.5 px-3">Объект</th>
              <th className="py-2.5 px-3">Результат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DED5]">
            {(data?.items ?? []).map((e) => (
              <React.Fragment key={e.id}>
                <tr className="hover:bg-[#F9F8F5] cursor-pointer" onClick={() => setOpen(open === e.id ? null : e.id)}>
                  <td className="py-2.5 px-3 text-[#A8A29E]">{open === e.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#78716C]">{fmtDate(e.created_at, true)}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#171717]">{actionLabel(e.action)}</td>
                  <td className="py-2.5 px-3">{e.actor_email ?? '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#5C574F]">{e.target_type ? `${e.target_type}:${e.target_id ?? ''}` : '—'}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={e.result} /></td>
                </tr>
                {open === e.id && (
                  <tr className="bg-[#FCFBF9]">
                    <td />
                    <td colSpan={5} className="py-3 px-3 text-[11px] text-[#5C574F] space-y-1">
                      <div>Роли: {e.actor_roles.length ? e.actor_roles.join(', ') : '—'} · IP: {e.ip ?? '—'} · запрос: <span className="font-mono">{e.request_id ?? '—'}</span></div>
                      <pre className="font-mono whitespace-pre-wrap bg-white border border-[#E2DED5] rounded p-2">{JSON.stringify(e.details, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#78716C]">Записей нет.</td>
              </tr>
            )}
            {!data && loading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#78716C]">Загрузка…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2.5 py-1 border border-[#E2DED5] rounded bg-white disabled:opacity-40 cursor-pointer">Назад</button>
          <span>Страница {page} из {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2.5 py-1 border border-[#E2DED5] rounded bg-white disabled:opacity-40 cursor-pointer">Далее</button>
        </div>
      )}
    </div>
  );
};
