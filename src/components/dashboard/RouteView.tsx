import React, { useState } from 'react';
import { Language } from '../../types';
import { StudentProfile, DashboardView } from '../../types/dashboard';
import { routeSteps } from '../../content/questions';
import {
  Check,
  Compass,
  Clock,
  Target,
  ArrowRight,
  Sliders,
  Calendar,
} from 'lucide-react';

interface RouteViewProps {
  currentLang: Language;
  profile: StudentProfile;
  onNavigate: (view: DashboardView) => void;
}

export const RouteView: React.FC<RouteViewProps> = ({
  currentLang,
  profile,
  onNavigate,
}) => {
  const [dailyPaceMinutes, setDailyPaceMinutes] = useState<number>(profile.dailyGoalMinutes);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(1); // Step 02 active

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider mb-2">
          {currentLang === 'ru' ? 'ИНДИВИДУАЛЬНАЯ ТРАЕКТОРИЯ' : 'ЖЕКЕ ДАЙЫНДЫҚ ТРАЕКТОРИЯСЫ'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-[#171717]">
          {currentLang === 'ru' ? 'Твой маршрут к ЕНТ' : 'ҰБТ-ға апарар маршрутың'}
        </h2>
        <p className="mt-2 text-base md:text-lg text-[#74736F] max-w-xl font-normal leading-relaxed">
          {currentLang === 'ru'
            ? 'Понятный план подготовки, который меняется вместе с твоим прогрессом.'
            : 'Прогресіңмен бірге бейімделетін түсінікті әрі жүйелі дайындық жоспары.'}
        </p>
      </div>

      {/* 5-Step Editorial Learning Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {routeSteps.map((step, idx) => {
          const isSelected = idx === selectedMilestone;
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <button
              key={step.step}
              type="button"
              onClick={() => setSelectedMilestone(idx)}
              className={`p-5 text-left border rounded-md transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#171717] shadow-[4px_4px_0px_#171717]'
                  : isDone
                  ? 'bg-[#FAFAF8] border-[#E2DED5]'
                  : isCurrent
                  ? 'bg-white border-[#FF5A36] shadow-xs'
                  : 'bg-[#F0EEE8] border-[#E2DED5] opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    isDone
                      ? 'bg-[#171717] text-white'
                      : isCurrent
                      ? 'bg-[#FF5A36] text-white'
                      : 'bg-[#E2DED5] text-[#74736F]'
                  }`}
                >
                  {step.step}
                </span>

                <span className="font-mono text-[10px] uppercase font-bold text-[#74736F]">
                  {isDone && <Check className="w-3.5 h-3.5 text-[#258568] inline" />}
                  {isCurrent && <span className="text-[#FF5A36]">В работе</span>}
                </span>
              </div>

              <h4 className="font-display font-bold text-base text-[#171717] leading-tight">
                {currentLang === 'ru' ? step.titleRu : step.titleKz}
              </h4>
              <p className="text-[11px] text-[#74736F] mt-1 line-clamp-2">
                {currentLang === 'ru' ? step.subtitleRu : step.subtitleKz}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Milestone Focus & Recommendations */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-1">
              {currentLang === 'ru' ? 'ТЕКУЩИЙ ЭТАП' : 'АҒЫМДАҒЫ КЕЗЕҢ'}
            </span>
            <h3 className="text-2xl font-bold font-display text-[#171717]">
              {routeSteps[selectedMilestone].step}. {currentLang === 'ru' ? routeSteps[selectedMilestone].titleRu : routeSteps[selectedMilestone].titleKz}
            </h3>
            <p className="text-sm md:text-base text-[#74736F] mt-2 leading-relaxed">
              {currentLang === 'ru' ? routeSteps[selectedMilestone].descriptionRu : routeSteps[selectedMilestone].descriptionKz}
            </p>

            <div className="mt-6 pt-6 border-t border-[#E2DED5] flex flex-wrap gap-8 text-xs font-mono">
              <div>
                <span className="text-[#74736F] block mb-0.5">{currentLang === 'ru' ? 'ДЛИТЕЛЬНОСТЬ' : 'ҰЗАҚТЫҒЫ'}</span>
                <span className="font-bold text-[#171717]">
                  {currentLang === 'ru' ? routeSteps[selectedMilestone].durationRu : routeSteps[selectedMilestone].durationKz}
                </span>
              </div>
              <div>
                <span className="text-[#74736F] block mb-0.5">{currentLang === 'ru' ? 'КЛЮЧЕВОЙ РЕЗУЛЬТАТ' : 'БАСТЫ НӘТИЖЕ'}</span>
                <span className="font-bold text-[#171717]">
                  {currentLang === 'ru' ? routeSteps[selectedMilestone].kpiRu : routeSteps[selectedMilestone].kpiKz}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#F5F3EE] p-5 border border-[#E2DED5] space-y-4">
            <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider block">
              {currentLang === 'ru' ? 'НАСТРОЙКА ТЕМПА' : 'ҚАРҚЫН БАПТАУЫ'}
            </span>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>{currentLang === 'ru' ? 'В день:' : 'Күніне:'}</span>
                <span className="font-mono font-bold text-[#FF5A36]">{dailyPaceMinutes} мин</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={dailyPaceMinutes}
                onChange={(e) => setDailyPaceMinutes(Number(e.target.value))}
                className="w-full accent-[#FF5A36]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#74736F] mt-1">
                <span>20 мин</span>
                <span>45 мин (оптимально)</span>
                <span>90 мин</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{currentLang === 'ru' ? 'Открыть темы этапа' : 'Кезең тақырыптарын ашу'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
