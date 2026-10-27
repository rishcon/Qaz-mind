import React, { useState } from 'react';
import { ArrowLeft, User, GraduationCap, Building2, Activity, Shield, RotateCcw } from 'lucide-react';
import { adminService, ADMIN_API_CONNECTED } from '../services/adminService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';
import type { UserAccountType } from '../types';

interface UserDetailPageProps {
  userId: string;
  onNavigate: (path: string) => void;
}

const ROLE_TITLES: Record<UserAccountType, string> = {
  student: 'Ученик',
  teacher: 'Преподаватель',
  school_admin: 'Администратор школы',
  platform_admin: 'Администратор платформы',
};

/** Shows a number when the server sent it. A missing value is a dash, never zero. */
const valueOrDash = (value: number | undefined, suffix = '') => (value === undefined ? '—' : `${value}${suffix}`);

export const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'org' | 'activity' | 'security'>('overview');
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const user = adminService.getUserById(userId);

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-[#E2DED5] p-12 text-center">
        <h2 className="text-base font-bold text-[#171717]">
          {ADMIN_API_CONNECTED ? 'Пользователь не найден' : 'Данные не загружены'}
        </h2>
        <p className="text-xs text-[#78716C] mt-1">
          {ADMIN_API_CONNECTED
            ? `ID #${userId} отсутствует в базе данных.`
            : `Сервер администрирования не подключён: карточка ID #${userId} недоступна.`}
        </p>
        <button
          onClick={() => onNavigate('/admin/users')}
          className="mt-4 px-4 py-2 bg-[#FF5A36] text-white text-xs font-semibold rounded-md"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const handleRevokeSessions = () => {
    try {
      adminService.revokeUserSessions(user.id);
      setResult({ tone: 'success', text: 'Сессии пользователя завершены.' });
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  const handleToggleSuspend = () => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    setConfirmSuspendOpen(false);
    try {
      adminService.updateUserStatus(user.id, nextStatus);
      setResult({ tone: 'success', text: nextStatus === 'active' ? 'Доступ восстановлен.' : 'Доступ приостановлен.' });
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  // Scoped activity for this user
  const userActivities = adminService.getUserActivity({ userId: user.id });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/admin/users')}
              className="p-1.5 rounded-md hover:bg-[#F5F3EE] text-[#78716C] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#171717]" />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#FFF7F5] border border-[#FF5A36]/30 flex items-center justify-center font-bold text-base text-[#FF5A36]">
              {user.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-[#171717]">{user.name}</h1>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                {user.email} • ID: <span className="font-mono">{user.id}</span> • {user.city ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmSuspendOpen(true)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                user.status === 'suspended'
                  ? 'border-[#258568] bg-[#EBF7F2] text-[#258568] hover:bg-[#DDF2E9]'
                  : 'border-[#FCA5A5] bg-[#FFF1F2] text-[#C94A43] hover:bg-[#FFE4E6]'
              }`}
            >
              {user.status === 'suspended' ? 'Восстановить аккаунт' : 'Приостановить доступ'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-[#E2DED5] mt-6 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Обзор', icon: User },
            { id: 'learning', label: 'Обучение и ЕНТ', icon: GraduationCap },
            { id: 'org', label: 'Организации', icon: Building2 },
            { id: 'activity', label: 'История действий', icon: Activity },
            { id: 'security', label: 'Безопасность', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Учетная карточка пользователя
            </h3>
            <div className="divide-y divide-[#E2DED5] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Полное имя:</span>
                <span className="font-semibold text-[#171717]">{user.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Email:</span>
                <span className="font-mono text-[#171717]">{user.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Телефон:</span>
                <span className="font-mono text-[#171717]">{user.phone ?? '—'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Тип аккаунта:</span>
                <span className="font-semibold text-[#FF5A36]">{ROLE_TITLES[user.role]}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Дата регистрации:</span>
                <span className="font-mono text-[#171717]">
                  {new Date(user.registeredAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Академические цели и профиль
            </h3>
            {user.role === 'student' ? (
              <div className="divide-y divide-[#E2DED5] text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#78716C]">Целевой балл ЕНТ:</span>
                  <span className="font-bold text-[#FF5A36] text-sm">
                    {user.targetEntScore !== undefined ? `${user.targetEntScore} / 140` : 'не указана'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#78716C]">Средний результат срезов:</span>
                  <span className="font-bold text-[#258568]">{valueOrDash(user.averageScore, ' баллов')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#78716C]">Пройдено уроков:</span>
                  <span className="font-semibold text-[#171717]">{valueOrDash(user.completedLessonsCount, ' тем')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#78716C]">Попыток сдачи ЕНТ:</span>
                  <span className="font-semibold text-[#171717]">{valueOrDash(user.examAttemptsCount)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF9F6] rounded-lg text-xs text-[#78716C]">
                Преподавательский аккаунт. Доступны функции создания домашних заданий, проверки контрольных срезов и управления классами.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEARNING */}
      {activeTab === 'learning' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            История образовательного прогресса и попыток сдачи
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs">
              <div className="text-[#78716C]">Всего завершено уроков</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{valueOrDash(user.completedLessonsCount)}</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs">
              <div className="text-[#78716C]">Практических сессий</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{valueOrDash(user.practiceAttemptsCount)}</div>
            </div>
            <div className="p-4 rounded-lg bg-[#EBF7F2] border border-[#258568]/20 text-xs">
              <div className="text-[#1D6A53]">Средний балл на срезах ЕНТ</div>
              <div className="text-xl font-bold text-[#258568] mt-1">
                {user.averageScore !== undefined ? `${user.averageScore} из 140` : 'нет данных'}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-[#171717] mb-2">Недавние сдачи пробных экзаменов</h4>
            <div className="divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg overflow-hidden text-xs">
              <div className="p-3 bg-[#FCFBF9] text-[#78716C]">
                {ADMIN_API_CONNECTED
                  ? 'Пробных экзаменов пока нет.'
                  : 'Список сданных пробных экзаменов не загружен: сервер администрирования не подключён.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORGANIZATIONS */}
      {activeTab === 'org' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Привязка к учебным заведениям и классам
          </h3>
          {user.organizationName ? (
            <div className="p-4 rounded-lg border border-[#E2DED5] bg-[#FAF9F6] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#171717]">{user.organizationName}</div>
                <div className="text-xs text-[#78716C] mt-0.5">
                  ID школы: {user.organizationId} • Город: {user.city ?? '—'}
                </div>
              </div>
              <button
                onClick={() => user.organizationId && onNavigate(`/admin/schools/${user.organizationId}`)}
                className="px-3 py-1.5 text-xs text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] cursor-pointer"
              >
                Открыть профиль школы →
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#78716C]">Пользователь обучается индивидуально без привязки к школе.</p>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Журнал пользовательских действий
          </h3>
          <div className="divide-y divide-[#E2DED5] text-xs">
            {userActivities.length === 0 ? (
              <p className="py-4 text-[#78716C]">Нет зарегистрированных событий за выбранный период.</p>
            ) : (
              userActivities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#171717]">{act.eventType}</span>
                    <span className="text-[#78716C] ml-2">{act.resourceName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A8A29E]">
                    {new Date(act.timestamp).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-5 max-w-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Параметры безопасности и активных сессий
          </h3>

          <div className="divide-y divide-[#E2DED5] text-xs">
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[#171717]">Статус верификации Email</div>
                <div className="text-[#78716C]">{user.emailVerified ? 'Почта подтверждена' : 'Почта не подтверждена'}</div>
              </div>
              <StatusBadge status={user.emailVerified ? 'active' : 'pending'} label={user.emailVerified ? 'Подтвержден' : 'Не подтвержден'} />
            </div>

            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[#171717]">Сброс активных сессий</div>
                <div className="text-[#78716C]">Завершить все авторизованные сеансы на всех устройствах пользователя</div>
              </div>
              <button
                onClick={handleRevokeSessions}
                className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FF5A36]" /> Отозвать сессии
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Suspension */}
      <ConfirmationDialog
        isOpen={confirmSuspendOpen}
        title={user.status === 'suspended' ? 'Восстановление аккаунта' : 'Блокировка аккаунта'}
        message={`Вы уверены, что хотите ${user.status === 'suspended' ? 'разблокировать' : 'приостановить доступ для'} ${user.name}?`}
        variant={user.status === 'suspended' ? 'primary' : 'danger'}
        onConfirm={handleToggleSuspend}
        onCancel={() => setConfirmSuspendOpen(false)}
      />
    </div>
  );
};
