import React from 'react';
import { Language } from '../../types';
import { locales } from '../../content/locales';

/**
 * Schematic of the student cabinet. The menu is the dashboard's real menu. Progress values are dashes,
 * because no student has any yet: the picture shows the layout, not a result.
 */
export const ProductWindow: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].window;

  return (
    <div aria-hidden="true" className="select-none bg-[#FAF9F6] border border-[#171717] shadow-[8px_8px_0px_#171717]">
      <div className="h-10 px-4 flex items-center gap-1.5 border-b border-[#E2DED5] bg-[#F5F3EE]">
        <span className="w-2 h-2 rounded-full bg-[#D9D5CB]" />
        <span className="w-2 h-2 rounded-full bg-[#D9D5CB]" />
        <span className="w-2 h-2 rounded-full bg-[#D9D5CB]" />
        <span className="ml-4 flex items-center gap-1 font-display text-sm font-black tracking-tight text-[#171717]">
          qazmind
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] mb-0.5" />
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[8.5rem_1fr]">
        <aside className="hidden sm:block border-r border-[#E2DED5] p-2.5 space-y-1">
          {t.menu.map((item, index) => (
            <div
              key={item}
              className={`px-2.5 py-2 text-[11px] font-medium leading-tight ${
                index === 0 ? 'bg-[#FFF7F5] text-[#FF5A36] border-l-2 border-[#FF5A36]' : 'text-[#5C574F]'
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="p-4 sm:p-6 space-y-4 min-w-0">
          <div className="bg-white border border-[#E2DED5] p-5 space-y-3">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-[#FF5A36] font-bold">
              {t.firstStep}
            </span>
            <div className="font-display text-lg font-bold text-[#171717]">{t.firstStepTitle}</div>
            <span className="inline-block px-4 py-2 bg-[#171717] text-white font-mono text-[11px] font-bold uppercase tracking-wider">
              {t.action}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {t.cards.map((card) => (
              <div key={card} className="bg-white border border-[#E2DED5] p-3 min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#78716C] leading-tight">{card}</div>
                <div className="mt-4 font-display text-2xl font-extrabold text-[#A8A29E]">—</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
