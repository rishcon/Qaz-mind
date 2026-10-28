import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ApiInvitation, ApiLicense, ApiMembership, ApiSchoolClass, ApiTeacher, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { ClassPanel } from './ClassPanel';

interface SchoolCabinetProps {
  onExit: () => void;
  onApply: () => void;
}

const ROLE_TEXT = { SCHOOL_ADMIN: 'Администратор школы', TEACHER: 'Учитель' } as const;
const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const button =
  'px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm';

/** The academic year starts in September: from September 2026 it is 2026-2027. */
function currentAcademicYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/**
 * School workspace. Everything shown comes from the server for the signed-in person: the organizations where they
 * have an active membership, and inside one of them the classes and teachers their role allows.
 */
export const SchoolCabinet: React.FC<SchoolCabinetProps> = ({ onExit, onApply }) => {
  const [memberships, setMemberships] = useState<ApiMembership[] | null>(null);
  const [orgId, setOrgId] = useState('');
  const [tab, setTab] = useState<'classes' | 'teachers'>('classes');
  const [classes, setClasses] = useState<ApiSchoolClass[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [licenses, setLicenses] = useState<ApiLicense[]>([]);
  const [openClass, setOpenClass] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newYear, setNewYear] = useState(currentAcademicYear());

  useEffect(() => {
    schoolApi
      .myOrganizations()
      .then((items) => {
        setMemberships(items);
        if (items[0]) setOrgId(items[0].organization.id);
      })
      .catch((err) => {
        setMemberships([]);
        setError(errorText(err));
      });
  }, []);

  const membership = memberships?.find((m) => m.organization.id === orgId);
  const isAdmin = membership?.role === 'SCHOOL_ADMIN';
  const writable = isAdmin && membership?.organization.status === 'active';

  const load = useCallback(async () => {
    if (!orgId) return;
    setError('');
    try {
      setClasses(await schoolApi.classes(orgId));
      setTeachers(isAdmin ? await schoolApi.teachers(orgId) : []);
      setInvitations(isAdmin ? await schoolApi.invitations(orgId) : []);
      setLicenses(isAdmin ? await schoolApi.licenses(orgId) : []);
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId, isAdmin]);

  useEffect(() => {
    void load();
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

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const grade = newGrade ? Number(newGrade) : null;
    const ok = await run(() => schoolApi.createClass(orgId, { name: newName, academic_year: newYear, grade }));
    if (ok) {
      setNewName('');
      setNewGrade('');
    }
  };

  const toggleTeacherClass = (teacher: ApiTeacher, classId: string) => {
    const next = teacher.class_ids.includes(classId)
      ? teacher.class_ids.filter((id) => id !== classId)
      : [...teacher.class_ids, classId];
    void run(() => schoolApi.setTeacherClasses(orgId, teacher.user_id, next));
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 hover:bg-[#EAE7DF] rounded flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>В кабинет ученика</span>
        </button>
        <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">Кабинет школы</span>
      </header>

      <main className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-[860px] space-y-6">
          {memberships === null && <p className="text-sm text-[#74736F]">Загрузка…</p>}

          {memberships && memberships.length === 0 && (
            <div className="bg-white border border-[#E2DED5] p-8 rounded-sm space-y-4">
              <h1 className="text-2xl font-extrabold tracking-tight">У вас нет подключённой школы</h1>
              <p className="text-sm text-[#74736F] leading-relaxed">
                Кабинет школы открывается администратору после одобрения заявки или учителю по приглашению школы.
              </p>
              {error && <p className="text-xs text-red-700">{error}</p>}
              <button type="button" onClick={onApply} className={button}>
                Подать заявку школы
              </button>
            </div>
          )}

          {membership && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  {memberships!.length > 1 ? (
                    <select className={field} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                      {memberships!.map((m) => (
                        <option key={m.organization.id} value={m.organization.id}>
                          {m.organization.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{membership.organization.name}</h1>
                  )}
                  <p className="text-xs font-mono text-[#74736F] mt-1">
                    {membership.organization.city} · {ROLE_TEXT[membership.role]}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 bg-white p-1 rounded-sm border border-[#E2DED5] text-xs font-mono font-bold">
                    {(['classes', 'teachers'] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`px-3 py-1.5 cursor-pointer ${tab === id ? 'bg-[#171717] text-white' : 'text-[#74736F]'}`}
                      >
                        {id === 'classes' ? 'Классы' : 'Учителя'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {membership.organization.status !== 'active' && (
                <div role="status" className="p-3 border border-amber-300 bg-amber-50 text-xs text-amber-900 rounded-sm">
                  Организация приостановлена или в архиве: изменения недоступны.
                </div>
              )}
              {error && (
                <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
                  {error}
                </div>
              )}

              {tab === 'classes' || !isAdmin ? (
                <section className="space-y-4">
                  {writable && (
                    <form onSubmit={createClass} className="bg-white border border-[#E2DED5] p-4 rounded-sm flex flex-wrap gap-3 items-end">
                      <label className="text-xs font-bold space-y-1">
                        <span className="block">Класс</span>
                        <input className={`${field} w-32`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="11 А" required maxLength={80} />
                      </label>
                      <label className="text-xs font-bold space-y-1">
                        <span className="block">Параллель</span>
                        <input className={`${field} w-20`} value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="11" inputMode="numeric" />
                      </label>
                      <label className="text-xs font-bold space-y-1">
                        <span className="block">Учебный год</span>
                        <input className={`${field} w-32`} value={newYear} onChange={(e) => setNewYear(e.target.value)} required />
                      </label>
                      <button type="submit" disabled={busy} className={button}>
                        Создать класс
                      </button>
                    </form>
                  )}

                  {classes.length === 0 ? (
                    <p className="text-sm text-[#74736F]">
                      {isAdmin ? 'Классов пока нет.' : 'Вам ещё не назначены классы. Их назначает администратор школы.'}
                    </p>
                  ) : (
                    <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
                      {classes.map((c) => (
                        <div key={c.id}>
                        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-bold">
                              {c.name}
                              {c.status === 'archived' && <span className="ml-2 text-xs font-mono text-[#74736F]">в архиве</span>}
                            </div>
                            <div className="text-xs text-[#74736F]">
                              {c.academic_year} · учеников: {c.student_count} · учителей: {c.teacher_count}
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => setOpenClass(openClass === c.id ? '' : c.id)}
                              className="text-xs font-mono font-bold underline underline-offset-4 cursor-pointer"
                            >
                              {openClass === c.id ? 'Свернуть' : 'Управлять'}
                            </button>
                            {writable && isAdmin && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => run(() => schoolApi.updateClass(orgId, c.id, { status: c.status === 'active' ? 'archived' : 'active' }))}
                                className="text-xs font-mono font-bold underline underline-offset-4 text-[#74736F] hover:text-[#171717] cursor-pointer"
                              >
                                {c.status === 'active' ? 'В архив' : 'Вернуть'}
                              </button>
                            )}
                          </div>
                        </div>
                        {openClass === c.id && (
                          <ClassPanel orgId={orgId} classId={c.id} writable={!!membership?.organization && membership.organization.status === 'active'} onChanged={() => void load()} />
                        )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isAdmin && (
                    <p className="text-xs text-[#74736F]">
                      {licenses.find((l) => l.current)
                        ? `Лицензия «${licenses.find((l) => l.current)!.plan}»: занято мест ${licenses.find((l) => l.current)!.seats_used} из ${licenses.find((l) => l.current)!.seat_limit}, действует до ${new Date(licenses.find((l) => l.current)!.expires_at).toLocaleDateString('ru-RU')}.`
                        : 'Действующей лицензии нет: ученики не смогут вступать в классы, пока платформа не выдаст места.'}
                    </p>
                  )}
                </section>
              ) : (
                <section className="space-y-4">
                  <form
                    className="bg-white border border-[#E2DED5] p-4 rounded-sm flex flex-wrap gap-3 items-end"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ok = await run(() => schoolApi.invite(orgId, { email: teacherEmail, role: 'TEACHER' }));
                      if (ok) setTeacherEmail('');
                    }}
                  >
                    <label className="text-xs font-bold space-y-1 flex-1 min-w-[200px]">
                      <span className="block">Пригласить учителя по email</span>
                      <input className={`${field} w-full`} type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="teacher@school.kz" required />
                    </label>
                    <button type="submit" disabled={busy || !writable} className={button}>
                      Отправить приглашение
                    </button>
                  </form>
                  {invitations.filter((i) => i.status === 'pending').length > 0 && (
                    <ul className="text-xs text-[#74736F] space-y-1.5">
                      {invitations.filter((i) => i.status === 'pending').map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-3">
                          <span>
                            {i.email} · {i.role === 'TEACHER' ? 'учитель' : 'ученик'} · до {new Date(i.expires_at).toLocaleDateString('ru-RU')}
                          </span>
                          <button type="button" disabled={busy} className="font-mono font-bold underline underline-offset-4 cursor-pointer" onClick={() => run(() => schoolApi.resendInvitation(orgId, i.id))}>
                            Отправить снова
                          </button>
                          <button type="button" disabled={busy} className="font-mono font-bold underline underline-offset-4 text-red-700 cursor-pointer" onClick={() => run(() => schoolApi.revokeInvitation(orgId, i.id))}>
                            Отозвать
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {teachers.length === 0 ? (
                    <p className="text-sm text-[#74736F]">
                      В организации пока нет учителей. Пригласите учителя по email: после принятия приглашения назначьте ему классы.
                    </p>
                  ) : (
                    <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
                      {teachers.map((t) => (
                        <div key={t.user_id} className="p-4 space-y-2">
                          <div className="font-bold">
                            {t.name} <span className="text-xs font-mono font-normal text-[#74736F]">{t.email}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {classes.filter((c) => c.status === 'active').map((c) => (
                              <label key={c.id} className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={t.class_ids.includes(c.id)}
                                  disabled={busy || !writable}
                                  onChange={() => toggleTeacherClass(t, c.id)}
                                />
                                {c.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
