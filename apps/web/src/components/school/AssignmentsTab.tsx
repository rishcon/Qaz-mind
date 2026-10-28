import React, { useCallback, useEffect, useState } from 'react';
import { ApiAssignment, ApiAssignmentResults, ApiSchoolClass, ApiSubject, assignmentApi, learningApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface AssignmentsTabProps {
  orgId: string;
  classes: ApiSchoolClass[];
  writable: boolean;
}

const STATUS_TEXT = { draft: 'черновик', published: 'опубликовано', closed: 'закрыто', archived: 'в архиве' } as const;
const STATE_TEXT = { not_started: 'не приступал', in_progress: 'в процессе', submitted: 'сдал' } as const;
const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const button =
  'px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm';
const link = 'text-xs font-mono font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—');

/** Assignments of a school: the list, a form for a new one and the results of each. */
export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ orgId, classes, writable }) => {
  const [items, setItems] = useState<ApiAssignment[]>([]);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [results, setResults] = useState<ApiAssignmentResults | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [count, setCount] = useState('10');
  const [due, setDue] = useState('');
  const [attempts, setAttempts] = useState('1');
  const [policy, setPolicy] = useState<'best' | 'last'>('best');
  const [reveal, setReveal] = useState<'after_submit' | 'after_close'>('after_close');
  const [picked, setPicked] = useState<string[]>([]);

  const activeClasses = classes.filter((c) => c.status === 'active');
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? '—';

  const load = useCallback(async () => {
    try {
      setItems(await assignmentApi.list(orgId));
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId]);

  useEffect(() => {
    void load();
    learningApi
      .listSubjects()
      .then((list) => {
        setSubjects(list);
        setSubjectId((current) => current || list[0]?.id || '');
      })
      .catch(() => setSubjects([]));
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(() =>
      assignmentApi.create(orgId, {
        title,
        subject_id: subjectId,
        question_count: Number(count),
        class_ids: picked,
        due_at: due ? new Date(due).toISOString() : null,
        max_attempts: Number(attempts),
        score_policy: policy,
        reveal,
      }),
    );
    if (ok) {
      setTitle('');
      setPicked([]);
    }
  };

  const showResults = async (id: string) => {
    setError('');
    try {
      setResults(await assignmentApi.results(orgId, id));
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <section className="space-y-4">
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}

      {writable && (
        <form onSubmit={create} className="bg-white border border-[#E2DED5] p-4 rounded-sm space-y-3">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Новое задание</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs font-bold space-y-1 flex-1 min-w-[200px]">
              <span className="block">Название</span>
              <input className={`${field} w-full`} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={160} />
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Предмет</span>
              <select className={field} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title_ru}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Вопросов</span>
              <input className={`${field} w-20`} value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" required />
            </label>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs font-bold space-y-1">
              <span className="block">Срок сдачи</span>
              <input className={field} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Попыток</span>
              <input className={`${field} w-20`} value={attempts} onChange={(e) => setAttempts(e.target.value)} inputMode="numeric" required />
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Итог — это</span>
              <select className={field} value={policy} onChange={(e) => setPolicy(e.target.value as 'best' | 'last')}>
                <option value="best">лучшая попытка</option>
                <option value="last">последняя попытка</option>
              </select>
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Ученик видит результат</span>
              <select className={field} value={reveal} onChange={(e) => setReveal(e.target.value as 'after_submit' | 'after_close')}>
                <option value="after_close">после закрытия задания</option>
                <option value="after_submit">сразу после сдачи</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
            <span className="text-xs font-bold">Классы:</span>
            {activeClasses.length === 0 && <span className="text-xs text-[#74736F]">нет доступных классов</span>}
            {activeClasses.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={picked.includes(c.id)}
                  onChange={() => setPicked((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}
                />
                {c.name}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy || picked.length === 0 || !subjectId} className={button}>
            Создать черновик
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[#74736F]">Заданий пока нет.</p>
      ) : (
        <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
          {items.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold">
                  {a.title} <span className="ml-1 text-xs font-mono font-normal text-[#74736F]">{STATUS_TEXT[a.status]}</span>
                </div>
                <div className="text-xs text-[#74736F]">
                  {a.question_count} вопр. · {a.class_ids.map(className).join(', ')} · срок: {fmtDate(a.due_at)} · попыток: {a.max_attempts} · сдали:{' '}
                  {a.submitted_count}
                </div>
              </div>
              <div className="flex gap-4">
                {a.status !== 'draft' && (
                  <button type="button" className={link} onClick={() => showResults(a.id)}>
                    Результаты
                  </button>
                )}
                {writable && a.status === 'draft' && (
                  <button type="button" disabled={busy} className={`${link} text-[#258568]`} onClick={() => run(() => assignmentApi.action(orgId, a.id, 'publish'))}>
                    Опубликовать
                  </button>
                )}
                {writable && a.status === 'published' && (
                  <button type="button" disabled={busy} className={link} onClick={() => run(() => assignmentApi.action(orgId, a.id, 'close'))}>
                    Закрыть
                  </button>
                )}
                {writable && (a.status === 'draft' || a.status === 'closed') && (
                  <button type="button" disabled={busy} className={`${link} text-[#74736F]`} onClick={() => run(() => assignmentApi.action(orgId, a.id, 'archive'))}>
                    В архив
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="bg-white border border-[#E2DED5] rounded-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">{results.assignment.title}</h3>
            <button type="button" className={link} onClick={() => setResults(null)}>
              Закрыть
            </button>
          </div>
          <p className="text-xs text-[#74736F]">
            Итог ученика — {results.score_policy === 'best' ? 'лучшая' : 'последняя'} попытка. Сдали {results.submitted} из {results.total_students}
            {results.average_final !== null && `, средний балл ${results.average_final}`}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-mono uppercase text-[#74736F]">
                <tr>
                  <th className="py-1.5 pr-3">Ученик</th>
                  <th className="pr-3">Класс</th>
                  <th className="pr-3">Статус</th>
                  <th className="pr-3">Попыток</th>
                  <th className="pr-3">Лучший</th>
                  <th className="pr-3">Последний</th>
                  <th>Итог</th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((r) => (
                  <tr key={r.student_id} className="border-t border-[#EFECE4]">
                    <td className="py-1.5 pr-3">{r.name}</td>
                    <td className="pr-3">{r.class_name}</td>
                    <td className="pr-3">{STATE_TEXT[r.state]}</td>
                    <td className="pr-3">{r.attempts}</td>
                    <td className="pr-3">{r.best_score ?? '—'}</td>
                    <td className="pr-3">{r.last_score ?? '—'}</td>
                    <td className="font-bold">{r.final_score === null ? '—' : `${r.final_score} / ${r.max_score}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
