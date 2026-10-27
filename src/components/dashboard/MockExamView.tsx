import React, { useState } from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import {
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MockExamViewProps {
  currentLang: Language;
  profile: StudentProfile;
  onStartExam: () => void;
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  currentLang,
  profile,
  onStartExam,
}) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Байқау ҰБТ-сы' : 'Пробное ЕНТ'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          Симулятор тестирования в условиях, приближенных к официальному экзамену.
        </p>
      </div>

      {/* Main Overview Card */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-6">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
            Демонстрационный экзамен
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#171717] mt-1">
            Пробное тестирование по кодификатору
          </h2>
          <p className="text-xs md:text-sm text-[#74736F] mt-1.5 leading-relaxed">
            Проверьте готовность по обязательным и профильным предметам. Включает строгий таймер и подсчет честного сырого балла без искажений.
          </p>
        </div>

        {/* Compact Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E2DED5] rounded">
            <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
              Заданий
            </span>
            <div className="text-xl font-black font-mono text-[#171717] mt-0.5">
              5 вопросов
            </div>
            <span className="text-[10px] text-[#74736F]">демо-формат</span>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] border border-[#E2DED5] rounded">
            <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
              Таймер
            </span>
            <div className="text-xl font-black font-mono text-[#171717] mt-0.5">
              15 минут
            </div>
            <span className="text-[10px] text-[#74736F]">с сохранением</span>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] border border-[#E2DED5] rounded col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
              Оценивание
            </span>
            <div className="text-xl font-black font-mono text-[#171717] mt-0.5">
              Сырой балл
            </div>
            <span className="text-[10px] text-[#74736F]">без округлений</span>
          </div>
        </div>

        {/* Expandable Rules Section */}
        <div className="border border-[#E2DED5] rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setRulesOpen(!rulesOpen)}
            className="w-full p-3.5 text-left bg-[#FAF8F5] hover:bg-[#F5F3EE] flex items-center justify-between transition-colors cursor-pointer text-xs font-mono font-bold text-[#171717]"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Правила тестирования</span>
            </span>
            {rulesOpen ? <ChevronUp className="w-4 h-4 text-[#74736F]" /> : <ChevronDown className="w-4 h-4 text-[#74736F]" />}
          </button>

          {rulesOpen && (
            <div className="p-4 text-xs text-[#74736F] space-y-2 bg-white divide-y divide-[#FAF8F5]">
              <p>1. Таймер начинает отсчет сразу после старта и синхронизируется в реальном времени.</p>
              <p className="pt-2">2. Любой вопрос можно отметить для повторной проверки и вернуться к нему позже.</p>
              <p className="pt-2">3. Экзамен открывается в полноэкранном режиме Focus Mode. Все панели управления скрываются.</p>
              <p className="pt-2">4. Результат рассчитывается строго по фактическим верным ответам.</p>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="pt-2 border-t border-[#E2DED5]">
          <button
            type="button"
            onClick={onStartExam}
            className="w-full py-4 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-sm"
          >
            <span>Начать экзамен</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-[#74736F] text-center mt-2.5">
            При старте откроется Focus Mode на весь экран.
          </p>
        </div>
      </div>
    </div>
  );
};
