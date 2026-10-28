import React from 'react';
import { BookOpen, ListChecks, LucideIcon, Target } from 'lucide-react';
import { Language } from '../../types';
import { locales } from '../../content/locales';
import { Reveal } from './Reveal';

/** One icon per step, in the same order as the copy. */
const STEP_ICONS: LucideIcon[] = [ListChecks, BookOpen, Target];

/** Three steps of the study flow. Titles only: the product itself explains the rest. */
export const StepsSection: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].steps;

  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Reveal>
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.label}</span>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 border-t border-[#171717] divide-y md:divide-y-0 md:divide-x divide-[#E2DED5]">
          {t.items.map((item, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <Reveal key={item} delay={index * 120}>
                <div className="flex flex-col h-full md:min-h-56 p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#A8A29E]">0{index + 1}</span>
                    <Icon className="w-5 h-5 text-[#FF5A36]" />
                  </div>
                  <h3 className="mt-auto pt-10 md:pt-16 font-display text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-[#171717]">
                    {item}
                  </h3>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
