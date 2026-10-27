import React, { useState } from 'react';
import { ArrowLeft, User, GraduationCap, Shield, RotateCcw } from 'lucide-react';
import { adminApi } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, LoadingBlock, fmtDate } from '../components/ui/PageState';

interface UserDetailPageProps {
  userId: string;
  onNavigate: (path: string) => void;
}

const PERIODS: Record<string, string> = { june_main: 'Июнь (основной)', march_paid: 'Март (платный)', ent_2027: 'ЕНТ 2027' };
const STATES: Record<string, string> = { in_progress: 'В процессе', completed: 'Завершён', not_started: 'Не начат' };

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2.5 flex justify-between gap-4">
    <span className="text-[#78716C]">{label}</span>
    <span className="font-semibold text-[#171717] text-right">{value}</span>
  </div>
);

export const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId, onNavigate }) => {
  const { can } = useStaff();
  const [tab, setTab] = useState<'overview' | 'learning' | 'security'>('overview');
  const [result, setResult] = useState<ActionResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { data: user, error, loading, reload } = useAdminData(() => adminApi.user(userId), [userId], 30000);

  if (!user) {
    return loading ? <LoadingBlock /> : (
      <div className="space-y-4">
        <ErrorBlock text={error ?? ''} onRetry={reload} />
        <button onClick={() => onNavigate('/admin/users')} className="text-xs text-[#FF5A36] hover:underline cursor-pointer">
          ← К списку учеников
        </button>
      </div>
    );
  }

  const blocked = user.status === 'disabled';

  const toggleStatus = async () => {
    const ok = await runAction(
      () => adminApi.setUserStatus(user.id, blocked ? 'active' : 'disabled', reason.trim()),
      blocked ? 'Доступ восстановлен.' : 'Доступ приостановлен, сессии завершены.',
      setResult,
    );
    setDialogOpen(false);
    setReason('');
    if (ok) reload();
  };

  const revoke = async () => {
    if (await runAction(() => adminApi.revokeUserSessions(user.id), 'Все сессии ученика завершены.', setResult)) reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/admin/users')} className="p-1.5 rounded-md hover:bg-[#F5F3EE] cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-[#171717]" />
            </button>
            <div className="w-12 h-12 rounded-full bg-[#FFF7F5] border border-[#FF5A36]/30 flex items-center justify-center font-bold text-base text-[#FF5A36]">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-[#171717]">{user.name}</h1>
                {blocked ? <StatusBadge status="disabled" label="Заблокирован" /> : <StatusBadge status="active" />}
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                {user.email} • ID: <span className="font-mono">{user.id}</span>
              </p>
            </div>
          </div>
          {can('users.suspend') && (
            <button
              onClick={() => setDialogOpen(true)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border cursor-pointer ${
                blocked
                  ? 'border-[#258568] bg-[#EBF7F2] text-[#258568]'
                  : 'border-[#FCA5A5] bg-[#FFF1F2] text-[#C94A43]'
              }`}
            >
              {blocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 border-t border-[#E2DED5] mt-6 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Профиль', icon: User },
            { id: 'learning', label: `Уроки (${user.progress.length})`, icon: GraduationCap },
            { id: 'security', label: 'Сессии и безопасность', icon: Shield },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md cursor-pointer ${
                  tab === t.id ? 'bg-[#171717] text-white' : 'text-[#78716C] hover:bg-[#F5F3EE]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2DED5] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">Учётная запись</h3>
            <div className="divide-y divide-[#E2DED5] text-xs">
              <Row label="Email" value={<span className="font-mono">{user.email}</span>} />
              <Row label="Email подтверждён" value={user.email_verified ? 'да' : 'нет'} />
              <Row label="Регистрация" value={fmtDate(user.created_at, true)} />
              <Row label="Последняя активность" value={fmtDate(user.last_seen_at, true)} />
              <Row label="Временная блокировка входа" value={user.locked_until ? `до ${fmtDate(user.locked_until, true)}` : 'нет'} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2DED5] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">Профиль подготовки</h3>
            {user.profile ? (
              <div className="divide-y divide-[#E2DED5] text-xs">
                <Row label="Целевой балл" value={`${user.profile.target_score} / 140`} />
                <Row label="Профильная пара" value={user.profile.profile_pair} />
                <Row label="Экзамен" value={`${PERIODS[user.profile.exam_period] ?? user.profile.exam_period}, ${user.profile.exam_year}`} />
                <Row label="Язык экзамена" value={user.profile.exam_lang === 'kz' ? 'Казахский' : 'Русский'} />
                <Row label="Время в день" value={`${user.profile.daily_goal_minutes} мин`} />
                <Row label="Онбординг пройден" value={fmtDate(user.profile.onboarding_completed_at, true)} />
              </div>
            ) : (
              <p className="text-xs text-[#78716C] py-4">Ученик ещё не прошёл онбординг.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'learning' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-3">
            Прогресс по урокам · завершено {user.lessons_completed}
          </h3>
          {user.progress.length === 0 ? (
            <p className="text-xs text-[#78716C]">Ученик ещё не открывал уроки.</p>
          ) : (
            <div className="divide-y divide-[#E2DED5] text-xs">
              {user.progress.map((p) => (
                <div key={p.lesson_slug} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#171717]">{p.title}</div>
                    <div className="text-[11px] text-[#78716C] font-mono">{p.lesson_slug} · шаг {p.last_step + 1}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.state === 'completed' ? 'published' : 'in_review'} label={STATES[p.state] ?? p.state} />
                    <div className="text-[10px] text-[#A8A29E] mt-1">{fmtDate(p.updated_at, true)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Сессии входа · активных {user.active_sessions}
            </h3>
            {can('users.suspend') && (
              <button
                onClick={() => void revoke()}
                className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FF5A36]" /> Завершить все сессии
              </button>
            )}
          </div>
          {user.sessions.length === 0 ? (
            <p className="text-xs text-[#78716C]">Сессий нет.</p>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[#78716C] border-b border-[#E2DED5]">
                  <th className="py-2">Создана</th>
                  <th className="py-2">Последняя активность</th>
                  <th className="py-2">Истекает</th>
                  <th className="py-2">Состояние</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DED5]">
                {user.sessions.map((s, i) => (
                  <tr key={i}>
                    <td className="py-2 font-mono">{fmtDate(s.created_at, true)}</td>
                    <td className="py-2 font-mono">{fmtDate(s.last_seen_at, true)}</td>
                    <td className="py-2 font-mono">{fmtDate(s.expires_at, true)}</td>
                    <td className="py-2">{s.revoked ? 'завершена' : new Date(s.expires_at) > new Date() ? 'активна' : 'истекла'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={dialogOpen}
        title={blocked ? 'Разблокировать ученика' : 'Заблокировать ученика'}
        message={blocked ? 'Ученик снова сможет входить.' : 'Ученик не сможет входить, текущие сессии завершатся.'}
        variant={blocked ? 'primary' : 'danger'}
        confirmDisabled={reason.trim().length < 3}
        onConfirm={() => void toggleStatus()}
        onCancel={() => setDialogOpen(false)}
      >
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина (видна в журнале аудита)"
          className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md"
        />
      </ConfirmationDialog>
    </div>
  );
};
