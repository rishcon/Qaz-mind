import React from 'react';
import { ShieldCheck, Check, X, UserPlus } from 'lucide-react';
import { RoleType } from '../types';
import { adminService, ADMIN_API_CONNECTED } from '../services/adminService';

/** Permission scopes the server checks on every request. The matrix below is the specification of roles. */
const PERMISSIONS = [
  { key: 'users.read', label: 'Просмотр пользователей и профилей' },
  { key: 'users.suspend', label: 'Блокировка и разблокировка учетных записей' },
  { key: 'schools.read', label: 'Просмотр реестра школ и классов' },
  { key: 'schools.approve', label: 'Верификация и одобрение заявок школ' },
  { key: 'content.create', label: 'Создание предметов, тем и вопросов' },
  { key: 'content.edit', label: 'Редактирование контента и уроков' },
  { key: 'content.review', label: 'Методическое рецензирование заданий' },
  { key: 'content.publish', label: 'Публикация заданий и экзаменов' },
  { key: 'exams.manage', label: 'Конструирование и настройка тестов ЕНТ' },
  { key: 'support.manage', label: 'Обработка обращений пользователей и школ' },
  { key: 'reports.resolve', label: 'Разбор жалоб учащихся на задания' },
  { key: 'finance.manage', label: 'Управление школьными лицензиями и квотами мест' },
  { key: 'monitoring.read', label: 'Просмотр системного мониторинга и служб' },
  { key: 'audit.read', label: 'Доступ к журналу аудита' },
  { key: 'staff.manage', label: 'Приглашение сотрудников и назначение ролей' },
  { key: 'settings.manage', label: 'Конфигурация параметров платформы' },
];

const ROLES: RoleType[] = [
  'OWNER',
  'PLATFORM_ADMIN',
  'CONTENT_MANAGER',
  'CONTENT_REVIEWER',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'ANALYST',
];

const ROLE_TITLES: Record<RoleType, string> = {
  OWNER: 'Владелец платформы',
  PLATFORM_ADMIN: 'Администратор платформы',
  CONTENT_MANAGER: 'Контент-менеджер',
  CONTENT_REVIEWER: 'Рецензент',
  SUPPORT_AGENT: 'Поддержка',
  FINANCE_MANAGER: 'Лицензии и финансы',
  ANALYST: 'Аналитик',
};

const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  OWNER: PERMISSIONS.map((p) => p.key),
  PLATFORM_ADMIN: [
    'users.read',
    'users.suspend',
    'schools.read',
    'schools.approve',
    'support.manage',
    'reports.resolve',
    'monitoring.read',
    'audit.read',
  ],
  CONTENT_MANAGER: ['content.create', 'content.edit', 'exams.manage'],
  CONTENT_REVIEWER: ['content.review', 'content.publish', 'reports.resolve'],
  SUPPORT_AGENT: ['support.manage', 'users.read', 'reports.resolve'],
  FINANCE_MANAGER: ['finance.manage', 'schools.read'],
  ANALYST: ['users.read', 'schools.read', 'monitoring.read'],
};

const STATUS_TITLES: Record<'invited' | 'active' | 'disabled', string> = {
  invited: 'Приглашён',
  active: 'Активен',
  disabled: 'Отключён',
};

export const RolesPage: React.FC = () => {
  const staff = adminService.getStaff();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Администраторы и роли</h1>
        <p className="text-xs text-[#78716C] mt-1 leading-relaxed max-w-3xl">
          Сотрудников приглашает и назначает роли только владелец платформы. Приглашение отправляется на почту, пароль
          задаёт сам сотрудник, вход защищён двухфакторной аутентификацией. Никто не может назначить себе роль.
        </p>
      </div>

      {/* Staff */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Сотрудники платформы</h2>
          <button
            type="button"
            disabled={!ADMIN_API_CONNECTED}
            title={ADMIN_API_CONNECTED ? undefined : 'Недоступно: сервер администрирования не подключён'}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#171717] hover:bg-[#FF5A36] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#171717]"
          >
            <UserPlus className="w-3.5 h-3.5" /> Пригласить сотрудника
          </button>
        </div>

        {staff.length === 0 ? (
          <p className="py-6 text-xs text-[#78716C]">
            {ADMIN_API_CONNECTED
              ? 'Сотрудников пока нет.'
              : 'Данные не загружены: сервер администрирования и вход сотрудников ещё не подключены.'}
          </p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2DED5] text-[#78716C]">
                <th className="py-2 px-2">Имя</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Роли</th>
                <th className="py-2 px-2">Статус</th>
                <th className="py-2 px-2">2FA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DED5]">
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="py-2.5 px-2 font-semibold text-[#171717]">{member.name}</td>
                  <td className="py-2.5 px-2 text-[#5C574F]">{member.email}</td>
                  <td className="py-2.5 px-2 text-[#5C574F]">{member.roles.map((r) => ROLE_TITLES[r]).join(', ')}</td>
                  <td className="py-2.5 px-2">{STATUS_TITLES[member.status]}</td>
                  <td className="py-2.5 px-2">{member.mfaEnabled ? 'включена' : 'не настроена'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Permission matrix: the specification of roles */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#258568]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Матрица полномочий по ролям</h2>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2DED5] bg-[#FAF9F6] text-[#78716C]">
              <th className="py-2.5 px-3">Право доступа</th>
              {ROLES.map((r) => (
                <th key={r} className="py-2.5 px-2 text-center font-semibold">
                  {ROLE_TITLES[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DED5]">
            {PERMISSIONS.map((perm) => (
              <tr key={perm.key} className="hover:bg-[#FAF9F6]">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-[#171717]">{perm.label}</div>
                  <div className="font-mono text-[10px] text-[#A8A29E]">{perm.key}</div>
                </td>
                {ROLES.map((r) => (
                  <td key={r} className="py-2.5 px-2 text-center">
                    {ROLE_PERMISSIONS[r].includes(perm.key) ? (
                      <Check className="w-4 h-4 text-[#258568] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[#D5D0C5] mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-[#78716C]">
          Матрица описывает правила доступа. Сервер проверяет их при каждом запросе; скрытие пункта меню само по себе
          доступ не ограничивает.
        </p>
      </div>
    </div>
  );
};
