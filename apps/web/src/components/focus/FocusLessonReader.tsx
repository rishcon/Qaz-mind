import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, X } from 'lucide-react';
import { Language } from '../../types';
import { ApiLesson, learningApi } from '../../api/endpoints';
import { ApiError, errorText } from '../../api/client';

interface FocusLessonReaderProps {
  lessonSlug: string;
  currentLang: Language;
  /** Called after the server has stored the completion. */
  onComplete: (lessonSlug: string) => void;
  onExit: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; lesson: ApiLesson }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

export const FocusLessonReader: React.FC<FocusLessonReaderProps> = ({ lessonSlug, currentLang, onComplete, onExit }) => {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [stepIdx, setStepIdx] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Load the published lesson and resume from the saved step (a completed lesson starts from the beginning).
  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    learningApi
      .lesson(lessonSlug)
      .then((lesson) => {
        if (cancelled) return;
        const resume = lesson.progress.state === 'completed' ? 0 : lesson.progress.last_step;
        setStepIdx(Math.min(Math.max(resume, 0), lesson.steps.length - 1));
        setLoad({ status: 'ready', lesson });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'LESSON_NOT_FOUND') {
          setLoad({ status: 'unavailable' });
        } else {
          setLoad({ status: 'error', message: errorText(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lessonSlug]);

  if (load.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center font-mono text-xs text-[#74736F]">
        Загрузка урока…
      </div>
    );
  }

  if (load.status === 'unavailable' || load.status === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-[460px] bg-white border border-[#E2DED5] p-8 rounded-sm">
          <h1 className="text-xl font-extrabold">
            {load.status === 'unavailable' ? 'Урок пока недоступен' : 'Не удалось открыть урок'}
          </h1>
          <p className="text-sm text-[#74736F] mt-2 leading-relaxed">
            {load.status === 'unavailable'
              ? 'Материал ещё не опубликован или не найден. Ничего не показываем вместо него.'
              : load.message}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-6 w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold cursor-pointer"
          >
            Вернуться к предметам
          </button>
        </div>
      </div>
    );
  }

  const { lesson } = load;
  const totalSteps = lesson.steps.length;
  const currentStep = lesson.steps[stepIdx];
  const isLastStep = stepIdx === totalSteps - 1;

  // Saves the reading position. A failure is shown but does not block reading.
  const savePosition = (index: number) => {
    learningApi
      .saveProgress(lesson.slug, index, false)
      .then(() => setSaveError(''))
      .catch((err) => setSaveError(errorText(err)));
  };

  const goTo = (index: number) => {
    setStepIdx(index);
    savePosition(index);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setSaveError('');
    try {
      await learningApi.saveProgress(lesson.slug, totalSteps - 1, true);
      onComplete(lesson.slug);
    } catch (err) {
      setSaveError(errorText(err));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Layout C Minimal Top Bar: Zero sidebar, zero marketing */}
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            aria-label="Выйти из урока"
            className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
          <div className="h-4 w-px bg-[#E2DED5] hidden sm:block" />
          <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">
            {lesson.estimated_minutes} мин
          </span>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#74736F]">
            Шаг {stepIdx + 1} из {totalSteps}
          </span>
          <div className="flex gap-1">
            {lesson.steps.map((step, i) => (
              <div
                key={step.index}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx ? 'w-5 bg-[#FF5A36]' : i < stepIdx ? 'w-2 bg-[#171717]' : 'w-2 bg-[#E2DED5]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Centered Reading Container (680–760px) */}
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[740px] space-y-6">
          <div className="border-b border-[#E2DED5] pb-4">
            <span className="text-xs font-mono text-[#74736F] uppercase tracking-wider block">Учебный модуль</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
              {currentLang === 'kz' ? lesson.title_kz : lesson.title_ru}
            </h1>
          </div>

          <div className="space-y-6 animate-in fade-in duration-150">
            <h2 className="text-lg md:text-xl font-bold text-[#171717] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#171717] text-white text-xs font-mono flex items-center justify-center shrink-0">
                {stepIdx + 1}
              </span>
              <span>{currentLang === 'kz' ? currentStep.heading_kz : currentStep.heading_ru}</span>
            </h2>

            <p className="text-base md:text-lg text-[#262626] leading-relaxed font-normal">
              {currentLang === 'kz' ? currentStep.body_kz : currentStep.body_ru}
            </p>

            {/* Key Fact Highlight */}
            {(currentLang === 'kz' ? currentStep.key_fact_kz : currentStep.key_fact_ru) && (
              <div className="p-4 bg-white border-l-4 border-[#FF5A36] border-y border-r border-[#E2DED5] rounded-r text-sm">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5A36] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ключевой факт для ЕНТ</span>
                </div>
                <p className="text-[#171717] font-medium">
                  {currentLang === 'kz' ? currentStep.key_fact_kz : currentStep.key_fact_ru}
                </p>
              </div>
            )}

            {(currentLang === 'kz' ? currentStep.example_kz : currentStep.example_ru) && (
              <div className="p-4 bg-[#FAF8F5] border border-[#E2DED5] rounded text-sm text-[#262626]">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] mb-1">Пример</div>
                <p>{currentLang === 'kz' ? currentStep.example_kz : currentStep.example_ru}</p>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>Прогресс не сохранён: {saveError}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="sticky bottom-0 bg-[#F5F3EE]/95 backdrop-blur-md border-t border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, stepIdx - 1))}
          disabled={stepIdx === 0}
          className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад</span>
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => goTo(stepIdx + 1)}
            className="px-6 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span>Далее</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting}
            className="px-6 py-2.5 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm shadow-sm disabled:opacity-60"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleting ? 'Сохраняем…' : 'Завершить урок'}</span>
          </button>
        )}
      </footer>

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DED5] max-w-sm w-full p-6 shadow-xl rounded-sm">
            <h3 className="text-lg font-bold text-[#171717]">Выйти из урока?</h3>
            <p className="text-xs text-[#74736F] mt-1.5 leading-relaxed">
              Место, на котором вы остановились, сохранено. Продолжить можно из списка уроков.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer"
              >
                Продолжить чтение
              </button>
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-2 bg-[#171717] hover:bg-red-600 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
