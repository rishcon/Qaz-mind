import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';

interface ApproachSectionProps {
  currentLang: Language;
}

export const ApproachSection: React.FC<ApproachSectionProps> = ({ currentLang }) => {
  const t = locales[currentLang];

  const steps = [
    {
      num: t.approach.step1Num,
      title: t.approach.step1Title,
      desc: t.approach.step1Desc,
      tagRu: 'ФОКУС: ТЕОРИЯ И КОНТЕКСТ',
      tagKz: 'ФОКУС: ТЕОРИЯ ЖӘНЕ КОНТЕКСТ',
      deliverableRu: 'Тезисы, хронологии, опорные конспекты',
      deliverableKz: 'Конспектілер, хронология, тірек сызбалар',
    },
    {
      num: t.approach.step2Num,
      title: t.approach.step2Title,
      desc: t.approach.step2Desc,
      tagRu: 'ФОКУС: ТЕМАТИЧЕСКИЙ ТРЕНИНГ',
      tagKz: 'ФОКУС: ТАҚЫРЫПТЫҚ ЖАТТЫҒУ',
      deliverableRu: 'Ловушки составителей и контекстные вопросы',
      deliverableKz: 'Құрастырушылар қақпандары мен мәнмәтіндік сұрақтар',
    },
    {
      num: t.approach.step3Num,
      title: t.approach.step3Title,
      desc: t.approach.step3Desc,
      tagRu: 'ФОКУС: ИНТЕРВАЛЬНЫЙ АНАЛИЗ',
      tagKz: 'ФОКУС: ИНТЕРВАЛДЫ ТАЛДАУ',
      deliverableRu: 'Персональный разбор неверных вариантов',
      deliverableKz: 'Қате нұсқаларды жеке талдау жүйесі',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-36 border-b border-[#D9D5CB] bg-[#EAE7DF]/40">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.approach.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        {/* Section Headline */}
        <div className="max-w-3xl mb-16 md:mb-24">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
            {t.approach.headline}
          </h2>
        </div>

        {/* Staggered Editorial Layout (3 steps with generous whitespace and bold numbers) */}
        <div className="space-y-0 divide-y divide-[#D9D5CB] border-y border-[#D9D5CB]">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className={`py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-baseline transition-colors hover:bg-white/50 ${
                idx % 2 === 1 ? 'lg:pl-8' : ''
              }`}
            >
              {/* Big Editorial Number */}
              <div className="lg:col-span-2">
                <span className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-[#171717] tracking-tighter block">
                  {step.num}
                </span>
                <span className="font-mono text-[11px] text-[#FF5A36] font-semibold tracking-wider uppercase mt-1 block">
                  {currentLang === 'ru' ? step.tagRu : step.tagKz}
                </span>
              </div>

              {/* Title */}
              <div className="lg:col-span-4">
                <h3 className="text-2xl md:text-3xl font-bold font-display text-[#171717] tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs font-mono text-[#171717]/60 uppercase tracking-wide">
                  {currentLang === 'ru' ? step.deliverableRu : step.deliverableKz}
                </p>
              </div>

              {/* Editorial Description */}
              <div className="lg:col-span-6">
                <p className="text-base md:text-lg text-[#171717]/85 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
