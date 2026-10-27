import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCtaSectionProps {
  currentLang: Language;
  onStartFree: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  currentLang,
  onStartFree,
}) => {
  const t = locales[currentLang];

  return (
    <section className="py-28 md:py-44 border-b border-[#D9D5CB] bg-[#F5F3EE] relative overflow-hidden">
      {/* Editorial Watermark / Subtle structural framing (clean line, no blurry blobs) */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            QAZMIND 2026
          </span>
          <span className="w-16 h-[1px] bg-[#D9D5CB]" />
          <span className="font-mono text-xs text-[#171717]/60">
            {currentLang === 'ru' ? 'ТВОЙ ВЫБОР ВУЗА' : 'СЕНІҢ ЖОО ТАҢДАУЫҢ'}
          </span>
        </div>

        {/* Massive Headline */}
        <div className="max-w-5xl mb-12">
          <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.92]">
            {t.finalCta.headline}
          </h2>
        </div>

        {/* Support & Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-8 border-t border-[#D9D5CB]">
          <div className="lg:col-span-7">
            <p className="text-lg md:text-2xl text-[#171717]/80 leading-relaxed font-normal max-w-xl">
              {t.finalCta.subtext}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#171717]/60">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>{t.finalCta.guarantee}</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-start lg:justify-end gap-4">
            <button
              type="button"
              onClick={onStartFree}
              className="px-10 py-5 bg-[#FF5A36] hover:bg-[#E54825] active:translate-y-0.5 text-white font-display font-black text-base md:text-lg tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-3 shadow-[6px_6px_0px_#171717] cursor-pointer"
            >
              <span>{t.finalCta.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
