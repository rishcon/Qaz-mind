import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, BookOpen, Clock, Target, Calendar, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { OFFICIAL_PROFILE_PAIRS } from '../../types/auth';
import { ApiProfile, OnboardingPayload } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface OnboardingFlowProps {
  initialLang: Language;
  /** Saves the onboarding on the server. Throws when the server refuses; the error is shown here. */
  onSubmit: (payload: OnboardingPayload) => Promise<void>;
  onLogout: () => void;
}

type ExamPeriodCode = ApiProfile['exam_period'];

const EXAM_PERIOD_OPTIONS: { code: ExamPeriodCode; label: string }[] = [
  { code: 'june_main', label: 'Июнь (основной)' },
  { code: 'march_paid', label: 'Март (платный)' },
  { code: 'ent_2027', label: 'ЕНТ 2027' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ initialLang, onSubmit, onLogout }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<Language>(initialLang);
  const [selectedPairId, setSelectedPairId] = useState<string>('math_phys');
  const [targetScore, setTargetScore] = useState<number>(135);
  const [examPeriod, setExamPeriod] = useState<ExamPeriodCode>('june_main');
  const [dailyMinutes, setDailyMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedPair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === selectedPairId) || OFFICIAL_PROFILE_PAIRS[0];

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        interface_lang: selectedLang,
        exam_lang: selectedLang,
        profile_pair_id: selectedPair.id,
        target_score: targetScore,
        exam_year: examPeriod === 'ent_2027' ? 2027 : 2026,
        exam_period: examPeriod,
        daily_goal_minutes: dailyMinutes,
      });
    } catch (err) {
      setSubmitError(errorText(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Clean Minimal Header */}
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight font-mono">
            qazmind<span className="text-[#FF5A36]">.</span>
          </span>
          <span className="text-xs font-mono px-2 py-0.5 bg-[#FAF8F5] border border-[#E2DED5] rounded text-[#74736F]">
            Настройка профиля
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#74736F] mr-2">
            Шаг {step} из 4
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-6 bg-[#FF5A36]'
                    : s < step
                    ? 'w-3 bg-[#171717]'
                    : 'w-3 bg-[#E2DED5]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Step Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[620px] bg-white border border-[#E2DED5] p-6 md:p-10 shadow-sm rounded-sm">
          {/* STEP 1: LANGUAGE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Шаг 01 / Язык
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  На каком языке будешь учиться?
                </h1>
                <p className="text-sm text-[#74736F] mt-1.5">
                  Язык интерфейса и материалов можно изменить в любой момент в настройках.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLang('kz')}
                  className={`p-5 text-left border rounded transition-all cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
                    selectedLang === 'kz'
                      ? 'border-[#FF5A36] bg-[#FAF8F5] ring-2 ring-[#FF5A36]/20'
                      : 'border-[#E2DED5] hover:border-[#171717] bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#74736F]">
                      Мемлекеттік тіл
                    </span>
                    {selectedLang === 'kz' && (
                      <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#171717]">Қазақша</div>
                    <div className="text-xs text-[#74736F] mt-0.5">Барлық сұрақтар мен материалдар</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLang('ru')}
                  className={`p-5 text-left border rounded transition-all cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
                    selectedLang === 'ru'
                      ? 'border-[#FF5A36] bg-[#FAF8F5] ring-2 ring-[#FF5A36]/20'
                      : 'border-[#E2DED5] hover:border-[#171717] bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#74736F]">
                      Официальный язык
                    </span>
                    {selectedLang === 'ru' && (
                      <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#171717]">Русский</div>
                    <div className="text-xs text-[#74736F] mt-0.5">Все материалы и тренировочные тесты</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE SUBJECTS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Шаг 02 / Предметы
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  Выбери профильные предметы
                </h1>
                <p className="text-sm text-[#74736F] mt-1.5">
                  Какие два профильных предмета ты сдаёшь на ЕНТ?
                </p>
              </div>

              {/* Mandatory subjects info pill */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] text-xs text-[#74736F] rounded flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span>
                  <strong>3 обязательных предмета</strong> (История Казахстана, Матграмотность, Грамотность чтения) уже включены в твой план автоматически.
                </span>
              </div>

              {/* Official Pairs List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {OFFICIAL_PROFILE_PAIRS.map((pair) => {
                  const isSelected = selectedPairId === pair.id;
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      onClick={() => setSelectedPairId(pair.id)}
                      className={`w-full p-3.5 text-left border rounded transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#FF5A36] bg-[#FAF8F5] ring-2 ring-[#FF5A36]/20'
                          : 'border-[#E2DED5] hover:border-[#171717] bg-white'
                      }`}
                    >
                      <div className="pr-4">
                        <div className="font-bold text-sm text-[#171717]">
                          {pair.titleRu}
                        </div>
                        <div className="text-xs text-[#74736F] mt-0.5">
                          {pair.clusterRu}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-[#E2DED5]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-mono text-[#74736F] bg-gray-50 p-2.5 rounded border border-[#E2DED5]">
                Выбрано: <strong className="text-[#171717]">{selectedPair.titleRu}</strong>
              </div>
            </div>
          )}

          {/* STEP 3: TARGET SCORE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Шаг 03 / Цель
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  Сколько баллов хочешь набрать?
                </h1>
                <p className="text-sm text-[#74736F] mt-1.5">
                  Укажи желаемый балл на ЕНТ (максимум — 140 баллов).
                </p>
              </div>

              <div className="py-6 text-center bg-[#FAF8F5] border border-[#E2DED5] rounded p-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-extrabold font-mono text-[#171717]">
                    {targetScore}
                  </span>
                  <span className="text-2xl font-mono text-[#74736F]">/ 140</span>
                </div>

                <p className="text-xs text-[#74736F] mt-3 max-w-sm mx-auto">
                  {targetScore >= 130
                    ? 'Цель: грант в топовые национальные университеты (НУ, КБТУ, МУИТ, СДУ).'
                    : targetScore >= 110
                    ? 'Цель: уверенный государственный грант по большинству специальностей.'
                    : 'Цель: преодоление порогового балла с запасом.'}
                </p>

                {/* Score Slider */}
                <div className="mt-6 max-w-md mx-auto">
                  <input
                    type="range"
                    min="60"
                    max="140"
                    step="1"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full h-2 bg-[#E2DED5] rounded-lg appearance-none cursor-pointer accent-[#FF5A36]"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-[#74736F] mt-1.5">
                    <span>60 (Порог)</span>
                    <span>100</span>
                    <span>120</span>
                    <span>140 (Максимум)</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#74736F] text-center">
                К этой цели будем двигаться вместе шаг за шагом.
              </div>
            </div>
          )}

          {/* STEP 4: STUDY PREFERENCES */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Шаг 04 / Расписание
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  Настроим твой план
                </h1>
                <p className="text-sm text-[#74736F] mt-1.5">
                  Параметры помогут рассчитать ежедневную нагрузку.
                </p>
              </div>

              {/* Exam Year & Period */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
                  Когда планируешь сдавать ЕНТ?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {EXAM_PERIOD_OPTIONS.map((opt) => {
                    const isSelected = examPeriod === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setExamPeriod(opt.code)}
                        className={`p-3 text-center border rounded text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#FF5A36] bg-[#FAF8F5] font-bold text-[#171717] ring-1 ring-[#FF5A36]'
                            : 'border-[#E2DED5] text-[#74736F] hover:text-[#171717]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily study time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
                  Сколько времени готов уделять в день?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDailyMinutes(min)}
                      className={`p-3 text-center border rounded transition-colors cursor-pointer ${
                        dailyMinutes === min
                          ? 'border-[#FF5A36] bg-[#FAF8F5] font-bold text-[#171717] ring-1 ring-[#FF5A36]'
                          : 'border-[#E2DED5] text-[#74736F] hover:text-[#171717]'
                      }`}
                    >
                      <div className="text-base font-bold font-mono">{min}</div>
                      <div className="text-[10px] text-[#74736F]">минут</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5A36] shrink-0 mt-0.5" />
                <span>
                  Твой профиль будет инициализирован с нуля. Никаких чужих результатов — только твои реальные достижения.
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{submitError}</div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-[#E2DED5] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-mono text-[#74736F] hover:text-[#171717] underline cursor-pointer"
              >
                Выйти
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors flex items-center gap-2 cursor-pointer rounded-sm disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Сохраняем...' : step === 4 ? 'Начать обучение' : 'Продолжить'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
