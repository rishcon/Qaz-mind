import React, { useState } from 'react';
import {
  Users,
  Building2,
  GraduationCap,
  Award,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  FileQuestion,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { MetricCard } from '../components/ui/MetricCard';
import { DemoBadge } from '../components/ui/DemoBadge';
import { StatusBadge } from '../components/ui/StatusBadge';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [selectedChartMetric, setSelectedChartMetric] = useState<'registrations' | 'active' | 'exams' | 'lessons'>('active');

  const metrics = adminService.getOverviewMetrics(period);

  // Activity chart sample data (clearly labeled as demonstration data)
  const chartDays = ['21 Окт', '22 Окт', '23 Окт', '24 Окт', '25 Окт', '26 Окт', '27 Окт'];
  const chartSeries = {
    registrations: [120, 145, 138, 190, 210, 245, 230],
    active: [4200, 4350, 4510, 4820, 5100, 5320, 5480],
    exams: [320, 410, 390, 520, 680, 890, 840],
    lessons: [1800, 1950, 2100, 2400, 2800, 3100, 2950],
  };

  const currentSeries = chartSeries[selectedChartMetric];
  const maxVal = Math.max(...currentSeries);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E2DED5]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#171717]">Обзор платформы</h1>
            <DemoBadge />
          </div>
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
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                period === tab.id
                  ? 'bg-[#FF5A36] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Всего пользователей"
          value={metrics.totalUsers.toLocaleString('ru-RU')}
          change={{ value: '+8.4%', trend: 'up' }}
          onClick={() => onNavigate('/admin/users')}
        />
        <MetricCard
          title="Активные пользователи"
          value={metrics.activeUsers.toLocaleString('ru-RU')}
          change={{ value: '+12.1%', trend: 'up' }}
          onClick={() => onNavigate('/admin/users')}
        />
        <MetricCard
          title="Подключенные школы"
          value={metrics.totalSchools}
          subtitle={`${metrics.pendingSchools} на верификации`}
          onClick={() => onNavigate('/admin/schools')}
        />
        <MetricCard
          title="Преподаватели"
          value={metrics.totalTeachers}
          onClick={() => onNavigate('/admin/teachers')}
        />
        <MetricCard
          title="Завершено тестов"
          value={metrics.totalExamsCompleted.toLocaleString('ru-RU')}
          change={{ value: '+15.2%', trend: 'up' }}
          onClick={() => onNavigate('/admin/exams')}
        />
        <MetricCard
          title="Активные подписки"
          value={metrics.activeSubscriptions.toLocaleString('ru-RU')}
          onClick={() => onNavigate('/admin/finance')}
        />
      </div>

      {/* Grid: Requires Attention & Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requires Attention (Операционная панель) */}
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D89B35]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Требует внимания
                </h2>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FEF7EA] text-[#9A6715] border border-[#D89B35]/20">
                {metrics.requiresAttention.reduce((sum, item) => sum + item.count, 0)} задач
              </span>
            </div>

            <div className="divide-y divide-[#E2DED5] mt-1">
              {metrics.requiresAttention.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.actionUrl)}
                  className="py-3 px-1 hover:bg-[#FAF9F6] rounded-md transition-colors cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#171717] group-hover:text-[#FF5A36] transition-colors leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      Нажмите для перехода к модерации
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.severity === 'error'
                          ? 'bg-[#FDF2F2] text-[#C94A43]'
                          : item.severity === 'warning'
                          ? 'bg-[#FEF7EA] text-[#D89B35]'
                          : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}
                    >
                      {item.count}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#FF5A36] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
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

        {/* Right 2 Columns: Platform Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DED5]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF5A36]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Динамика активности на платформе
                </h2>
              </div>

              {/* Metric selector */}
              <div className="flex items-center gap-1 bg-[#F5F3EE] p-0.5 rounded-md text-[11px]">
                {[
                  { id: 'active', label: 'Активные (DAU)' },
                  { id: 'registrations', label: 'Регистрации' },
                  { id: 'exams', label: 'Сдачи тестов' },
                  { id: 'lessons', label: 'Уроки' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedChartMetric(m.id as any)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      selectedChartMetric === m.id
                        ? 'bg-white font-bold text-[#171717] shadow-2xs'
                        : 'text-[#78716C] hover:text-[#171717]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Crisp Bar Graphic */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-3 h-44 px-2">
                {currentSeries.map((val, idx) => {
                  const heightPercent = Math.round((val / maxVal) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-mono text-[#78716C] opacity-0 group-hover:opacity-100 transition-opacity">
                        {val.toLocaleString('ru-RU')}
                      </span>
                      <div className="w-full max-w-[42px] bg-[#F5F3EE] rounded-t-md h-36 flex items-end overflow-hidden">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-[#FF5A36] group-hover:bg-[#E84D2B] transition-all duration-300 rounded-t-xs"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[#78716C]">{chartDays[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2DED5] flex items-center justify-between text-xs text-[#78716C]">
            <span>Показана динамика за последние 7 дней (Демо-режим с фиксацией тренда)</span>
            <button
              onClick={() => onNavigate('/admin/analytics')}
              className="text-[#FF5A36] font-medium hover:underline cursor-pointer"
            >
              Подробная аналитика →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Important Activity Feed */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Недавние системные события (Аудит действий)
          </h2>
          <button
            onClick={() => onNavigate('/admin/audit')}
            className="text-xs text-[#FF5A36] font-medium hover:underline cursor-pointer"
          >
            Открыть полный журнал аудита →
          </button>
        </div>

        <div className="divide-y divide-[#E2DED5]">
          {metrics.recentActivity.map((event) => (
            <div key={event.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#A8A29E]">
                  {new Date(event.timestamp).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F0EEE8] font-mono text-[10px] font-semibold text-[#5C574F]">
                  {event.action}
                </span>
                <span className="font-medium text-[#171717]">{event.resourceTitle}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#78716C]">
                <span>Действие выполнил: <strong className="text-[#171717]">{event.actorName}</strong></span>
                <StatusBadge status={event.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
