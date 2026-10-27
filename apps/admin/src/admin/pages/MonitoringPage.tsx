import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { adminApi } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorBlock, LoadingBlock, fmtDate } from '../components/ui/PageState';

/** Live checks made by the server on each request: database round trip, SMTP connection, session counts. */
export const MonitoringPage: React.FC = () => {
  const { data, error, loading, reload } = useAdminData(() => adminApi.monitoring(), [], 10000);

  if (!data) return loading ? <LoadingBlock /> : <ErrorBlock text={error ?? ''} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Мониторинг</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Проверено сервером {fmtDate(data.checked_at, true)}. Обновляется каждые 10 секунд.
          </p>
        </div>
        <button onClick={reload} className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Проверить сейчас
        </button>
      </div>

      {error && <ErrorBlock text={error} onRetry={reload} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard title="Сессии учеников" value={data.student_sessions_active} subtitle="действующие" />
        <MetricCard title="Сессии сотрудников" value={data.staff_sessions_active} subtitle="с подтверждённым кодом" />
        <MetricCard title="Активные сотрудники" value={data.staff_active} />
        <MetricCard title="Отказы за 24 часа" value={data.admin_failures_24h} subtitle="неудачные входы и коды" />
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E2DED5]">
          <Cpu className="w-4 h-4 text-[#FF5A36]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Службы</h2>
        </div>
        <div className="divide-y divide-[#E2DED5]">
          {data.services.map((s) => (
            <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-[#171717]">{s.name}</div>
                <div className="text-[11px] text-[#78716C]">{s.details}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] text-[#78716C]">{s.latency_ms !== null ? `${s.latency_ms} мс` : '—'}</span>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
