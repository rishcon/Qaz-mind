import React from 'react';
import { X, Shield, Check, Info } from 'lucide-react';
import { RoleType } from '../../types';
import { adminService } from '../../services/adminService';
import { mockDb } from '../../repositories/mockDatabase';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const rolesList: Array<{
  role: RoleType;
  title: string;
  description: string;
  permissions: string[];
}> = [
  {
    role: 'OWNER',
    title: 'Владелец платформы (Owner)',
    description: 'Полный доступ ко всем модулям, финансам, ролям и системным настройкам.',
    permissions: ['all.*'],
  },
  {
    role: 'PLATFORM_ADMIN',
    title: 'Администратор платформы (Platform Admin)',
    description: 'Управление пользователями, школами, обращениями и операционными параметрами.',
    permissions: ['users.*', 'schools.*', 'support.*', 'reports.*', 'monitoring.read'],
  },
  {
    role: 'CONTENT_MANAGER',
    title: 'Контент-менеджер (Content Manager)',
    description: 'Создание и редактирование предметов, тем, уроков и базы вопросов.',
    permissions: ['content.create', 'content.edit', 'questions.manage', 'exams.create'],
  },
  {
    role: 'CONTENT_REVIEWER',
    title: 'Рецензент ЕНТ (Content Reviewer)',
    description: 'Аудит методического качества, утверждение вопросов и решение жалоб.',
    permissions: ['content.review', 'content.publish', 'reports.resolve'],
  },
  {
    role: 'SUPPORT_AGENT',
    title: 'Специалист поддержки (Support Agent)',
    description: 'Обработка обращений пользователей и школ без доступа к критическим настройкам.',
    permissions: ['support.manage', 'users.read', 'tickets.respond'],
  },
  {
    role: 'FINANCE_MANAGER',
    title: 'Финансовый менеджер (Finance Manager)',
    description: 'Управление школьными лицензиями, подписками и тарифами.',
    permissions: ['finance.read', 'finance.manage', 'schools.licenses'],
  },
  {
    role: 'ANALYST',
    title: 'Аналитик (Analyst)',
    description: 'Просмотр аналитических дашбордов, срезов и отчетов без права изменений.',
    permissions: ['analytics.read', 'reports.read'],
  },
];

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentRole = mockDb.currentAdminRole;

  const handleSelectRole = (role: RoleType) => {
    adminService.setAdminRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF5A36]" />
            <h3 className="text-sm font-semibold text-[#171717]">
              Переключение роли (Developer Demo Mode)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="p-3 bg-[#F0EEE8] rounded-lg border border-[#E2DED5] flex items-start gap-2.5 mb-3 text-xs text-[#5C574F]">
            <Info className="w-4 h-4 text-[#FF5A36] shrink-0 mt-0.5" />
            <span>
              В боевой системе реальная авторизация обеспечивается токенами на FastAPI бэкенде.
              В данном демо-режиме вы можете протестировать интерфейс и права от лица любого сотрудника платформы.
            </span>
          </div>

          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {rolesList.map((item) => {
              const isSelected = item.role === currentRole;
              return (
                <div
                  key={item.role}
                  onClick={() => handleSelectRole(item.role)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#FF5A36] bg-[#FFF7F5] shadow-xs'
                      : 'border-[#E2DED5] bg-white hover:bg-[#F9F8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#FF5A36]' : 'text-[#171717]'
                      }`}
                    >
                      {item.title}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#FF5A36]" />}
                  </div>
                  <p className="text-[11px] text-[#78716C] mt-1">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.2 rounded bg-[#F0EEE8] font-mono text-[9px] text-[#5C574F]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#5C574F] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
