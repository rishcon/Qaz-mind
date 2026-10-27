import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, BookOpen, X } from 'lucide-react';
import { Language } from '../../types';
import { LESSON_MODULES, LessonModule } from '../../content/curriculumData';

interface FocusLessonReaderProps {
  lessonId: string;
  subjectId: string;
  currentLang: Language;
  onComplete: (lessonId: string) => void;
  onExit: () => void;
}

export const FocusLessonReader: React.FC<FocusLessonReaderProps> = ({
  lessonId,
  subjectId,
  currentLang,
  onComplete,
  onExit,
}) => {
  const lesson: LessonModule = LESSON_MODULES[lessonId] || LESSON_MODULES['lesson-khanate-foundation'];
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const totalSteps = lesson.steps.length + 1; // Content steps + 1 checkpoint question step
  const isQuestionStep = currentStepIdx === lesson.steps.length;
  const currentStep = lesson.steps[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleCompleteLesson = () => {
    onComplete(lesson.id);
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
            {currentLang === 'kz' ? lesson.subjectNameKz : lesson.subjectNameRu}
          </span>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#74736F]">
            Шаг {currentStepIdx + 1} из {totalSteps}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIdx
                    ? 'w-5 bg-[#FF5A36]'
                    : i < currentStepIdx
                    ? 'w-2 bg-[#171717]'
                    : 'w-2 bg-[#E2DED5]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Centered Reading Container (680–760px) */}
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[740px] space-y-6">
          {/* Lesson Title Badge */}
          <div className="border-b border-[#E2DED5] pb-4">
            <span className="text-xs font-mono text-[#74736F] uppercase tracking-wider block">
              Учебный модуль
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
              {currentLang === 'kz' ? lesson.titleKz : lesson.titleRu}
            </h1>
          </div>

          {!isQuestionStep ? (
            /* Educational Reading Step */
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg md:text-xl font-bold text-[#171717] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#171717] text-white text-xs font-mono flex items-center justify-center shrink-0">
                  {currentStep.stepNumber}
                </span>
                <span>{currentLang === 'kz' ? currentStep.headingKz : currentStep.headingRu}</span>
              </h2>

              <p className="text-base md:text-lg text-[#262626] leading-relaxed font-normal">
                {currentLang === 'kz' ? currentStep.bodyKz : currentStep.bodyRu}
              </p>

              {/* Key Fact Highlight */}
              {currentStep.keyFactRu && (
                <div className="p-4 bg-white border-l-4 border-[#FF5A36] border-y border-r border-[#E2DED5] rounded-r text-sm">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5A36] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ключевой факт для ЕНТ</span>
                  </div>
                  <p className="text-[#171717] font-medium">
                    {currentLang === 'kz' ? currentStep.keyFactKz : currentStep.keyFactRu}
                  </p>
                </div>
              )}

              {/* Example box if present */}
              {currentStep.exampleRu && (
                <div className="p-4 bg-[#FAF8F5] border border-[#E2DED5] rounded text-sm text-[#262626]">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] mb-1">
                    Пример
                  </div>
                  <p>{currentLang === 'kz' ? currentStep.exampleKz : currentStep.exampleRu}</p>
                </div>
              )}
            </div>
          ) : (
            /* Checkpoint Question Step */
            <div className="space-y-6 animate-in fade-in duration-150 bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
                  Контрольный вопрос к уроку
                </span>
                <h2 className="text-lg md:text-xl font-bold text-[#171717] mt-1">
                  {currentLang === 'kz'
                    ? lesson.checkpointQuestion.questionKz
                    : lesson.checkpointQuestion.questionRu}
                </h2>
              </div>

              <div className="space-y-3 pt-2">
                {lesson.checkpointQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = opt.id === lesson.checkpointQuestion.correctId;

                  let optClass = 'border-[#E2DED5] bg-[#FAF8F5] hover:border-[#171717]';
                  if (isSelected && !isAnswerChecked) {
                    optClass = 'border-[#FF5A36] bg-orange-50/50 ring-1 ring-[#FF5A36]';
                  } else if (isAnswerChecked) {
                    if (isCorrect) {
                      optClass = 'border-green-600 bg-green-50 text-green-950 font-medium';
                    } else if (isSelected) {
                      optClass = 'border-red-500 bg-red-50 text-red-950';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`w-full p-4 text-left border rounded transition-all cursor-pointer flex items-center justify-between text-sm ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-[#D9D5CB] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {opt.id}
                        </span>
                        <span>{currentLang === 'kz' ? opt.textKz : opt.textRu}</span>
                      </div>
                      {isAnswerChecked && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {!isAnswerChecked ? (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!selectedOption}
                    onClick={() => setIsAnswerChecked(true)}
                    className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Проверить ответ
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-900 animate-in fade-in">
                  <div className="font-bold text-xs font-mono uppercase tracking-wider mb-1">
                    Разбор задания:
                  </div>
                  <p>
                    {currentLang === 'kz'
                      ? lesson.checkpointQuestion.explanationKz
                      : lesson.checkpointQuestion.explanationRu}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="sticky bottom-0 bg-[#F5F3EE]/95 backdrop-blur-md border-t border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStepIdx === 0}
          className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад</span>
        </button>

        {!isQuestionStep ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span>Далее</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompleteLesson}
            className="px-6 py-2.5 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Завершить урок</span>
          </button>
        )}
      </footer>

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DED5] max-w-sm w-full p-6 shadow-xl rounded-sm">
            <h3 className="text-lg font-bold text-[#171717]">Выйти из урока?</h3>
            <p className="text-xs text-[#74736F] mt-1.5 leading-relaxed">
              Вы всегда сможете продолжить изучение темы с этого места в личном кабинете.
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
