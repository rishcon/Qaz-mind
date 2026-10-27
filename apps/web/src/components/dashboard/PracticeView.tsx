import React from 'react';
import { Language } from '../../types';
import { DashboardView } from '../../types/dashboard';
import { ArrowRight } from 'lucide-react';

interface PracticeViewProps {
  currentLang: Language;
  onNavigate: (view: DashboardView) => void;
}

/**
 * Practice runs on published questions from the content bank. The bank is not published yet, so no session is
 * started here and no questions are shown.
 */
export const PracticeView: React.FC<PracticeViewProps> = ({ currentLang, onNavigate }) => {
  const isRu = currentLang === 'ru';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {isRu ? 'Практика' : 'Практика'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          {isRu
            ? 'Закрепляйте пройденные темы на заданиях ЕНТ.'
            : 'Өтілген тақырыптарды ҰБТ тапсырмаларында бекітіңіз.'}
        </p>
      </div>

      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF5A36] font-bold">
          {isRu ? 'Пока недоступно' : 'Әзірге қолжетімсіз'}
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
          {isRu ? 'Практика откроется после публикации заданий' : 'Практика тапсырмалар жарияланғаннан кейін ашылады'}
        </h2>
        <p className="text-xs md:text-sm text-[#74736F] leading-relaxed">
          {isRu
            ? 'Задания для практики берутся из банка проверенных вопросов. Пока в банке нет опубликованных заданий, сессия не запускается.'
            : 'Практика тапсырмалары тексерілген сұрақтар банкінен алынады. Банкте жарияланған тапсырмалар жоқ болса, сессия іске қосылмайды.'}
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
