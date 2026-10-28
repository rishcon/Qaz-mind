import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Building2, ClipboardList, GraduationCap, LayoutDashboard, UserCog, Users } from 'lucide-react';
import { ApiMembership, ApiSchoolApplication, ApiSchoolClass, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { AssignmentsTab } from './AssignmentsTab';
import { ClassesTab } from './ClassesTab';
import { OverviewTab, SchoolTab } from './OverviewTab';
import { StaffTab } from './StaffTab';
import { StudentsTab } from './StudentsTab';

interface SchoolCabinetProps {
  myUserId: string;
  /** 'school' for a school representative or teacher, who has no student dashboard. */
  accountType: 'student' | 'school' | 'managed';
  onExit: () => void;
  onLogout: () => void;
}

const ROLE_TEXT = { SCHOOL_ADMIN: 'Администратор школы', TEACHER: 'Учитель' } as const;
const TAB_KEY = 'qazmind_school_tab';

/**
 * School workspace. Everything shown comes from the server for the signed-in person: the schools where they have an
 * active membership and, inside one of them, what their role allows. An administrator manages the whole school;
 * a teacher sees only the classes assigned to them.
 */
export const SchoolCabinet: React.FC<SchoolCabinetProps> = ({ myUserId, accountType, onExit, onLogout }) => {
  const [memberships, setMemberships] = useState<ApiMembership[] | null>(null);
  const [orgId, setOrgId] = useState('');
  const [tab, setTab] = useState<SchoolTab>(() => {
    try {
      return (sessionStorage.getItem(TAB_KEY) as SchoolTab) || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [classes, setClasses] = useState<ApiSchoolClass[]>([]);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<ApiSchoolApplication[]>([]);

  useEffect(() => {
    schoolApi
      .myApplications()
      .then(setApplications)
      .catch(() => setApplications([]));
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
  const writable = membership?.organization.status === 'active';

  const loadClasses = useCallback(async () => {
    if (!orgId) return;
    try {
      setClasses(await schoolApi.classes(orgId));
      setError('');
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses, version]);

  const changed = () => setVersion((v) => v + 1);
  const go = (next: SchoolTab) => {
    setTab(next);
    try {
      sessionStorage.setItem(TAB_KEY, next);
    } catch {
      // the tab is only a convenience
    }
  };

  const tabs: { id: SchoolTab; label: string; icon: React.ReactNode; admin?: boolean }[] = [
    { id: 'overview', label: 'Обзор', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'classes', label: 'Классы', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'students', label: 'Ученики', icon: <Users className="w-4 h-4" />, admin: true },
    { id: 'staff', label: 'Сотрудники', icon: <UserCog className="w-4 h-4" />, admin: true },
    { id: 'assignments', label: 'Задания', icon: <ClipboardList className="w-4 h-4" /> },
  ];
  const visibleTabs = tabs.filter((t) => !t.admin || isAdmin);
  const active = visibleTabs.some((t) => t.id === tab) ? tab : 'overview';

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between gap-3">
        {accountType === 'school' ? (
          <span className="text-xl font-extrabold tracking-tight font-mono">
            qazmind<span className="text-[#FF5A36]">.</span>
          </span>
        ) : (
          <button type="button" onClick={onExit} className="p-1.5 hover:bg-[#EAE7DF] rounded flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>В кабинет ученика</span>
          </button>
        )}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">Кабинет школы</span>
          {accountType === 'school' && (
            <button type="button" onClick={onLogout} className="text-xs font-mono font-bold underline underline-offset-4 cursor-pointer">
              Выйти
            </button>
          )}
        </div>
      </header>

      {memberships === null && <p className="p-8 text-sm text-[#74736F]">Загрузка…</p>}

      {memberships && memberships.length === 0 && (
        <main className="flex-1 flex justify-center px-4 py-10">
          <div className="w-full max-w-[640px] bg-white border border-[#E2DED5] p-8 rounded-sm space-y-4 h-fit">
            {applications[0]?.status === 'pending' ? (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Заявка на рассмотрении</h1>
                <p className="text-sm text-[#74736F] leading-relaxed">
                  Школа «{applications[0].school_name}» зарегистрирована, заявку проверяет команда QazMind. Когда её одобрят, здесь откроется кабинет школы, и мы напишем на вашу почту.
                  Пока ничего делать не нужно.
                </p>
              </>
            ) : applications[0]?.status === 'rejected' ? (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">Заявка отклонена</h1>
                <p className="text-sm text-[#74736F] leading-relaxed">Школа «{applications[0].school_name}». Причина: {applications[0].rejection_reason || 'не указана'}.</p>
                <p className="text-xs text-[#74736F]">Для новой заявки зарегистрируйте школу с другим email или напишите в QazMind.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">У вас нет подключённой школы</h1>
                <p className="text-sm text-[#74736F] leading-relaxed">Кабинет школы открывается после одобрения заявки школы или после того, как администратор школы создаст вам логин.</p>
              </>
            )}
            {error && <p className="text-xs text-red-700">{error}</p>}
          </div>
        </main>
      )}

      {membership && (
        <div className="flex-1 flex flex-col md:flex-row max-w-[1200px] w-full mx-auto">
          <aside className="md:w-56 shrink-0 md:border-r border-[#E2DED5] p-4 md:py-8 space-y-4">
            <div>
              {memberships!.length > 1 ? (
                <select
                  className="w-full px-2 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm font-bold"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                >
                  {memberships!.map((m) => (
                    <option key={m.organization.id} value={m.organization.id}>
                      {m.organization.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-1 text-[#FF5A36] shrink-0" />
                  <div className="font-extrabold leading-snug">{membership.organization.name}</div>
                </div>
              )}
              <p className="text-[11px] font-mono text-[#74736F] mt-1">
                {membership.organization.city} · {ROLE_TEXT[membership.role]}
              </p>
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded cursor-pointer whitespace-nowrap ${
                    active === t.id ? 'bg-white font-bold text-[#171717] border border-[#E2DED5]' : 'text-[#74736F] hover:bg-[#EAE7DF]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 px-4 md:px-8 py-6 md:py-8 min-w-0 space-y-5">
            <h1 className="text-2xl font-extrabold tracking-tight">{visibleTabs.find((t) => t.id === active)?.label}</h1>
            {membership.organization.status !== 'active' && (
              <div role="status" className="p-3 border border-amber-300 bg-amber-50 text-xs text-amber-900 rounded-sm">
                Школа приостановлена или в архиве: данные видны, но изменения недоступны. Свяжитесь с QazMind.
              </div>
            )}
            {error && (
              <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
                {error}
              </div>
            )}

            {active === 'overview' && <OverviewTab orgId={orgId} isAdmin={!!isAdmin} onGo={go} version={version} />}
            {active === 'classes' && <ClassesTab orgId={orgId} classes={classes} isAdmin={!!isAdmin} writable={!!writable} onChanged={changed} />}
            {active === 'students' && isAdmin && <StudentsTab orgId={orgId} version={version} />}
            {active === 'staff' && isAdmin && <StaffTab orgId={orgId} classes={classes} writable={!!writable} myUserId={myUserId} onChanged={changed} />}
            {active === 'assignments' && <AssignmentsTab orgId={orgId} classes={classes} writable={!!writable} />}
          </main>
        </div>
      )}
    </div>
  );
};
