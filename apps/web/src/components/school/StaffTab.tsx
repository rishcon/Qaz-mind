import React, { useCallback, useEffect, useState } from 'react';
import { ApiCreatedAccount, ApiSchoolClass, ApiTeacher, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { Credentials } from './Credentials';

interface StaffTabProps {
  orgId: string;
  classes: ApiSchoolClass[];
  writable: boolean;
  myUserId: string;
  onChanged: () => void;
}

const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const button =
  'px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm';
const link = 'font-mono font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40';

/** Teachers and administrators of the school. The school creates their logins and passwords itself. */
export const StaffTab: React.FC<StaffTabProps> = ({ orgId, classes, writable, myUserId, onChanged }) => {
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [admins, setAdmins] = useState<{ user_id: string; name: string; email: string }[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'SCHOOL_ADMIN'>('TEACHER');
  const [picked, setPicked] = useState<string[]>([]);
  const [manual, setManual] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState<{ title: string; items: Pick<ApiCreatedAccount, 'name' | 'username' | 'password'>[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([schoolApi.teachers(orgId), schoolApi.admins(orgId)]);
      setTeachers(t);
      setAdmins(a);
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
      onChanged();
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
    const ok = await run(async () => {
      const account = await schoolApi.createAccount(orgId, {
        role,
        name,
        class_ids: role === 'TEACHER' ? picked : [],
        username: manual && login.trim() ? login.trim() : undefined,
        password: manual && password ? password : undefined,
      });
      setCreated({ title: `Создан аккаунт: ${account.name}`, items: [account] });
    });
    if (ok) {
      setName('');
      setPicked([]);
      setLogin('');
      setPassword('');
    }
  };

  const resetPassword = async (user: { user_id: string; name: string }) => {
    if (!window.confirm(`Выдать ${user.name} новый пароль? Прежний перестанет работать.`)) return;
    await run(async () => {
      const r = await schoolApi.resetPassword(orgId, user.user_id);
      setCreated({ title: `Новый пароль: ${r.name}`, items: [r] });
    });
  };

  const toggleClass = (t: ApiTeacher, classId: string) => {
    const next = t.class_ids.includes(classId) ? t.class_ids.filter((x) => x !== classId) : [...t.class_ids, classId];
    void run(() => schoolApi.setTeacherClasses(orgId, t.user_id, next));
  };

  const active = classes.filter((c) => c.status === 'active');
  const activeTeachers = teachers.filter((t) => t.status === 'active');

  return (
    <section className="space-y-5">
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {created && <Credentials title={created.title} items={created.items} onClose={() => setCreated(null)} />}

      {writable && (
        <form onSubmit={create} className="bg-white border border-[#E2DED5] p-4 rounded-sm space-y-3">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Создать аккаунт сотрудника</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs font-bold space-y-1 flex-1 min-w-[220px]">
              <span className="block">Фамилия и имя</span>
              <input className={`${field} w-full`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Сергеева Анна" required minLength={2} maxLength={80} />
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Роль</span>
              <select className={field} value={role} onChange={(e) => setRole(e.target.value as 'TEACHER' | 'SCHOOL_ADMIN')}>
                <option value="TEACHER">Учитель</option>
                <option value="SCHOOL_ADMIN">Администратор школы</option>
              </select>
            </label>
            <button type="submit" disabled={busy || name.trim().length < 2} className={button}>
              Создать логин
            </button>
          </div>
          {role === 'TEACHER' && active.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
              <span className="text-xs font-bold">Классы учителя:</span>
              {active.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => setPicked((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))} />
                  {c.name}
                </label>
              ))}
            </div>
          )}
          <button type="button" className={`${link} text-xs text-[#74736F]`} onClick={() => setManual(!manual)}>
            {manual ? 'Скрыть ручной ввод' : 'Задать логин и пароль вручную'}
          </button>
          {manual && (
            <div className="flex flex-wrap gap-3">
              <input className={`${field} w-48`} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="логин (латиницей)" maxLength={40} />
              <input className={`${field} w-48`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="пароль (от 8 символов)" maxLength={128} />
            </div>
          )}
          <p className="text-[11px] text-[#74736F]">
            Если логин и пароль не заданы, система придумает их сама. Человек входит на qazmind со своим логином и при первом входе заменяет временный пароль.
            Учитель видит только назначенные ему классы; администратор управляет всей школой.
          </p>
        </form>
      )}

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Администраторы школы ({admins.length})</h3>
        <ul className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
          {admins.map((a) => (
            <li key={a.user_id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <b>{a.name}</b> <span className="text-xs font-mono text-[#74736F]">{a.email.endsWith('@managed.invalid') ? a.email.replace('@managed.invalid', '') : a.email}</span>
                {a.user_id === myUserId && <span className="ml-2 text-xs text-[#74736F]">это вы</span>}
              </span>
              {writable && a.user_id !== myUserId && (
                <span className="flex gap-4">
                  {a.email.endsWith('@managed.invalid') && (
                    <button type="button" disabled={busy} className={`${link} text-xs text-[#74736F] hover:text-[#171717]`} onClick={() => resetPassword(a)}>
                      Новый пароль
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    className={`${link} text-xs text-[#74736F] hover:text-red-700`}
                    onClick={() => {
                      if (window.confirm(`Убрать ${a.name} из администраторов школы?`)) void run(() => schoolApi.revokeMember(orgId, a.user_id));
                    }}
                  >
                    Убрать
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Учителя ({activeTeachers.length})</h3>
        {activeTeachers.length === 0 ? (
          <p className="text-sm text-[#74736F]">Учителей пока нет. Создайте первого выше: система выдаст логин и пароль.</p>
        ) : (
          <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
            {activeTeachers.map((t) => (
              <div key={t.user_id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold">
                    {t.name} <span className="text-xs font-mono font-normal text-[#74736F]">{t.username ?? t.email}</span>
                  </div>
                  {writable && (
                    <span className="flex gap-4">
                      {t.username && (
                        <button type="button" disabled={busy} className={`${link} text-xs text-[#74736F] hover:text-[#171717]`} onClick={() => resetPassword(t)}>
                          Новый пароль
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        className={`${link} text-xs text-[#74736F] hover:text-red-700`}
                        onClick={() => {
                          if (window.confirm(`Убрать ${t.name} из школы? Доступ к классам будет закрыт.`)) void run(() => schoolApi.revokeMember(orgId, t.user_id));
                        }}
                      >
                        Убрать из школы
                      </button>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
                  <span className="text-xs text-[#74736F]">Классы:</span>
                  {active.length === 0 && <span className="text-xs text-[#74736F]">сначала создайте классы</span>}
                  {active.map((c) => (
                    <label key={c.id} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={t.class_ids.includes(c.id)} disabled={busy || !writable} onChange={() => toggleClass(t, c.id)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
