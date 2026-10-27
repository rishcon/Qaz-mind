import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { SUBJECT_PRACTICE_QUESTIONS, PracticeQuestion } from '../../content/subjectQuestions';
import { ALL_SUBJECT_CURRICULA } from '../../content/curriculumData';

interface FocusPracticeSessionProps {
  subjectId: string;
  topicId?: string;
  count?: number;
  currentLang: Language;
  onFinishSession: (result: {
    subjectId: string;
    score: number;
    total: number;
    mistakes: { questionId: string; questionText: string; explanation: string }[];
  }) => void;
  onExit: () => void;
}

export const FocusPracticeSession: React.FC<FocusPracticeSessionProps> = ({
  subjectId,
  topicId,
  count = 5,
  currentLang,
  onFinishSession,
  onExit,
}) => {
  // Filter questions for the selected subject
  const subjectQuestions = SUBJECT_PRACTICE_QUESTIONS.filter((q) => q.subjectId === subjectId);
  const questionsList = subjectQuestions.length > 0 ? subjectQuestions.slice(0, count) : SUBJECT_PRACTICE_QUESTIONS.slice(0, count);

  const subjectMeta = ALL_SUBJECT_CURRICULA[subjectId] || ALL_SUBJECT_CURRICULA['history_kz'];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentQ: PracticeQuestion = questionsList[currentIdx] || questionsList[0];

  const handleSelectOption = (optId: string) => {
    if (isChecked) return;
    setSelectedOption(optId);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsChecked(true);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: selectedOption,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questionsList.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      setIsCompleted(true);
    }
  };

  // Calculate results
  let correctCount = 0;
  const mistakes: { questionId: string; questionText: string; explanation: string }[] = [];

  questionsList.forEach((q) => {
    const ans = answers[q.id];
    if (ans === q.correctId) {
      correctCount++;
    } else if (ans) {
      mistakes.push({
        questionId: q.id,
        questionText: currentLang === 'kz' ? q.questionKz : q.questionRu,
        explanation: currentLang === 'kz' ? q.explanationKz : q.explanationRu,
      });
    }
  });

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsChecked(false);
    setAnswers({});
    setIsCompleted(false);
  };

  const handleFinishAndReturn = () => {
    onFinishSession({
      subjectId,
      score: correctCount,
      total: questionsList.length,
      mistakes,
    });
  };

  // If Completed, render Results in Focus Mode
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
        <header className="border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
          <span className="text-xl font-extrabold tracking-tight font-mono">
            qazmind<span className="text-[#FF5A36]">.</span>
          </span>
          <span className="text-xs font-mono text-[#74736F]">Результаты практики</span>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[520px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm text-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
              {currentLang === 'kz' ? subjectMeta.nameKz : subjectMeta.nameRu}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
              {currentLang === 'kz' ? 'Практика аяқталды' : 'Практика завершена'}
            </h1>

            {/* Score block: honest raw score e.g. 4 из 5 */}
            <div className="my-6 p-6 bg-[#FAF8F5] border border-[#E2DED5] rounded text-center">
              <div className="text-4xl md:text-5xl font-black font-mono text-[#171717]">
                {correctCount} <span className="text-xl text-[#74736F]">/ {questionsList.length}</span>
              </div>
              <p className="text-xs text-[#74736F] mt-2">
                Верных ответов: {correctCount} из {questionsList.length} (
                {Math.round((correctCount / questionsList.length) * 100)}%)
              </p>
            </div>

            {mistakes.length > 0 && (
              <div className="text-left mb-6 p-4 bg-amber-50/70 border border-amber-200/80 rounded text-xs text-amber-900">
                <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Ошибки зафиксированы ({mistakes.length}):</span>
                </div>
                <p>
                  Вопросы с ошибками автоматически добавлены в раздел «Мои ошибки» для повторения.
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleFinishAndReturn}
                className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Вернуться в кабинет
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-3 bg-white border border-[#E2DED5] hover:border-[#171717] text-[#171717] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Пройти заново</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
          © 2026 QAZMIND
        </footer>
      </div>
    );
  }

  // Active Practice View in Focus Mode
  const isCorrect = selectedOption === currentQ.correctId;

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Top Bar Focus Layout C */}
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            aria-label="Выйти из практики"
            className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
          <div className="h-4 w-px bg-[#E2DED5] hidden sm:block" />
          <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">
            {currentLang === 'kz' ? subjectMeta.nameKz : subjectMeta.nameRu}
          </span>
        </div>

        {/* Question Counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#74736F]">
            Вопрос {currentIdx + 1} из {questionsList.length}
          </span>
          <div className="flex gap-1">
            {questionsList.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIdx
                    ? 'w-5 bg-[#FF5A36]'
                    : i < currentIdx
                    ? 'w-2 bg-[#171717]'
                    : 'w-2 bg-[#E2DED5]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[720px] space-y-6">
          <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-sm space-y-6">
            <div>
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                {currentLang === 'kz' ? currentQ.topicKz : currentQ.topicRu}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#171717] mt-1 leading-snug">
                {currentLang === 'kz' ? currentQ.questionKz : currentQ.questionRu}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isThisCorrect = opt.id === currentQ.correctId;

                let optClass = 'border-[#E2DED5] bg-[#FAF8F5] hover:border-[#171717]';
                if (isSelected && !isChecked) {
                  optClass = 'border-[#FF5A36] bg-orange-50/50 ring-1 ring-[#FF5A36]';
                } else if (isChecked) {
                  if (isThisCorrect) {
                    optClass = 'border-green-600 bg-green-50 text-green-950 font-medium';
                  } else if (isSelected) {
                    optClass = 'border-red-500 bg-red-50 text-red-950';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isChecked}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-4 text-left border rounded transition-all cursor-pointer flex items-center justify-between text-sm ${optClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-[#D9D5CB] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {opt.id}
                      </span>
                      <span>{currentLang === 'kz' ? opt.textKz : opt.textRu}</span>
                    </div>
                    {isChecked && isThisCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                    {isChecked && isSelected && !isThisCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pedagogical Explanation feedback */}
            {isChecked && (
              <div
                className={`p-4 rounded text-xs leading-relaxed animate-in fade-in ${
                  isCorrect
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                <div className="font-bold uppercase tracking-wider mb-1 font-mono">
                  {isCorrect ? 'Верно!' : 'Ошибка'} — Разбор задания:
                </div>
                <p>{currentLang === 'kz' ? currentQ.explanationKz : currentQ.explanationRu}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="sticky bottom-0 bg-[#F5F3EE]/95 backdrop-blur-md border-t border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <span className="text-xs font-mono text-[#74736F]">
          Вопрос {currentIdx + 1} из {questionsList.length}
        </span>

        {!isChecked ? (
          <button
            type="button"
            disabled={!selectedOption}
            onClick={handleCheckAnswer}
            className="px-6 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer rounded-sm"
          >
            Проверить
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer rounded-sm"
          >
            <span>{currentIdx < questionsList.length - 1 ? 'Следующий вопрос' : 'Завершить практику'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>

      {/* Exit dialog */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DED5] max-w-sm w-full p-6 shadow-xl rounded-sm">
            <h3 className="text-lg font-bold text-[#171717]">Прервать практику?</h3>
            <p className="text-xs text-[#74736F] mt-1.5 leading-relaxed">
              Текущий прогресс сессии не будет сохранен в статистику.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer"
              >
                Продолжить
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
