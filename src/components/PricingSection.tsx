import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { Check, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  currentLang: Language;
  onSelectFree: () => void;
  onNotifyPlus: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  currentLang,
  onSelectFree,
  onNotifyPlus,
}) => {
  const t = locales[currentLang];

  return (
    <section id="pricing" className="py-24 md:py-36 border-b border-[#D9D5CB] bg-[#EAE7DF]/30">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.pricing.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        <div className="max-w-3xl mb-16 md:mb-20">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
            {t.pricing.headline}
          </h2>
        </div>

        {/* Clean Editorial Comparison (No Fake Discounts, No AI Slop Cards) */}
        <div className="border border-[#171717] bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#171717] shadow-[6px_6px_0px_#171717]">
          {/* Free Plan (Left) */}
          <div className="p-8 md:p-12 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
                  {currentLang === 'ru' ? 'БЕЗ ОПЛАТЫ' : 'ТЕГІН'}
                </span>
                <span className="font-mono text-xs text-[#171717]/60">
                  {t.pricing.freePeriod}
                </span>
              </div>

              <h3 className="font-display font-extrabold text-3xl md:text-4xl text-[#171717] mb-2">
                {t.pricing.freeTitle}
              </h3>

              <div className="font-display font-black text-5xl md:text-6xl text-[#171717] tracking-tight my-6">
                0 ₸
              </div>

              <div className="space-y-4 my-8 pt-6 border-t border-[#D9D5CB]">
                {t.pricing.freeFeatures.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#171717]/85">
                    <Check className="w-4 h-4 text-[#171717] shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-[#D9D5CB]">
              <button
                type="button"
                onClick={onSelectFree}
                className="w-full py-4 bg-[#171717] hover:bg-[#FF5A36] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.pricing.freeCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-3 text-center text-xs text-[#171717]/60 font-mono">
                {t.pricing.noCardNeeded}
              </p>
            </div>
          </div>

          {/* Plus Plan (Right - marked as Скоро) */}
          <div className="p-8 md:p-12 flex flex-col justify-between bg-[#F5F3EE]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider">
                  {currentLang === 'ru' ? 'ПОЛНАЯ ПРОГРАММА' : 'ТОЛЫҚ БАҒДАРЛАМА'}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#FF5A36] text-white uppercase">
                  {t.pricing.plusBadge}
                </span>
              </div>

              <h3 className="font-display font-extrabold text-3xl md:text-4xl text-[#171717] mb-2">
                {t.pricing.plusTitle}
              </h3>

              <div className="font-display font-bold text-3xl md:text-4xl text-[#171717]/70 tracking-tight my-6">
                {currentLang === 'ru' ? 'Анонс весной 2026' : '2026 көктемде шығады'}
              </div>

              <div className="space-y-4 my-8 pt-6 border-t border-[#D9D5CB]">
                {t.pricing.plusFeatures.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#171717]/85">
                    <Check className="w-4 h-4 text-[#FF5A36] shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-[#D9D5CB]">
              <button
                type="button"
                onClick={onNotifyPlus}
                className="w-full py-4 bg-white border border-[#171717] hover:bg-[#171717] hover:text-white text-[#171717] text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.pricing.plusCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-3 text-center text-xs text-[#171717]/60 font-mono">
                {currentLang === 'ru' ? 'Оповестим первыми в Telegram/WhatsApp' : 'Telegram/WhatsApp арқылы бірінші болып хабарлаймыз'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
