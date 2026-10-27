import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  GraduationCap,
  Sparkles,
  Building2,
  CreditCard,
  TrendingUp,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { DemoBadge } from '../components/ui/DemoBadge';
import { MetricCard } from '../components/ui/MetricCard';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audience' | 'learning' | 'quality' | 'schools' | 'revenue'>('audience');
  const [period, setPeriod] = useState<'30days' | '90days' | 'year'>('30days');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#171717]">Платформенная аналитика</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Сквозные срезы аудитории, академической успеваемости по предметам ЕНТ и качества банка заданий.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          {[
            { id: '30days', label: '30 дней' },
            { id: '90days', label: 'Квартал' },
            { id: 'year', label: 'Учебный год 2026' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                period === tab.id
                  ? 'bg-[#FF5A36] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#E2DED5] text-xs overflow-x-auto">
        {[
          { id: 'audience', label: 'Аудитория и рост', icon: Users },
          { id: 'learning', label: 'Академический прогресс', icon: GraduationCap },
          { id: 'quality', label: 'Качество контента ЕНТ', icon: Sparkles },
          { id: 'schools', label: 'Школы и вовлеченность', icon: Building2 },
          { id: 'revenue', label: 'Лицензии и выручка (Demo)', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-white text-[#171717] shadow-xs border border-[#E2DED5]'
                  : 'text-[#78716C] hover:text-[#171717]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#FF5A36]' : 'text-[#78716C]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUDIENCE */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Новые регистрации" value="1,840" change={{ value: '+14%', trend: 'up' }} />
            <MetricCard title="Активные в день (DAU)" value="5,480" change={{ value: '+9%', trend: 'up' }} />
            <MetricCard title="Конверсия онбординга" value="84.2%" change={{ value: '+2.1%', trend: 'up' }} />
            <MetricCard title="Ученики 11 классов" value="76%" subtitle="Основной поток ЕНТ 2026" />
          </div>

          <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Распределение пользователей по регионам Казахстана
            </h3>
            <div className="space-y-3">
              {[
                { city: 'г. Астана', share: 28, count: '4,158' },
                { city: 'г. Алматы', share: 34, count: '5,049' },
                { city: 'г. Шымкент', share: 16, count: '2,376' },
                { city: 'Карагандинская обл.', share: 12, count: '1,782' },
                { city: 'Другие регионы', share: 10, count: '1,485' },
              ].map((item) => (
                <div key={item.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{item.city}</span>
                    <span className="text-[#78716C]">
                      {item.count} чел. ({item.share}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F0EEE8] h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${item.share}%` }} className="bg-[#FF5A36] h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEARNING */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Начато уроков" value="38,420" />
            <MetricCard title="Сдано срезов ЕНТ" value="34,200" />
            <MetricCard title="Средний балл ЕНТ" value="104 / 140" change={{ value: '+4.5 б.', trend: 'up' }} />
            <MetricCard title="Сдано домашних заданий" value="91.4%" />
          </div>

          <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Популярность и средний балл по профильным предметам
            </h3>
            <div className="divide-y divide-[#E2DED5] text-xs">
              {[
                { subject: 'История Казахстана (Обязательный)', attempts: 18400, avg: 15.4, max: 20 },
                { subject: 'Математическая грамотность (Обязательный)', attempts: 16200, avg: 8.2, max: 10 },
                { subject: 'Грамотность чтения (Обязательный)', attempts: 15100, avg: 8.6, max: 10 },
                { subject: 'Математика (Профильная)', attempts: 12400, avg: 34.8, max: 50 },
                { subject: 'Физика (Профильная)', attempts: 9200, avg: 31.2, max: 50 },
                { subject: 'Химия (Профильная)', attempts: 7800, avg: 36.4, max: 50 },
                { subject: 'Биология (Профильная)', attempts: 8100, avg: 37.1, max: 50 },
              ].map((row) => (
                <div key={row.subject} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#171717]">{row.subject}</div>
                    <div className="text-[11px] text-[#78716C]">{row.attempts.toLocaleString('ru-RU')} попыток сдачи</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[#258568]">
                      {row.avg} / {row.max}
                    </span>
                    <div className="text-[10px] text-[#78716C]">средний балл</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Вопросов в базе" value="8,400" subtitle="Верифицировано методистами 94%" />
            <MetricCard title="Часто ошибаемые задания" value="142" subtitle="Процент верных ответов < 35%" />
            <MetricCard title="Обоснованных жалоб" value="18" subtitle="Исправлено и переиздано" />
          </div>

          <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Задания с наибольшей долей ошибок (Требуют методического аудита)
            </h3>
            <div className="divide-y divide-[#E2DED5] text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-[#FF5A36]">qst-1002</span>
                  <div className="font-semibold text-[#171717]">Свод законов Касым хана (Множественный выбор)</div>
                  <div className="text-[11px] text-[#78716C]">История Казахстана • 4 правильных из 5</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#C94A43]">28% верных</span>
                  <div className="text-[10px] text-[#78716C]">Слишком высокий порог ошибок</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOLS */}
      {activeTab === 'schools' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Вовлеченность подключенных учебных заведений
          </h3>
          <div className="divide-y divide-[#E2DED5] text-xs">
            {[
              { name: 'Школа-лицей №79 г. Астана', students: 340, activeShare: '94%', completion: '91%' },
              { name: 'НИШ ФМН г. Астана', students: 520, activeShare: '98%', completion: '96%' },
              { name: 'РФМШ г. Алматы', students: 480, activeShare: '96%', completion: '94%' },
              { name: 'БИЛ (КТЛ) г. Шымкент', students: 290, activeShare: '92%', completion: '89%' },
              { name: 'Гимназия №159 г. Алматы', students: 280, activeShare: '88%', completion: '84%' },
            ].map((sch) => (
              <div key={sch.name} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#171717]">{sch.name}</div>
                  <div className="text-[11px] text-[#78716C]">{sch.students} учащихся подключено</div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="font-bold text-[#258568]">{sch.activeShare}</div>
                    <div className="text-[10px] text-[#78716C]">активность</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#171717]">{sch.completion}</div>
                    <div className="text-[10px] text-[#78716C]">сдача срезов</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE (DEMO DATASET) */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-xl text-xs text-[#9A6715] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Изолированный демонстрационный финансовый слой</p>
              <p className="mt-0.5">
                Реальные транзакции Kaspi Pay / Stripe будут агрегироваться сервером FastAPI при боевой интеграции биллинга.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Ориентировочная выручка (Demo)" value="₸ 18,420,000" />
            <MetricCard title="Оплаченных школьных мест" value="2,140 мест" />
            <MetricCard title="Индивидуальных подписок Plus" value="1,240 аккаунтов" />
            <MetricCard title="Истекающие лицензии (30 дн)" value="2 школы" />
          </div>
        </div>
      )}
    </div>
  );
};
