import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { Reveal } from './landing/Reveal';

interface FinalCtaSectionProps {
  currentLang: Language;
  onStartFree: () => void;
}

/** Closing block. The only dark surface on the page, so the call to action is the last thing read. */
export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ currentLang, onStartFree }) => {
  const t = locales[currentLang].finalCta;

  return (
    <section className="bg-[#171717] text-[#F5F3EE]">
      <Reveal className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[0.98] font-display">
          {t.title}
        </h2>
        <button
          type="button"
          onClick={onStartFree}
          className="self-start inline-flex items-center gap-3 px-8 py-4 bg-[#FF5A36] hover:bg-[#E54825] active:translate-y-0.5 text-white font-display font-bold text-base tracking-wide uppercase transition-all duration-150 cursor-pointer shrink-0"
        >
          <span>{t.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </Reveal>
    </section>
  );
};
