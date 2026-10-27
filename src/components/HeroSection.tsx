import React, { useState } from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { heroDemoQuestion } from '../content/questions';
import { ArrowRight, Check, AlertCircle, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  currentLang: Language;
  onStart: () => void;
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentLang,
  onStart,
  onExplore,
}) => {
  const t = locales[currentLang];
  const q = heroDemoQuestion;

  // Selected answer in the interactive hero fragment
  const [selectedOption, setSelectedOption] = useState<string>('B');
  const isCorrect = selectedOption === q.correctOptionId;

  return (
    <section className="relative pt-28 md:pt-36 pb-20 md:pb-28 border-b border-[#D9D5CB] overflow-hidden">
      {/* Background architectural grid line */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="max-w-7xl mx-auto h-full border-x border-[#D9D5CB]/40 grid grid-cols-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Micro-label kicker */}
        <div className="mb-6 md:mb-8 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.hero.microLabel}
          </span>
          <span className="w-8 h-[1px] bg-[#D9D5CB]" />
          <span className="font-mono text-xs text-[#171717]/60">
            {currentLang === 'ru' ? 'ВЫПУСК 2026' : 'ТҮЛЕК 2026'}
          </span>
        </div>

        {/* Asymmetrical 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Dominant Editorial Typography (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] xl:text-[6.25rem] font-extrabold tracking-tighter leading-[0.92] text-[#171717] font-display">
                <span className="block text-balance">{t.hero.headlinePart1}</span>
                <span className="block text-[#FF5A36] mt-2 text-balance">
                  {t.hero.headlinePart2}
                </span>
              </h1>

              <p className="mt-8 md:mt-10 text-lg md:text-xl text-[#171717]/80 max-w-xl leading-relaxed font-normal">
                {t.hero.support}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <button
                type="button"
                onClick={onStart}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF5A36] hover:bg-[#E54825] active:translate-y-0.5 text-white font-display font-bold text-base tracking-wide uppercase transition-all duration-150 cursor-pointer shadow-[0_4px_14px_rgba(255,90,54,0.25)]"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExplore}
                className="group inline-flex items-center gap-2 text-base font-semibold text-[#171717] hover:text-[#FF5A36] transition-colors py-2 cursor-pointer border-b border-transparent hover:border-[#FF5A36]"
              >
                <span>{t.hero.secondaryLink}</span>
                <span className="transform group-hover:translate-x-1 transition-transform">↓</span>
              </button>
            </div>

            {/* 140 Motif / Maximum Score Note */}
            <div className="mt-14 pt-8 border-t border-[#D9D5CB] flex items-baseline gap-4">
              <div className="font-display font-black text-4xl md:text-5xl tracking-tighter text-[#171717]">
                140
              </div>
              <p className="text-xs md:text-sm text-[#171717]/70 max-w-md leading-snug">
                {t.hero.maxScoreNote}
              </p>
            </div>
          </div>

          {/* Right Column: Authentic Learning Experience Fragment (5 columns) */}
          <div className="lg:col-span-5 lg:pl-4">
            <div className="relative bg-[#EAE7DF] border border-[#D9D5CB] p-6 md:p-8 shadow-[6px_6px_0px_#D9D5CB]">
              {/* Card Header: Subject, Lesson Step & Topic */}
              <div className="flex items-center justify-between border-b border-[#D9D5CB] pb-4 mb-5">
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-[#171717]/60 font-semibold block">
                    {currentLang === 'ru' ? q.subjectRu : q.subjectKz}
                  </span>
                  <h3 className="font-display text-base font-bold text-[#171717] mt-0.5">
                    {currentLang === 'ru' ? q.topicRu : q.topicKz}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#FF5A36] bg-[#F5F3EE] px-2 py-1 border border-[#D9D5CB]">
                    {q.lessonStep}
                  </span>
                </div>
              </div>

              {/* Step indicator bar */}
              <div className="w-full bg-[#D9D5CB] h-1 mb-6 overflow-hidden">
                <div className="bg-[#FF5A36] h-full w-[37.5%]" />
              </div>

              {/* The Question Text */}
              <div className="mb-6">
                <span className="text-xs font-mono text-[#171717]/50 block mb-1">
                  {t.hero.interactiveHint}
                </span>
                <p className="text-base md:text-lg font-medium text-[#171717] leading-snug">
                  {currentLang === 'ru' ? q.questionRu : q.questionKz}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {q.options.map((opt) => {
                  const isOptSelected = selectedOption === opt.id;
                  const isThisCorrect = opt.id === q.correctOptionId;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt.id)}
                      className={`w-full text-left p-3.5 border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                        isOptSelected
                          ? isThisCorrect
                            ? 'bg-white border-[#171717] shadow-[2px_2px_0px_#171717]'
                            : 'bg-white border-[#FF5A36] shadow-[2px_2px_0px_#FF5A36]'
                          : 'bg-[#F5F3EE]/60 border-[#D9D5CB] hover:bg-white hover:border-[#171717]/50'
                      }`}
                    >
                      <span
                        className={`font-mono text-xs font-bold px-2 py-1 shrink-0 border ${
                          isOptSelected
                            ? isThisCorrect
                              ? 'bg-[#171717] text-white border-[#171717]'
                              : 'bg-[#FF5A36] text-white border-[#FF5A36]'
                            : 'bg-[#EAE7DF] text-[#171717] border-[#D9D5CB]'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="text-sm font-medium text-[#171717] leading-snug pt-0.5">
                        {currentLang === 'ru' ? opt.textRu : opt.textKz}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Answer Feedback & Context Explanation */}
              <div
                className={`p-4 border transition-colors ${
                  isCorrect
                    ? 'bg-[#F5F3EE] border-[#171717]/20 text-[#171717]'
                    : 'bg-[#FFF5F2] border-[#FF5A36]/40 text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-display text-xs font-bold uppercase tracking-wider">
                  {isCorrect ? (
                    <>
                      <Check className="w-4 h-4 text-[#171717]" />
                      <span className="text-[#171717]">
                        {currentLang === 'ru' ? 'Верно — разобранный факт' : 'Дұрыс — талданған дерек'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-[#FF5A36]" />
                      <span className="text-[#FF5A36]">
                        {currentLang === 'ru' ? 'Не совсем точно' : 'Толық дұрыс емес'}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-[#171717]/80 leading-relaxed font-normal">
                  {currentLang === 'ru' ? q.explanationRu : q.explanationKz}
                </p>
              </div>

              {/* Bottom Micro-Bar */}
              <div className="mt-4 pt-3 border-t border-[#D9D5CB] flex items-center justify-between text-[11px] font-mono text-[#171717]/60">
                <span>МОДУЛЬ: ИСТОРИЯ КАЗАХСТАНА</span>
                <span className="text-[#FF5A36] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> QAZMIND ENGINE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
