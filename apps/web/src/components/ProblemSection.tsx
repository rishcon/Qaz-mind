import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';

interface ProblemSectionProps {
  currentLang: Language;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({ currentLang }) => {
  const t = locales[currentLang];

  return (
    <section className="py-24 md:py-32 border-b border-[#D9D5CB] bg-[#F5F3EE]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Index */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.problem.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        {/* Section Heading & Lead */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16 md:mb-20">
          <div className="lg:col-span-8">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
              {t.problem.headline}
            </h2>
          </div>
          <div className="lg:col-span-4 lg:pt-4">
            <p className="text-lg md:text-xl text-[#171717]/80 leading-relaxed font-normal">
              {t.problem.description}
            </p>
          </div>
        </div>

        {/* Art-Directed Typographic Comparison & Large Numeral */}
        <div className="border border-[#D9D5CB] bg-[#EAE7DF] grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#D9D5CB]">
          {/* Big Numeral Metric Column (4 cols) */}
          <div className="md:col-span-4 p-8 md:p-12 flex flex-col justify-between bg-[#F5F3EE]">
            <div>
              <span className="font-mono text-xs text-[#171717]/50 tracking-wider uppercase block mb-2">
                {currentLang === 'ru' ? 'ЗАДАНИЙ НА ЕНТ' : 'ҰБТ ТАПСЫРМАЛАРЫ'}
              </span>
              <div className="font-display font-black text-7xl lg:text-8xl text-[#FF5A36] tracking-tighter leading-none my-3">
                {t.problem.statNumber}
              </div>
            </div>
            <p className="text-sm text-[#171717]/70 leading-relaxed mt-6">
              {t.problem.statSubtext}
            </p>
          </div>

          {/* Side A: Traditional Routine (4 cols) */}
          <div className="md:col-span-4 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 bg-[#171717]/30" />
                <h3 className="font-display text-sm font-bold tracking-wider uppercase text-[#171717]/70">
                  {t.problem.traditionalLabel}
                </h3>
              </div>
              <p className="text-base text-[#171717]/80 leading-relaxed">
                {t.problem.traditionalText}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#D9D5CB] font-mono text-xs text-[#171717]/50">
              <span className="block">{currentLang === 'ru' ? 'ИТОГ: Иллюзия готовности' : 'НӘТИЖЕ: Дайындық иллюзиясы'}</span>
              <span className="text-[#171717]/80 mt-1 block">
                {currentLang === 'ru' ? 'Те же ошибки в день экзамена' : 'Емтихан күні қайталанған қателер'}
              </span>
            </div>
          </div>

          {/* Side B: QAZMIND Deliberate Trajectory (4 cols) */}
          <div className="md:col-span-4 p-8 md:p-12 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 bg-[#FF5A36]" />
                <h3 className="font-display text-sm font-bold tracking-wider uppercase text-[#FF5A36]">
                  {t.problem.qazmindLabel}
                </h3>
              </div>
              <p className="text-base text-[#171717] leading-relaxed font-medium">
                {t.problem.qazmindText}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#D9D5CB] font-mono text-xs text-[#FF5A36]">
              <span className="block font-semibold">
                {currentLang === 'ru' ? 'ИТОГ: Точечное устранение пробелов' : 'НӘТИЖЕ: Олқылықтарды дәл жою'}
              </span>
              <span className="text-[#171717] mt-1 block">
                {currentLang === 'ru' ? 'Уверенность в каждом ответе' : 'Әр жауаптағы берік сенім'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
