import React, { useState } from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { routeSteps } from '../content/questions';
import { Check, Clock, Target, ArrowRight } from 'lucide-react';

interface RouteSectionProps {
  currentLang: Language;
  onStartRoute: () => void;
}

export const RouteSection: React.FC<RouteSectionProps> = ({ currentLang, onStartRoute }) => {
  const t = locales[currentLang];
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1); // Step 02 active by default

  const currentStep = routeSteps[activeStepIndex];

  return (
    <section className="py-24 md:py-36 border-b border-[#D9D5CB] bg-[#EAE7DF]/30">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.route.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 md:mb-20">
          <div className="lg:col-span-8">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
              {t.route.headline}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-base md:text-lg text-[#171717]/80 leading-relaxed font-normal">
              {t.route.description}
            </p>
          </div>
        </div>

        {/* Structured Syllabus / Vertical Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 5 Structured Milestones (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {routeSteps.map((step, idx) => {
              const isSelected = idx === activeStepIndex;
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';

              return (
                <div
                  key={step.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-6 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#171717] shadow-[4px_4px_0px_#171717]'
                      : 'bg-[#F5F3EE] border-[#D9D5CB] hover:border-[#171717]/60 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Step Number Badge */}
                      <span
                        className={`font-mono text-sm font-bold px-2 py-1 border shrink-0 ${
                          isCompleted
                            ? 'bg-[#171717] text-white border-[#171717]'
                            : isCurrent
                            ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                            : 'bg-[#EAE7DF] text-[#171717] border-[#D9D5CB]'
                        }`}
                      >
                        {step.step}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl md:text-2xl font-bold text-[#171717]">
                            {currentLang === 'ru' ? step.titleRu : step.titleKz}
                          </h3>
                        </div>
                        <p className="text-xs md:text-sm text-[#171717]/70 font-medium mt-1">
                          {currentLang === 'ru' ? step.subtitleRu : step.subtitleKz}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill-Free Indicator */}
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-semibold text-[#171717]/60 block">
                        {isCompleted && (
                          <span className="text-[#171717] font-bold flex items-center gap-1 justify-end">
                            <Check className="w-3.5 h-3.5" /> {t.route.stepCompleted}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[#FF5A36] font-bold">
                            ● {t.route.stepCurrent}
                          </span>
                        )}
                        {!isCompleted && !isCurrent && (
                          <span>{t.route.stepUpcoming}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Inspection of Active Step (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="border border-[#171717] bg-white p-6 md:p-8 shadow-[6px_6px_0px_#171717]">
              <div className="flex items-center justify-between border-b border-[#D9D5CB] pb-4 mb-6">
                <div>
                  <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block">
                    {currentLang === 'ru' ? 'ЭТАП МАРШРУТА' : 'МАРШРУТ КЕЗЕҢІ'}
                  </span>
                  <div className="font-display text-2xl font-black text-[#171717] mt-1">
                    {currentStep.step}. {currentLang === 'ru' ? currentStep.titleRu : currentStep.titleKz}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full border border-[#171717] flex items-center justify-center font-display font-black text-sm">
                  {currentStep.step}
                </div>
              </div>

              {/* Step Description */}
              <p className="text-sm md:text-base text-[#171717]/85 leading-relaxed font-normal mb-8">
                {currentLang === 'ru' ? currentStep.descriptionRu : currentStep.descriptionKz}
              </p>

              {/* Metadata Indicators: Duration & Metric Outcome */}
              <div className="space-y-4 mb-8 pt-6 border-t border-[#D9D5CB]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#171717]/60 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF5A36]" />
                    {currentLang === 'ru' ? 'ДЛИТЕЛЬНОСТЬ' : 'ҰЗАҚТЫҒЫ'}
                  </span>
                  <span className="font-bold text-[#171717]">
                    {currentLang === 'ru' ? currentStep.durationRu : currentStep.durationKz}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#171717]/60 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#FF5A36]" />
                    {currentLang === 'ru' ? 'КЛЮЧЕВОЙ РЕЗУЛЬТАТ' : 'БАСТЫ НӘТИЖЕ'}
                  </span>
                  <span className="font-bold text-[#171717]">
                    {currentLang === 'ru' ? currentStep.kpiRu : currentStep.kpiKz}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onStartRoute}
                className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#E54825] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(255,90,54,0.2)]"
              >
                <span>{currentLang === 'ru' ? 'Начать с диагностики' : 'Диагностикадан бастау'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
