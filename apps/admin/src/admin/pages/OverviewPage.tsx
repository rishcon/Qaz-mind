import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { adminService, ADMIN_API_CONNECTED } from '../services/adminService';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

/** A number that is not loaded is shown as a dash, never as zero. */
const fmt = (value: number | null) => (value === null ? '—' : value.toLocaleString('ru-RU'));

const NOT_CONNECTED = 'Данные не загружены: сервер администрирования не подключён.';

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const metrics = adminService.getOverviewMetrics(period);
  // Without the server the list is empty because nothing is loaded, so the total is unknown, not zero.
  const attentionTotal = ADMIN_API_CONNECTED
    ? metrics.requiresAttention.reduce<number | null>(
        (sum, item) => (sum === null || item.count === null ? null : sum + item.count),
        0
      )
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#171717]">Обзор платформы</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Операционный центр управления всей экосистемой QazMind и подготовкой к ЕНТ.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          {[
            { id: 'today', label: 'Сегодня' },
            { id: '7days', label: '7 дней' },
            { id: '30days', label: '30 дней' },
            { id: 'all', label: 'Все время' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as typeof period)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                period === tab.id ? 'bg-[#FF5A36] text-white shadow-2xs' : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid: values are loaded from the server, a dash means not loaded */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard title="Всего пользователей" value={fmt(metrics.totalUsers)} onClick={() => onNavigate('/admin/users')} />
        <MetricCard title="Активные пользователи" value={fmt(metrics.activeUsers)} onClick={() => onNavigate('/admin/users')} />
        <MetricCard
          title="Подключенные школы"
          value={fmt(metrics.totalSchools)}
          subtitle={metrics.pendingSchools === null ? 'не загружено' : `${metrics.pendingSchools} на верификации`}
          onClick={() => onNavigate('/admin/schools')}
        />
        <MetricCard title="Преподаватели" value={fmt(metrics.totalTeachers)} onClick={() => onNavigate('/admin/teachers')} />
        <MetricCard title="Завершено тестов" value={fmt(metrics.totalExamsCompleted)} onClick={() => onNavigate('/admin/exams')} />
        <MetricCard title="Активные подписки" value={fmt(metrics.activeSubscriptions)} onClick={() => onNavigate('/admin/finance')} />
      </div>

      {/* Grid: Requires Attention & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requires Attention */}
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D89B35]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Требует внимания</h2>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FEF7EA] text-[#9A6715] border border-[#D89B35]/20">
                {attentionTotal === null ? '—' : `${attentionTotal} задач`}
              </span>
            </div>

            {metrics.requiresAttention.length === 0 ? (
              <p className="py-6 text-xs text-[#78716C] leading-relaxed">{NOT_CONNECTED}</p>
            ) : (
              <div className="divide-y divide-[#E2DED5] mt-1">
                {metrics.requiresAttention.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.actionUrl)}
                    className="py-3 px-1 hover:bg-[#FAF9F6] rounded-md transition-colors cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <p className="text-xs font-semibold text-[#171717] group-hover:text-[#FF5A36] transition-colors leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FEF7EA] text-[#D89B35]">
                        {fmt(item.count)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#FF5A36]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2DED5] mt-4">
            <button
              onClick={() => onNavigate('/admin/support')}
              className="w-full text-center text-xs font-medium text-[#FF5A36] hover:underline cursor-pointer"
            >
              Перейти в Центр обращений →
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Platform activity. No chart is drawn until the activity series is loaded. */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DED5]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF5A36]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Динамика активности на платформе</h2>
              </div>
            </div>
            <p className="py-10 text-center text-xs text-[#78716C] leading-relaxed">
              {ADMIN_API_CONNECTED ? 'За выбранный период данных нет.' : NOT_CONNECTED}
            </p>
          </div>

          <div className="pt-3 border-t border-[#E2DED5] flex items-center justify-between text-xs text-[#78716C]">
            <span>Подробные показатели — в разделе аналитики</span>
            <button onClick={() => onNavigate('/admin/analytics')} className="text-[#FF5A36] font-medium hover:underline cursor-pointer">
              Подробная аналитика →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent administrative actions */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Последние действия администраторов</h2>
          <button onClick={() => onNavigate('/admin/audit')} className="text-xs text-[#FF5A36] font-medium hover:underline cursor-pointer">
            Открыть полный журнал аудита →
          </button>
        </div>

        {metrics.recentActivity.length === 0 ? (
          <p className="py-6 text-xs text-[#78716C]">{NOT_CONNECTED}</p>
        ) : (
          <div className="divide-y divide-[#E2DED5]">
            {metrics.recentActivity.map((event) => (
              <div key={event.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#A8A29E]">
                    {new Date(event.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F0EEE8] font-mono text-[10px] font-semibold text-[#5C574F]">
                    {event.action}
                  </span>
                  <span className="font-medium text-[#171717]">{event.resourceTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#78716C]">
                  <span>
                    Действие выполнил: <strong className="text-[#171717]">{event.actorName}</strong>
                  </span>
                  <StatusBadge status={event.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
