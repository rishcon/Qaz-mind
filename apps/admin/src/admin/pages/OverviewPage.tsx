import React from 'react';
import { AlertTriangle, ArrowRight, Activity, RefreshCw } from 'lucide-react';
import { adminApi } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { actionLabel } from '../api/labels';
import { useStaff } from '../auth/StaffAuth';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, LoadingBlock, fmtDate } from '../components/ui/PageState';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

const num = (value: number) => value.toLocaleString('ru-RU');

/** Every number here is counted by the server from the database and refreshed every 30 seconds. */
export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const { data, error, loading, reload } = useAdminData(() => adminApi.overview(), [], 30000);

  if (!data) return loading ? <LoadingBlock /> : <ErrorBlock text={error ?? ''} onRetry={reload} />;

  const maxDay = Math.max(1, ...data.registrations_by_day.map((d) => d.count));
  const attentionTotal = data.attention.reduce((sum, item) => sum + item.count, 0);
  const q = data.questions;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#171717]">Обзор платформы</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Данные из базы на {fmtDate(data.generated_at, true)}. Обновляются каждые 30 секунд.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Обновить
        </button>
      </div>

      {error && <ErrorBlock text={error} onRetry={reload} />}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Всего учеников"
          value={num(data.users_total)}
          subtitle={`${num(data.new_7d)} за 7 дней`}
          onClick={can('users.read') ? () => onNavigate('/admin/users') : undefined}
        />
        <MetricCard title="Подтвердили email" value={num(data.users_verified)} subtitle={`из ${num(data.users_total)}`} />
        <MetricCard title="Прошли онбординг" value={num(data.onboarding_completed)} subtitle={`из ${num(data.users_total)}`} />
        <MetricCard title="Активны за 24 часа" value={num(data.active_24h)} subtitle="по сессиям входа" />
        <MetricCard
          title="Опубликовано уроков"
          value={num(data.lessons_published)}
          subtitle={`${num(data.lessons_completed)} завершений`}
          onClick={() => onNavigate('/admin/content/lessons')}
        />
        <MetricCard
          title="Вопросы в банке"
          value={num(q.published)}
          subtitle={`опубликовано · ${num(q.draft + q.in_review + q.approved)} в работе`}
          onClick={() => onNavigate('/admin/content/questions')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D89B35]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Требует внимания</h2>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FEF7EA] text-[#9A6715] border border-[#D89B35]/20">
              {attentionTotal}
            </span>
          </div>
          {data.attention.length === 0 ? (
            <p className="py-6 text-xs text-[#78716C] leading-relaxed">Сейчас ничего не ждёт действий.</p>
          ) : (
            <div className="divide-y divide-[#E2DED5] mt-1">
              {data.attention.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.action_url)}
                  className="py-3 px-1 hover:bg-[#FAF9F6] rounded-md transition-colors cursor-pointer group flex items-start justify-between gap-3"
                >
                  <p className="text-xs font-semibold text-[#171717] group-hover:text-[#FF5A36] transition-colors leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FEF7EA] text-[#D89B35]">{item.count}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#FF5A36]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2DED5]">
            <Activity className="w-4 h-4 text-[#FF5A36]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Регистрации за 14 дней</h2>
          </div>
          <div className="pt-4 h-44 flex items-end gap-1.5">
            {data.registrations_by_day.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${day.date}: ${day.count}`}>
                <span className="text-[10px] font-mono text-[#78716C]">{day.count || ''}</span>
                <div
                  className={`w-full rounded-t ${day.count ? 'bg-[#FF5A36]/80' : 'bg-[#F0EEE8]'}`}
                  style={{ height: `${Math.max(2, (day.count / maxDay) * 100)}%` }}
                />
                <span className="text-[9px] font-mono text-[#A8A29E]">{day.date.slice(8, 10)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-[#E2DED5] flex items-center justify-between text-xs text-[#78716C]">
            <span>Вопросы: {q.draft} черновиков · {q.in_review} на рецензии · {q.approved} утверждено</span>
            <button onClick={() => onNavigate('/admin/analytics')} className="text-[#FF5A36] font-medium hover:underline cursor-pointer">
              Аналитика →
            </button>
          </div>
        </div>
      </div>

      {can('audit.read') && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Последние действия сотрудников</h2>
            <button onClick={() => onNavigate('/admin/audit')} className="text-xs text-[#FF5A36] font-medium hover:underline cursor-pointer">
              Весь журнал аудита →
            </button>
          </div>
          {data.recent_audit.length === 0 ? (
            <p className="py-6 text-xs text-[#78716C]">Записей пока нет.</p>
          ) : (
            <div className="divide-y divide-[#E2DED5]">
              {data.recent_audit.map((event) => (
                <div key={event.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#A8A29E]">{fmtDate(event.created_at, true)}</span>
                    <span className="font-medium text-[#171717]">{actionLabel(event.action)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#78716C]">
                    <span>{event.actor_email ?? '—'}</span>
                    <StatusBadge status={event.result} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
