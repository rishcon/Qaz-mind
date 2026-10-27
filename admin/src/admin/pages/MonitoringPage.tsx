import React from 'react';
import { Cpu, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { adminService } from '../services/adminService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoBadge } from '../components/ui/DemoBadge';

export const MonitoringPage: React.FC = () => {
  const services = adminService.getSystemServices();
  const backgroundJobs = adminService.getBackgroundJobs();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#171717]">Системный мониторинг и службы</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Техническое состояние инфраструктуры, фоновые воркеры и статус соединений базы данных.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#258568] flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#258568] animate-pulse" />
            Все системы в норме
          </span>
        </div>
      </div>

      <div className="p-3.5 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-xl text-xs text-[#9A6715] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Интерфейс подготовлен для приема телеметрии с production-серверов FastAPI и очередей Celery / Redis.
        </span>
      </div>

      {/* Services Health Cards */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
          Инфраструктурные сервисы платформы
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-4 rounded-lg border border-[#E2DED5] bg-[#FAF9F6] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717]">{srv.name}</span>
                <StatusBadge status={srv.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-xs text-[#78716C]">
                <span>Задержка (Latency):</span>
                <span className="font-mono font-bold text-[#171717]">{srv.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#78716C]">
                <span>Доступность (Uptime):</span>
                <span className="font-mono font-bold text-[#258568]">{srv.uptimePercent}%</span>
              </div>
              {srv.notes && (
                <p className="text-[10px] text-[#A8A29E] pt-1 border-t border-[#E2DED5] italic">
                  {srv.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Background Jobs Table */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
          Фоновые задачи и регулярные воркеры
        </h2>

        <div className="divide-y divide-[#E2DED5] text-xs">
          {backgroundJobs.map((job) => (
            <div key={job.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[#171717]">{job.name}</div>
                <div className="text-[11px] text-[#78716C]">Тип: {job.type} • Попыток: {job.attempts}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-[#78716C]">{job.durationMs} ms</span>
                <StatusBadge status={job.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
