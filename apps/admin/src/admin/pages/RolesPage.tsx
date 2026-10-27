import React, { useState } from 'react';
import { ShieldCheck, Check, X, UserPlus } from 'lucide-react';
import { adminApi, StaffMember, StaffRole } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { ROLE_TITLES, useStaff } from '../auth/StaffAuth';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, fmtDate } from '../components/ui/PageState';

/** Permission scopes the server checks on every request. The matrix below is the specification of roles. */
const PERMISSIONS = [
  { key: 'users.read', label: 'Просмотр учеников и профилей' },
  { key: 'users.suspend', label: 'Блокировка учётных записей и завершение сессий' },
  { key: 'schools.read', label: 'Просмотр реестра школ и классов' },
  { key: 'schools.approve', label: 'Одобрение заявок школ' },
  { key: 'content.create', label: 'Создание тем, уроков и вопросов' },
  { key: 'content.edit', label: 'Редактирование черновиков' },
  { key: 'content.review', label: 'Рецензирование' },
  { key: 'content.publish', label: 'Публикация' },
  { key: 'exams.manage', label: 'Конструирование экзаменов' },
  { key: 'support.manage', label: 'Обращения пользователей и школ' },
  { key: 'reports.resolve', label: 'Разбор жалоб на задания' },
  { key: 'finance.manage', label: 'Лицензии и квоты мест' },
  { key: 'monitoring.read', label: 'Мониторинг' },
  { key: 'audit.read', label: 'Журнал аудита' },
  { key: 'staff.manage', label: 'Приглашение сотрудников и назначение ролей' },
  { key: 'settings.manage', label: 'Параметры платформы' },
];

const ROLES: StaffRole[] = ['OWNER', 'PLATFORM_ADMIN', 'CONTENT_MANAGER', 'CONTENT_REVIEWER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'ANALYST'];

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  OWNER: PERMISSIONS.map((p) => p.key),
  PLATFORM_ADMIN: ['users.read', 'users.suspend', 'schools.read', 'schools.approve', 'support.manage', 'reports.resolve', 'monitoring.read', 'audit.read'],
  CONTENT_MANAGER: ['content.create', 'content.edit', 'exams.manage'],
  CONTENT_REVIEWER: ['content.review', 'content.publish', 'reports.resolve'],
  SUPPORT_AGENT: ['support.manage', 'users.read', 'reports.resolve'],
  FINANCE_MANAGER: ['finance.manage', 'schools.read'],
  ANALYST: ['users.read', 'schools.read', 'monitoring.read'],
};

const RolePicker: React.FC<{ value: StaffRole[]; onChange: (roles: StaffRole[]) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
    {ROLES.map((role) => (
      <label key={role} className="flex items-center gap-2 text-xs text-[#171717] cursor-pointer">
        <input
          type="checkbox"
          checked={value.includes(role)}
          onChange={(e) => onChange(e.target.checked ? [...value, role] : value.filter((r) => r !== role))}
          className="rounded text-[#FF5A36]"
        />
        {ROLE_TITLES[role]}
      </label>
    ))}
  </div>
);

export const RolesPage: React.FC = () => {
  const { session } = useStaff();
  const staff = useAdminData(() => adminApi.staff(), [], 30000);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [invite, setInvite] = useState<{ email: string; name: string; roles: StaffRole[] } | null>(null);
  const [editing, setEditing] = useState<{ member: StaffMember; roles: StaffRole[] } | null>(null);
  const field = 'w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md';

  const act = async (action: () => Promise<unknown>, text: string) => {
    const ok = await runAction(action, text, setResult);
    if (ok) staff.reload();
    return ok;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Администраторы и роли</h1>
        <p className="text-xs text-[#78716C] mt-1 leading-relaxed max-w-3xl">
          Сотрудников приглашает владелец. Приглашение приходит на почту, пароль (от 12 символов) задаёт сам сотрудник,
          вход подтверждается кодом из приложения. Свои роли изменить нельзя; последнего владельца отключить нельзя.
        </p>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      {staff.error && <ErrorBlock text={staff.error} onRetry={staff.reload} />}

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Сотрудники платформы</h2>
          <button
            onClick={() => setInvite({ email: '', name: '', roles: [] })}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#171717] hover:bg-[#FF5A36] rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Пригласить сотрудника
          </button>
        </div>

        {invite && (
          <div className="p-4 rounded-lg border border-[#FF5A36]/30 bg-[#FFF7F5] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="Email" type="email" className={field} />
              <input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Имя и фамилия" className={field} />
            </div>
            <RolePicker value={invite.roles} onChange={(roles) => setInvite({ ...invite, roles })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setInvite(null)} className="px-3 py-1.5 text-xs bg-white border border-[#E2DED5] rounded cursor-pointer">Отмена</button>
              <button
                disabled={!invite.email.includes('@') || !invite.name.trim() || invite.roles.length === 0}
                onClick={async () => {
                  if (await act(() => adminApi.invite(invite.email.trim(), invite.name.trim(), invite.roles), `Приглашение отправлено на ${invite.email.trim()}.`)) setInvite(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] rounded cursor-pointer disabled:opacity-40"
              >
                Отправить приглашение
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2DED5] text-[#78716C]">
                <th className="py-2 px-2">Сотрудник</th>
                <th className="py-2 px-2">Роли</th>
                <th className="py-2 px-2">Статус</th>
                <th className="py-2 px-2">2FA</th>
                <th className="py-2 px-2">Последний вход</th>
                <th className="py-2 px-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DED5]">
              {(staff.data?.items ?? []).map((m) => {
                const self = m.id === session?.staff.id;
                return (
                  <tr key={m.id}>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-[#171717]">{m.name}{self ? ' (вы)' : ''}</div>
                      <div className="text-[11px] text-[#78716C]">{m.email}</div>
                    </td>
                    <td className="py-2.5 px-2 text-[#5C574F]">{m.roles.map((r) => ROLE_TITLES[r]).join(', ')}</td>
                    <td className="py-2.5 px-2"><StatusBadge status={m.status} /></td>
                    <td className="py-2.5 px-2">{m.mfa_enabled ? 'включена' : 'не настроена'}</td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-[#78716C]">{fmtDate(m.last_sign_in_at, true)}</td>
                    <td className="py-2.5 px-2">
                      {!self && (
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <button onClick={() => setEditing({ member: m, roles: m.roles })} className="px-2 py-1 border border-[#E2DED5] rounded bg-white hover:bg-[#F5F3EE] cursor-pointer">Роли</button>
                          {m.status === 'invited' && (
                            <button onClick={() => void act(() => adminApi.invite(m.email, m.name, m.roles), 'Приглашение отправлено повторно.')} className="px-2 py-1 border border-[#E2DED5] rounded bg-white hover:bg-[#F5F3EE] cursor-pointer">Повторить приглашение</button>
                          )}
                          {m.status === 'active' && (
                            <>
                              <button onClick={() => void act(() => adminApi.revokeStaffSessions(m.id), 'Сессии сотрудника завершены.')} className="px-2 py-1 border border-[#E2DED5] rounded bg-white hover:bg-[#F5F3EE] cursor-pointer">Завершить сессии</button>
                              <button onClick={() => void act(() => adminApi.disableStaff(m.id), 'Сотрудник отключён, сессии завершены.')} className="px-2 py-1 border border-[#FCA5A5] text-[#C94A43] rounded bg-white hover:bg-[#FFF1F2] cursor-pointer">Отключить</button>
                            </>
                          )}
                          {m.status === 'disabled' && (
                            <button onClick={() => void act(() => adminApi.enableStaff(m.id), 'Сотрудник включён.')} className="px-2 py-1 border border-[#A7F3D0] text-[#258568] rounded bg-white hover:bg-[#EBF7F2] cursor-pointer">Включить</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#171717]">Роли: {editing.member.name}</h3>
            <RolePicker value={editing.roles} onChange={(roles) => setEditing({ ...editing, roles })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs bg-white border border-[#E2DED5] rounded cursor-pointer">Отмена</button>
              <button
                disabled={editing.roles.length === 0}
                onClick={async () => {
                  if (await act(() => adminApi.setRoles(editing.member.id, editing.roles), 'Роли обновлены.')) setEditing(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] rounded cursor-pointer disabled:opacity-40"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#258568]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Матрица полномочий</h2>
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2DED5] bg-[#FAF9F6] text-[#78716C]">
              <th className="py-2.5 px-3">Право</th>
              {ROLES.map((r) => (
                <th key={r} className="py-2.5 px-2 text-center font-semibold">{ROLE_TITLES[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DED5]">
            {PERMISSIONS.map((perm) => (
              <tr key={perm.key}>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-[#171717]">{perm.label}</div>
                  <div className="font-mono text-[10px] text-[#A8A29E]">{perm.key}</div>
                </td>
                {ROLES.map((r) => (
                  <td key={r} className="py-2.5 px-2 text-center">
                    {ROLE_PERMISSIONS[r].includes(perm.key) ? <Check className="w-4 h-4 text-[#258568] mx-auto" /> : <X className="w-4 h-4 text-[#D5D0C5] mx-auto" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-[#78716C]">Сервер проверяет эти права на каждом запросе; скрытый пункт меню сам по себе доступ не ограничивает.</p>
      </div>
    </div>
  );
};
