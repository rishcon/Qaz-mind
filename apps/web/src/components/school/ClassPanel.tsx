import React, { useCallback, useEffect, useState } from 'react';
import { ApiClassStudent, ApiCreatedAccount, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { Credentials } from './Credentials';

interface ClassPanelProps {
  orgId: string;
  classId: string;
  /** False when the school is suspended: the list stays readable, nothing can be changed. */
  writable: boolean;
  /** Only a school administrator creates accounts and resets passwords. */
  isAdmin: boolean;
  onChanged: () => void;
}

const small = 'text-xs font-mono font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40';

/** Students of one class: the list with logins, adding students (one by one or a whole list) and password reset. */
export const ClassPanel: React.FC<ClassPanelProps> = ({ orgId, classId, writable, isAdmin, onChanged }) => {
  const [students, setStudents] = useState<ApiClassStudent[]>([]);
  const [names, setNames] = useState('');
  const [created, setCreated] = useState<{ title: string; items: Pick<ApiCreatedAccount, 'name' | 'username' | 'password'>[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setStudents(await schoolApi.students(orgId, classId));
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean);
    if (list.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const result = await schoolApi.createStudents(orgId, classId, list);
      setCreated({ title: `Созданы ученики: ${result.items.length}`, items: result.items });
      setNames('');
      await load();
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (s: ApiClassStudent) => {
    if (!window.confirm(`Выдать ${s.name} новый пароль? Прежний перестанет работать, а ученик будет выведен из аккаунта.`)) return;
    setBusy(true);
    setError('');
    try {
      const r = await schoolApi.resetPassword(orgId, s.user_id);
      setCreated({ title: `Новый пароль: ${r.name}`, items: [r] });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: ApiClassStudent) => {
    if (!window.confirm(`Убрать ${s.name} из класса? Место лицензии освободится, личный прогресс сохранится.`)) return;
    setBusy(true);
    setError('');
    try {
      await schoolApi.removeStudent(orgId, classId, s.user_id);
      await load();
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[#EFECE4] bg-[#FAF9F6] p-4 space-y-5">
      {error && (
        <div role="alert" className="p-2.5 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {created && <Credentials title={created.title} items={created.items} onClose={() => setCreated(null)} />}

      {writable && isAdmin && (
        <form onSubmit={addStudents} className="space-y-2">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Добавить учеников</h3>
          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            rows={4}
            placeholder={'Иванов Пётр\nСергеева Анна\nКим Алия'}
            className="w-full px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || !names.trim()}
              className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
            >
              Создать логины
            </button>
            <span className="text-[11px] text-[#74736F]">
              По одному имени в строке (до 60 за раз). Каждому ученику система создаст логин и временный пароль и займёт место лицензии.
            </span>
          </div>
        </form>
      )}

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Ученики ({students.length})</h3>
        {students.length === 0 ? (
          <p className="text-xs text-[#74736F]">В классе пока нет учеников.</p>
        ) : (
          <ul className="space-y-1.5">
            {students.map((s) => (
              <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {s.name} <span className="text-xs font-mono text-[#74736F]">{s.username ?? s.email}</span>
                </span>
                {writable && isAdmin && (
                  <span className="flex gap-4">
                    {s.username && (
                      <button type="button" disabled={busy} className={`${small} text-[#74736F] hover:text-[#171717]`} onClick={() => reset(s)}>
                        Новый пароль
                      </button>
                    )}
                    <button type="button" disabled={busy} className={`${small} text-[#74736F] hover:text-red-700`} onClick={() => remove(s)}>
                      Убрать из класса
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
