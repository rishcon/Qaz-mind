import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { ProductWindow } from './landing/ProductWindow';

interface HeroSectionProps {
  currentLang: Language;
  onStart: () => void;
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ currentLang, onStart, onExplore }) => {
  const t = locales[currentLang];

  return (
    <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 border-b border-[#D9D5CB] overflow-hidden">
      {/* Background architectural grid line */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="max-w-7xl mx-auto h-full border-x border-[#D9D5CB]/40 grid grid-cols-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.hero.label}</span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[0.96] text-[#171717] font-display">
              {t.hero.title.split('\n').map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-8 text-lg md:text-xl text-[#171717]/80 max-w-md leading-relaxed">{t.hero.subtitle}</p>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                type="button"
                onClick={onStart}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF5A36] hover:bg-[#E54825] active:translate-y-0.5 text-white font-display font-bold text-base tracking-wide uppercase transition-all duration-150 cursor-pointer shadow-[0_4px_14px_rgba(255,90,54,0.25)]"
              >
                <span>{t.hero.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExplore}
                className="group inline-flex items-center gap-2 text-base font-semibold text-[#171717] hover:text-[#FF5A36] transition-colors py-2 cursor-pointer border-b border-transparent hover:border-[#FF5A36]"
              >
                <span>{t.hero.secondary}</span>
                <span className="transform group-hover:translate-x-1 transition-transform">↓</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <ProductWindow currentLang={currentLang} />
            <p className="mt-4 font-mono text-[11px] text-[#78716C]">{t.window.caption}</p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-8 border-t border-[#D9D5CB] grid grid-cols-3 gap-4 md:gap-10">
          {t.hero.facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <div className="font-display font-black text-4xl md:text-5xl tracking-tighter text-[#171717]">
                {fact.value}
              </div>
              <div className="mt-2 text-xs md:text-sm text-[#5C574F] leading-snug">{fact.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
