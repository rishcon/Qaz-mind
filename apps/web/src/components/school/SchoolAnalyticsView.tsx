import React, { useState } from 'react';
import { Organization, SchoolClass } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import { BarChart3, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';

interface SchoolAnalyticsViewProps {
  organization: Organization;
  classes: SchoolClass[];
}

export const SchoolAnalyticsView: React.FC<SchoolAnalyticsViewProps> = ({
  organization,
  classes,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const stats = schoolService.getSchoolStats(organization.id);

  const problemTopics = [
    {
      topic: 'Хан Кенесары и восстание 1837–1847 гг.',
      subject: 'История Казахстана',
      errorRate: 42,
      affectedClasses: ['11 «А»'],
      recommendation: 'Назначить повторительную практику по разделу «Колониальный период»',
    },
    {
      topic: 'Дробно-рациональные уравнения с параметром',
      subject: 'Математика (профильная)',
      errorRate: 39,
      affectedClasses: ['11 «А»'],
      recommendation: 'Рекомендовать разбор типовых заданий №24–28',
    },
    {
      topic: 'Клеточное деление: Митоз и Мейоз',
      subject: 'Биология',
      errorRate: 36,
      affectedClasses: ['11 «Б»'],
      recommendation: 'Закрепить урок «Цитология и генетический код»',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D5CB]">
        <div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Аналитика подготовки</h1>
          <p className="text-xs text-[#74736F] mt-0.5">
            Честные данные на основе сданных учащимися заданий. Выявление пробелов в знаниях без искусственных коэффициентов.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#74736F]" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#D9D5CB] rounded font-semibold text-[#171717]"
          >
            <option value="all">Все классы школы</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#D9D5CB] rounded">
          <div className="text-xs font-mono uppercase text-[#74736F]">Средняя успеваемость</div>
          <div className="text-3xl font-black text-[#171717] mt-2">{stats.avgPerformance}%</div>
          <div className="text-xs text-[#74736F] mt-1">Правильных ответов по всем тестам</div>
        </div>

        <div className="p-5 bg-white border border-[#D9D5CB] rounded">
          <div className="text-xs font-mono uppercase text-[#74736F]">Дисциплина сдачи</div>
          <div className="text-3xl font-black text-[#258568] mt-2">{stats.completionRate}%</div>
          <div className="text-xs text-[#74736F] mt-1">Заданий сдано до истечения дедлайна</div>
        </div>

        <div className="p-5 bg-white border border-[#D9D5CB] rounded">
          <div className="text-xs font-mono uppercase text-[#74736F]">Тем риска</div>
          <div className="text-3xl font-black text-[#FF5A36] mt-2">{problemTopics.length} темы</div>
          <div className="text-xs text-[#74736F] mt-1">Ошибок более 35% от класса</div>
        </div>
      </div>

      {/* Topics Requiring Attention */}
      <div className="bg-white border border-[#D9D5CB] rounded p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF5A36]" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
            Темы с повышенным числом ошибок
          </h2>
        </div>

        <div className="space-y-3">
          {problemTopics.map((item, idx) => (
            <div key={idx} className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-[#FF5A36]">
                    {item.subject}
                  </span>
                  <div className="text-sm font-bold text-[#171717] mt-0.5">{item.topic}</div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-mono font-bold rounded">
                    {item.errorRate}% ошибок
                  </span>
                  <div className="text-[10px] text-[#74736F] mt-0.5">Классы: {item.affectedClasses.join(', ')}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2DED5] text-[11px] text-[#74736F]">
                Рекомендация: <strong className="text-[#171717]">{item.recommendation}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
