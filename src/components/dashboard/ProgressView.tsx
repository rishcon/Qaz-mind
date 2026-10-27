import React from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  BarChart2,
} from 'lucide-react';

export interface ExamHistoryRecord {
  id: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
}

interface ProgressViewProps {
  currentLang: Language;
  profile: StudentProfile;
  completedLessonIds: string[];
  examHistory: ExamHistoryRecord[];
  practicedCount: number;
  onStartLearning: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  currentLang,
  profile,
  completedLessonIds,
  examHistory,
  practicedCount,
  onStartLearning,
}) => {
  const hasData = completedLessonIds.length > 0 || examHistory.length > 0 || practicedCount > 0;

  if (!hasData) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
            {currentLang === 'kz' ? 'Менің прогресім' : 'Мой прогресс'}
          </h1>
          <p className="mt-1 text-sm text-[#74736F]">
            Честная статистика подготовки к ЕНТ.
          </p>
        </div>

        <div className="p-8 md:p-12 text-center bg-white border border-[#E2DED5] rounded-sm shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-[#FAF8F5] border border-[#E2DED5] rounded-full flex items-center justify-center mx-auto text-[#FF5A36]">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#171717]">
              {currentLang === 'kz' ? 'Әзірге нәтижелер жоқ' : 'Пока нет результатов'}
            </h2>
            <p className="text-xs md:text-sm text-[#74736F] mt-1.5 leading-relaxed">
              {currentLang === 'kz'
                ? 'Прогресті көру үшін алғашқы сабақты немесе тестті тапсырыңыз.'
                : 'Пройди первый урок или тест, чтобы увидеть прогресс.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartLearning}
              className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
            >
              <span>Начать обучение</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active student stats with real values
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Менің прогресім' : 'Мой прогресс'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          Реальные показатели: пройденные уроки, решенные тесты и динамика.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#E2DED5] rounded-sm shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] block">
            Целевой балл
          </span>
          <div className="text-3xl font-black font-mono text-[#171717] mt-1">
            {profile.targetScore} <span className="text-sm font-normal text-[#74736F]">/ 140</span>
          </div>
          <span className="text-xs text-[#74736F] mt-1 block">ЕНТ 2026</span>
        </div>

        <div className="p-5 bg-white border border-[#E2DED5] rounded-sm shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] block">
            Изучено тем
          </span>
          <div className="text-3xl font-black font-mono text-[#171717] mt-1">
            {completedLessonIds.length}
          </div>
          <span className="text-xs text-[#74736F] mt-1 block">полных модулей</span>
        </div>

        <div className="p-5 bg-white border border-[#E2DED5] rounded-sm shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] block">
            Решено заданий
          </span>
          <div className="text-3xl font-black font-mono text-[#171717] mt-1">
            {practicedCount}
          </div>
          <span className="text-xs text-[#74736F] mt-1 block">в практике и тестах</span>
        </div>
      </div>

      {/* Mock Exam History */}
      {examHistory.length > 0 && (
        <div className="bg-white border border-[#E2DED5] p-6 rounded-sm shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#171717]">
            История пробных тестирований
          </h2>
          <div className="space-y-2.5">
            {examHistory.map((h) => (
              <div
                key={h.id}
                className="p-3.5 bg-[#FAF8F5] border border-[#E2DED5] rounded flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#171717]">
                    Демонстрационный тест ЕНТ
                  </div>
                  <div className="text-[11px] text-[#74736F] font-mono mt-0.5">
                    {h.date}
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-[#171717]">
                  {h.score} / {h.total} ({h.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
