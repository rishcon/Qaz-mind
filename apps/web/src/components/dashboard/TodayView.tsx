import React from 'react';
import { Language } from '../../types';
import { DashboardView, StudentProfile } from '../../types/dashboard';
import { AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

interface TodayViewProps {
  currentLang: Language;
  profile: StudentProfile;
  completedLessonsCount: number;
  mistakesCount: number;
  onNavigate: (view: DashboardView) => void;
}

/** The home screen shows only what the account already has: the goal, lessons studied and mistakes to repeat. */
export const TodayView: React.FC<TodayViewProps> = ({
  currentLang,
  profile,
  completedLessonsCount,
  mistakesCount,
  onNavigate,
}) => {
  const isRu = currentLang === 'ru';
  const hasStudied = completedLessonsCount > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {isRu ? `Привет, ${profile.name}` : `Сәлем, ${profile.name}`}
        </h1>
        <p className="mt-1 text-sm md:text-base text-[#74736F]">
          {isRu ? 'Продолжим подготовку?' : 'Дайындықты жалғастырамыз ба?'}
        </p>
      </div>

      {/* Main focus card */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
              {hasStudied
                ? isRu
                  ? 'Продолжить обучение'
                  : 'Оқуды жалғастыру'
                : isRu
                ? 'Первый шаг'
                : 'Бірінші қадам'}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
              {hasStudied
                ? isRu
                  ? 'Выберите следующий урок'
                  : 'Келесі сабақты таңдаңыз'
                : isRu
                ? 'Начните с первого урока'
                : 'Алғашқы сабақтан бастаңыз'}
            </h2>
            <p className="text-xs md:text-sm text-[#74736F] leading-relaxed">
              {isRu
                ? 'Уроки сгруппированы по предметам ЕНТ. Откройте предмет и выберите тему.'
                : 'Сабақтар ҰБТ пәндері бойынша топтастырылған. Пәнді ашып, тақырыпты таңдаңыз.'}
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="w-full md:w-auto px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
            >
              <span>{isRu ? 'К предметам' : 'Пәндерге'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Shortcuts */}
        <div className="lg:col-span-8 bg-white border border-[#E2DED5] p-6 rounded-sm shadow-xs space-y-4">
          <div className="border-b border-[#E2DED5] pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
              {isRu ? 'Разделы' : 'Бөлімдер'}
            </h3>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="w-full p-3.5 border border-[#E2DED5] hover:border-[#171717] rounded transition-all cursor-pointer flex items-center justify-between bg-[#FAF8F5] hover:bg-white text-left"
            >
              <span className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-[#FF5A36]" />
                <span className="font-bold text-xs text-[#171717]">{isRu ? 'Предметы и уроки' : 'Пәндер мен сабақтар'}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[#74736F]" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('mistakes')}
              className="w-full p-3.5 border border-[#E2DED5] hover:border-[#171717] rounded transition-all cursor-pointer flex items-center justify-between bg-[#FAF8F5] hover:bg-white text-left"
            >
              <span className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-[#FF5A36]" />
                <span className="font-bold text-xs text-[#171717]">{isRu ? 'Мои ошибки' : 'Менің қателерім'}</span>
              </span>
              <span className="text-xs font-mono text-[#74736F]">{mistakesCount}</span>
            </button>
          </div>
        </div>

        {/* Goal and counters */}
        <div className="lg:col-span-4 bg-white border border-[#E2DED5] p-6 rounded-sm shadow-xs space-y-4">
          <div className="border-b border-[#E2DED5] pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
              {isRu ? 'Прогресс' : 'Прогресс'}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                {isRu ? 'Моя цель' : 'Менің мақсатым'}
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">
                {profile.targetScore} <span className="text-sm font-normal text-[#74736F]">/ 140</span>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                {isRu ? 'Изучено уроков' : 'Оқылған сабақтар'}
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">{completedLessonsCount}</div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                {isRu ? 'Ошибок к повторению' : 'Қайталауға қателер'}
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">{mistakesCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
