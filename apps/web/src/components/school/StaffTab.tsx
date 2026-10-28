import React, { useCallback, useEffect, useState } from 'react';
import { ApiInvitation, ApiSchoolClass, ApiTeacher, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

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
const ROLE_TEXT = { TEACHER: 'учитель', SCHOOL_ADMIN: 'администратор школы', STUDENT: 'ученик' } as const;

/** Teachers and administrators of the school: invitations, class assignment and removal. */
export const StaffTab: React.FC<StaffTabProps> = ({ orgId, classes, writable, myUserId, onChanged }) => {
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [admins, setAdmins] = useState<{ user_id: string; name: string; email: string }[]>([]);
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'SCHOOL_ADMIN'>('TEACHER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [t, i, a] = await Promise.all([schoolApi.teachers(orgId), schoolApi.invitations(orgId), schoolApi.admins(orgId)]);
      setTeachers(t);
      setAdmins(a);
      setInvitations(i.filter((x) => x.status === 'pending' && x.role !== 'STUDENT'));
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, success = '') => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await action();
      if (success) setNote(success);
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

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const sent = email.trim().toLowerCase();
    const ok = await run(() => schoolApi.invite(orgId, { email: sent, role }), `Приглашение отправлено на ${sent}. Ссылка действует 7 дней.`);
    if (ok) setEmail('');
  };

  const toggleClass = (t: ApiTeacher, classId: string) => {
    const next = t.class_ids.includes(classId) ? t.class_ids.filter((x) => x !== classId) : [...t.class_ids, classId];
    void run(() => schoolApi.setTeacherClasses(orgId, t.user_id, next));
  };

  const active = classes.filter((c) => c.status === 'active');

  return (
    <section className="space-y-5">
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {note && <div className="text-xs text-[#258568] font-medium">{note}</div>}

      {writable && (
        <form onSubmit={invite} className="bg-white border border-[#E2DED5] p-4 rounded-sm flex flex-wrap gap-3 items-end">
          <label className="text-xs font-bold space-y-1 flex-1 min-w-[220px]">
            <span className="block">Email сотрудника</span>
            <input className={`${field} w-full`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.kz" required />
          </label>
          <label className="text-xs font-bold space-y-1">
            <span className="block">Роль</span>
            <select className={field} value={role} onChange={(e) => setRole(e.target.value as 'TEACHER' | 'SCHOOL_ADMIN')}>
              <option value="TEACHER">Учитель</option>
              <option value="SCHOOL_ADMIN">Администратор школы</option>
            </select>
          </label>
          <button type="submit" disabled={busy} className={button}>
            Пригласить
          </button>
          <p className="basis-full text-[11px] text-[#74736F]">
            Человек получает письмо, входит в свой аккаунт QazMind (или создаёт его с этим адресом) и принимает приглашение. Учитель видит только назначенные ему классы;
            администратор управляет всей школой.
          </p>
        </form>
      )}

      {invitations.length > 0 && (
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Ждут ответа ({invitations.length})</h3>
          <ul className="text-xs text-[#74736F] space-y-1.5">
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3">
                <span>
                  {i.email} · {ROLE_TEXT[i.role]} · до {new Date(i.expires_at).toLocaleDateString('ru-RU')}
                </span>
                {writable && (
                  <>
                    <button type="button" disabled={busy} className={link} onClick={() => run(() => schoolApi.resendInvitation(orgId, i.id), 'Письмо отправлено снова, прежняя ссылка больше не работает.')}>
                      Отправить снова
                    </button>
                    <button type="button" disabled={busy} className={`${link} text-red-700`} onClick={() => run(() => schoolApi.revokeInvitation(orgId, i.id))}>
                      Отозвать
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Администраторы школы ({admins.length})</h3>
        <ul className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
          {admins.map((a) => (
            <li key={a.user_id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <b>{a.name}</b> <span className="text-xs font-mono text-[#74736F]">{a.email}</span>
                {a.user_id === myUserId && <span className="ml-2 text-xs text-[#74736F]">это вы</span>}
              </span>
              {writable && a.user_id !== myUserId && (
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
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Учителя ({teachers.filter((t) => t.status === 'active').length})</h3>
        {teachers.filter((t) => t.status === 'active').length === 0 ? (
          <p className="text-sm text-[#74736F]">Учителей пока нет. Пригласите первого по email: после принятия отметьте его классы.</p>
        ) : (
          <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
            {teachers
              .filter((t) => t.status === 'active')
              .map((t) => (
                <div key={t.user_id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold">
                      {t.name} <span className="text-xs font-mono font-normal text-[#74736F]">{t.email}</span>
                    </div>
                    {writable && (
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
