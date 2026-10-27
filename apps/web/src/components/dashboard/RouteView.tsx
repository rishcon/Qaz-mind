import React from 'react';
import { Language } from '../../types';
import { DashboardView } from '../../types/dashboard';
import { ArrowRight } from 'lucide-react';

interface RouteViewProps {
  currentLang: Language;
  onNavigate: (view: DashboardView) => void;
}

/** The route is built from diagnostic results. Until diagnostics exist, the screen says so and builds nothing. */
export const RouteView: React.FC<RouteViewProps> = ({ currentLang, onNavigate }) => {
  const isRu = currentLang === 'ru';

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      <div>
        <div className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider mb-2">
          {isRu ? 'ИНДИВИДУАЛЬНАЯ ТРАЕКТОРИЯ' : 'ЖЕКЕ ДАЙЫНДЫҚ ТРАЕКТОРИЯСЫ'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-[#171717]">
          {isRu ? 'Твой маршрут к ЕНТ' : 'ҰБТ-ға апарар маршрутың'}
        </h2>
      </div>

      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF5A36] font-bold">
          {isRu ? 'Пока недоступно' : 'Әзірге қолжетімсіз'}
        </span>
        <h3 className="text-xl md:text-2xl font-extrabold text-[#171717]">
          {isRu ? 'Маршрут появится после диагностики' : 'Маршрут диагностикадан кейін пайда болады'}
        </h3>
        <p className="text-xs md:text-sm text-[#74736F] leading-relaxed">
          {isRu
            ? 'Диагностика ещё не подключена, данных о твоём уровне по темам нет. Поэтому маршрут не строится.'
            : 'Диагностика әлі қосылмаған, тақырыптар бойынша деңгейіңе қатысты деректер жоқ. Сондықтан маршрут құрылмайды.'}
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
