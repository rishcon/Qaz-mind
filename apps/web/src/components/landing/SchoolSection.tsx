import React from 'react';
import { Language } from '../../types';
import { locales } from '../../content/locales';
import { Reveal } from './Reveal';

/** The school cabinet is not built yet. The frame shows the columns it will have, with dashes instead of data. */
export const SchoolSection: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].school;

  return (
    <section className="py-24 md:py-32 border-t border-[#E2DED5]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        <Reveal className="lg:col-span-5">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.label}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tighter leading-[0.98] font-display text-[#171717]">
            {t.title}
          </h2>
          <p className="mt-6 text-base text-[#5C574F] leading-relaxed">{t.caption}</p>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <div className="border border-dashed border-[#A8A29E] bg-[#FAF9F6] p-6 md:p-8">
            <span className="inline-block px-2 py-1 border border-[#FF5A36] text-[#FF5A36] font-mono text-[10px] font-bold uppercase tracking-wider">
              {t.tag}
            </span>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#E2DED5] pt-6">
              {t.columns.map((column) => (
                <div key={column} className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#78716C] leading-snug">
                    {column}
                  </div>
                  <div className="mt-3 font-display text-3xl font-extrabold text-[#A8A29E]">—</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
