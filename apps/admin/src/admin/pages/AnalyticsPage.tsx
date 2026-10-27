import React, { useState } from 'react';
import { Users, GraduationCap, Sparkles, Building2, CreditCard } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { ADMIN_API_CONNECTED } from '../services/adminService';

/**
 * Platform analytics. Every figure is calculated on the server from real data (ТЗ, п. 9.3: numerator and
 * denominator are shown separately, no forecasts). Until the analytics endpoint exists, figures are not loaded.
 */

type TabId = 'audience' | 'learning' | 'quality' | 'schools' | 'licences';

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'audience', label: 'Аудитория', icon: Users },
  { id: 'learning', label: 'Учебный прогресс', icon: GraduationCap },
  { id: 'quality', label: 'Качество контента', icon: Sparkles },
  { id: 'schools', label: 'Школы', icon: Building2 },
  { id: 'licences', label: 'Лицензии и места', icon: CreditCard },
];

interface Indicator {
  title: string;
  hint: string;
}

const INDICATORS: Record<TabId, Indicator[]> = {
  audience: [
    { title: 'Зарегистрированные пользователи', hint: 'Всего и за выбранный период' },
    { title: 'Подтверждённые адреса', hint: 'Из всех регистраций: числитель и знаменатель' },
    { title: 'Активные за день', hint: 'Пользователи с входом или действием в сутки' },
    { title: 'Завершившие онбординг', hint: 'Из всех зарегистрированных' },
  ],
  learning: [
    { title: 'Начатые уроки', hint: 'Уроки с сохранённым прогрессом' },
    { title: 'Завершённые уроки', hint: 'Из начатых' },
    { title: 'Пробные экзамены', hint: 'Сдачи: доступны после подключения пробников' },
    { title: 'Ошибки по темам', hint: 'Распределение по темам программы' },
  ],
  quality: [
    { title: 'Вопросы в банке', hint: 'По статусам: черновик, на проверке, опубликован' },
    { title: 'Ожидают рецензии', hint: 'Вопросы в статусе «на проверке»' },
    { title: 'Жалобы учащихся', hint: 'Открытые и закрытые' },
    { title: 'Вопросы без перевода KZ', hint: 'Требуется перевод до публикации' },
  ],
  schools: [
    { title: 'Подключённые школы', hint: 'Одобренные заявки' },
    { title: 'Классы', hint: 'Всего по всем школам' },
    { title: 'Учащиеся в классах', hint: 'Из лицензионного пула' },
    { title: 'Выполнение заданий школ', hint: 'Выполнено к сроку: числитель и знаменатель' },
  ],
  licences: [
    { title: 'Лицензии с местами', hint: 'Куплено и занято мест' },
    { title: 'Истекающие лицензии', hint: 'Срок действия в ближайшие 30 дней' },
    { title: 'Свободные места', hint: 'Куплено минус занято' },
  ],
};

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('audience');
  const [period, setPeriod] = useState<'30days' | '90days' | 'year'>('30days');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Платформенная аналитика</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Показатели считаются на сервере по реальным данным. Здесь не показываются прогнозы и оценки.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          {[
            { id: '30days', label: '30 дней' },
            { id: '90days', label: 'Квартал' },
            { id: 'year', label: 'Учебный год' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as typeof period)}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                period === tab.id ? 'bg-[#FF5A36] text-white shadow-xs' : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#E2DED5] text-xs overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isCurrent ? 'bg-white text-[#171717] shadow-xs border border-[#E2DED5]' : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#FF5A36]' : 'text-[#78716C]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {INDICATORS[activeTab].map((indicator) => (
          <MetricCard key={indicator.title} title={indicator.title} value="—" subtitle={indicator.hint} />
        ))}
      </div>

      <p className="text-xs text-[#78716C]">
        {ADMIN_API_CONNECTED
          ? 'Значения загружаются за выбранный период.'
          : 'Значения не загружены: сервер аналитики ещё не подключён. Прочерк означает «нет данных», а не ноль.'}
      </p>
    </div>
  );
};
