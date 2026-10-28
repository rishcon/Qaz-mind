import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../../types';
import { ApiMyAssignment, assignmentApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface AssignmentsViewProps {
  currentLang: Language;
  onOpenAttempt: (attemptId: string) => void;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : 'без срока');

/** Assignments given by the teachers of the student's classes. Results appear only when the teacher allows it. */
export const AssignmentsView: React.FC<AssignmentsViewProps> = ({ currentLang, onOpenAttempt }) => {
  const isKz = currentLang === 'kz';
  const [items, setItems] = useState<ApiMyAssignment[] | null>(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await assignmentApi.mine());
    } catch (err) {
      setItems([]);
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (a: ApiMyAssignment) => {
    setBusyId(a.id);
    setError('');
    try {
      if (a.in_progress_attempt_id) onOpenAttempt(a.in_progress_attempt_id);
      else onOpenAttempt((await assignmentApi.start(a.id)).id);
    } catch (err) {
      setError(errorText(err));
      await load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">{isKz ? 'Мектеп тапсырмалары' : 'Задания школы'}</h1>
        <p className="mt-1 text-sm text-[#74736F]">
          {isKz
            ? 'Мұғалім берген тапсырмалар. Бұл нәтижелер жеке дайындық прогресіне әсер етпейді.'
            : 'Задания от учителей вашего класса. Эти результаты отдельны от личной подготовки и не меняют её.'}
        </p>
      </div>
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {items === null ? (
        <p className="text-sm text-[#74736F]">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#74736F]">Пока нет заданий.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white border border-[#E2DED5] p-5 rounded-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold">{a.title}</div>
                <div className="text-xs text-[#74736F]">
                  {a.organization_name} · {a.class_name}{a.language === 'kz' ? ' (қазақша)' : ''} · {a.question_count} вопр. · срок: {fmt(a.due_at)} · попыток: {a.attempts.filter((x) => x.submitted).length} из{' '}
                  {a.max_attempts}
                </div>
                <div className="text-xs">
                  {a.status === 'closed' && <span className="font-mono text-[#74736F]">закрыто · </span>}
                  {a.result_visible && a.final_score !== null ? (
                    <b>
                      Результат: {a.final_score} / {a.max_score} ({a.score_policy === 'best' ? 'лучшая попытка' : 'последняя попытка'})
                    </b>
                  ) : a.attempts.some((x) => x.submitted) ? (
                    <span className="text-[#74736F]">Сдано. Результат откроет учитель.</span>
                  ) : null}
                </div>
              </div>
              {(a.can_start || a.in_progress_attempt_id) && (
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => open(a)}
                  className="px-5 py-2.5 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
                >
                  {a.in_progress_attempt_id ? 'Продолжить' : 'Начать'}
                </button>
              )}
              {!a.can_start && !a.in_progress_attempt_id && a.attempts.some((x) => x.submitted) && (
                <button
                  type="button"
                  onClick={() => onOpenAttempt(a.attempts.filter((x) => x.submitted).slice(-1)[0].id)}
                  className="text-xs font-mono font-bold underline underline-offset-4 cursor-pointer"
                >
                  Открыть попытку
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
