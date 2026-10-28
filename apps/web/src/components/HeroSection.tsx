import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { ENT_SUBJECTS } from '../content/ent';
import { Boxes } from './ui/background-boxes';
import './landing/landing.css';

interface HeroSectionProps {
  currentLang: Language;
  onStart: () => void;
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ currentLang, onStart, onExplore }) => {
  const t = locales[currentLang].hero;
  const names = ENT_SUBJECTS.map((s) => (currentLang === 'ru' ? s.nameRu : s.nameKz));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => i + 1), 2400);
    return () => window.clearInterval(timer);
  }, []);

  const lines = t.title.split('\n');

  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-32 md:pt-40 overflow-hidden border-b border-[#D9D5CB] bg-white">
      <Boxes />
      <div className="relative z-20 max-w-7xl w-full mx-auto px-6 md:px-10 pointer-events-none">
        <div className="qm-fade flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs font-semibold tracking-wider">
          <span className="text-[#FF5A36]">{t.label}</span>
          <span className="w-8 h-px bg-[#D9D5CB]" />
          <span className="text-[#171717]/60 flex items-center gap-2 overflow-hidden">
            {t.today}:
            <span className="relative inline-block h-[1.4em] overflow-hidden align-bottom">
              <span key={index} className="qm-swap text-[#171717]">
                {names[index % names.length]}
              </span>
            </span>
          </span>
        </div>

        <h1 className="mt-8 font-display font-extrabold tracking-tighter leading-[0.92] text-[#171717] text-[2.9rem] sm:text-7xl lg:text-[7.5rem]">
          {lines.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span className="qm-rise" style={{ ['--d' as string]: `${i * 140}ms` }}>
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-10 md:mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="qm-fade max-w-lg" style={{ ['--d' as string]: '450ms' }}>
            <p className="text-lg text-[#171717]/80 leading-relaxed">{t.lead}</p>
            <p className="mt-4 font-mono text-xs font-semibold tracking-wide text-[#FF5A36]">{t.format}</p>
          </div>
          <div className="qm-fade pointer-events-auto flex flex-col sm:flex-row sm:items-center gap-5" style={{ ['--d' as string]: '600ms' }}>
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF5A36] hover:bg-[#E54825] text-white font-display font-bold text-base tracking-wide uppercase transition-colors cursor-pointer"
            >
              <span>{t.cta}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </button>
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-2 text-base font-semibold text-[#171717] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              {t.secondary} <span>↓</span>
            </button>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="relative z-20 pointer-events-none mt-16 md:mt-20 pb-8 overflow-hidden select-none">
        <div className="qm-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0">
              {names.map((name) => (
                <span key={name} className="flex items-center">
                  <span className="qm-outline font-display font-extrabold uppercase tracking-tighter text-5xl md:text-7xl px-6">
                    {name}
                  </span>
                  <span className="w-3 h-3 rounded-full bg-[#FF5A36] shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
