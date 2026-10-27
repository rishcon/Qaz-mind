import React, { useState } from 'react';
import { ShieldCheck, Check, X, ShieldAlert, UserCheck } from 'lucide-react';
import { RoleType } from '../types';
import { adminService } from '../services/adminService';
import { mockDb } from '../repositories/mockDatabase';

export const RolesPage: React.FC = () => {
  const currentAdmin = adminService.getCurrentAdmin();
  const [selectedRoleToTest, setSelectedRoleToTest] = useState<RoleType>(currentAdmin.role);

  const permissionsList = [
    { key: 'users.read', label: 'Просмотр пользователей и профилей' },
    { key: 'users.suspend', label: 'Блокировка и разблокировка учетных записей' },
    { key: 'schools.read', label: 'Просмотр реестра школ и классов' },
    { key: 'schools.approve', label: 'Верификация и одобрение заявок школ' },
    { key: 'content.create', label: 'Создание предметов, тем и вопросов' },
    { key: 'content.edit', label: 'Редактирование контента и уроков' },
    { key: 'content.review', label: 'Методическое рецензирование заданий' },
    { key: 'content.publish', label: 'Публикация заданий и экзаменов в боевой реестр' },
    { key: 'exams.manage', label: 'Конструирование и настройка тестов ЕНТ' },
    { key: 'support.manage', label: 'Обработка обращений пользователей и школ' },
    { key: 'reports.resolve', label: 'Разбор жалоб учащихся на задания' },
    { key: 'finance.manage', label: 'Управление школьными лицензиями и квотами мест' },
    { key: 'monitoring.read', label: 'Просмотр системного мониторинга и служб' },
    { key: 'audit.read', label: 'Доступ к неизменяемому журналу аудита' },
    { key: 'settings.manage', label: 'Конфигурация параметров платформы и регламентов' },
  ];

  const rolePermissions: Record<RoleType, string[]> = {
    OWNER: permissionsList.map((p) => p.key),
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

  const handleApplyRole = (role: RoleType) => {
    adminService.setAdminRole(role);
    setSelectedRoleToTest(role);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Административные роли и права доступа (RBAC)</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Матрица разграничения полномочий сотрудников образовательной платформы QazMind.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#78716C]">Ваша текущая роль в демо:</span>
          <span className="px-2.5 py-1 rounded bg-[#FF5A36] text-white font-bold text-xs">
            {mockDb.currentAdminRole}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs overflow-x-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-3">
          Матрица полномочий по должностям
        </h2>

        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2DED5] bg-[#FAF9F6] text-[#78716C]">
              <th className="py-2.5 px-3">Право доступа (Scope)</th>
              <th className="py-2.5 px-2 text-center font-bold text-[#FF5A36]">Owner</th>
              <th className="py-2.5 px-2 text-center">Admin</th>
              <th className="py-2.5 px-2 text-center">Content Mgr</th>
              <th className="py-2.5 px-2 text-center">Reviewer</th>
              <th className="py-2.5 px-2 text-center">Support</th>
              <th className="py-2.5 px-2 text-center">Finance</th>
              <th className="py-2.5 px-2 text-center">Analyst</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DED5]">
            {permissionsList.map((perm) => (
              <tr key={perm.key} className="hover:bg-[#FAF9F6]">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-[#171717]">{perm.label}</div>
                  <div className="font-mono text-[10px] text-[#A8A29E]">{perm.key}</div>
                </td>
                {(['OWNER', 'PLATFORM_ADMIN', 'CONTENT_MANAGER', 'CONTENT_REVIEWER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'ANALYST'] as RoleType[]).map((r) => {
                  const has = rolePermissions[r].includes(perm.key);
                  return (
                    <td key={r} className="py-2.5 px-2 text-center">
                      {has ? (
                        <Check className="w-4 h-4 text-[#258568] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#D5D0C5] mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Switcher Toolbar */}
      <div className="bg-[#FAF9F6] border border-[#E2DED5] rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
          Симулятор ролей (Тестирование ограничений)
        </h3>
        <p className="text-xs text-[#78716C]">
          Выберите роль, чтобы немедленно переключить рабочий контекст и проверить поведение интерфейса:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {(['OWNER', 'PLATFORM_ADMIN', 'CONTENT_MANAGER', 'CONTENT_REVIEWER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'ANALYST'] as RoleType[]).map((r) => (
            <button
              key={r}
              onClick={() => handleApplyRole(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                mockDb.currentAdminRole === r
                  ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs'
                  : 'bg-white text-[#5C574F] border-[#E2DED5] hover:bg-[#F5F3EE]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
