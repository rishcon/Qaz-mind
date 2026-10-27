import React from 'react';
import { Language } from '../../types';
import { DashboardView } from '../../types/dashboard';
import { ArrowRight } from 'lucide-react';

interface MockExamViewProps {
  currentLang: Language;
  onNavigate: (view: DashboardView) => void;
}

/**
 * The trial exam is built only from published questions and follows the ENT specification: 120 tasks, 140 points.
 * Until such questions exist, no exam is started and no score is shown.
 */
export const MockExamView: React.FC<MockExamViewProps> = ({ currentLang, onNavigate }) => {
  const isRu = currentLang === 'ru';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {isRu ? 'Пробное ЕНТ' : 'Байқау ҰБТ-сы'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          {isRu
            ? 'Экзамен по спецификации ЕНТ: 120 заданий, 140 баллов.'
            : 'ҰБТ спецификациясы бойынша емтихан: 120 тапсырма, 140 балл.'}
        </p>
      </div>

      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF5A36] font-bold">
          {isRu ? 'Пока недоступно' : 'Әзірге қолжетімсіз'}
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
          {isRu ? 'Пробный экзамен пока не запускается' : 'Байқау емтиханы әзірге іске қосылмайды'}
        </h2>
        <p className="text-xs md:text-sm text-[#74736F] leading-relaxed">
          {isRu
            ? 'Экзамен собирается только из опубликованных заданий. Таких заданий пока нет, поэтому экзамен не запускается и результат не выставляется.'
            : 'Емтихан тек жарияланған тапсырмалардан құралады. Мұндай тапсырмалар әлі жоқ, сондықтан емтихан іске қосылмайды және нәтиже қойылмайды.'}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="px-5 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span>{isRu ? 'К предметам' : 'Пәндерге'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
