import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { Reveal } from './landing/Reveal';

interface FinalCtaSectionProps {
  currentLang: Language;
  onStartFree: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ currentLang, onStartFree }) => {
  const t = locales[currentLang].cta;

  return (
    <section className="py-24 md:py-40 border-t border-[#E2DED5]">
      <Reveal className="max-w-7xl mx-auto px-6 md:px-10">
        <button type="button" onClick={onStartFree} className="group text-left cursor-pointer w-full">
          <span className="block font-display font-extrabold tracking-tighter leading-[0.9] text-[#171717] text-6xl sm:text-8xl lg:text-[10rem] whitespace-pre-line transition-colors duration-300 group-hover:text-[#FF5A36]">
            {t.title}
          </span>
          <span className="mt-10 inline-flex items-center gap-4 font-display font-bold uppercase tracking-wide text-base text-[#171717]">
            <span className="flex items-center justify-center w-14 h-14 bg-[#FF5A36] text-white transition-transform duration-300 group-hover:translate-x-2">
              <ArrowRight className="w-5 h-5" />
            </span>
            {t.button}
          </span>
        </button>

        <p className="mt-20 flex items-center gap-2 font-mono text-[11px] text-[#78716C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse" />
          {t.school}
        </p>
      </Reveal>
    </section>
  );
};
