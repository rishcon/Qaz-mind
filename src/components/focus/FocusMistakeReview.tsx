import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { Language } from '../../types';
import { MistakeItem } from '../../types/dashboard';

interface FocusMistakeReviewProps {
  mistake: MistakeItem;
  currentLang: Language;
  onResolved: (mistakeId: string) => void;
  onExit: () => void;
}

export const FocusMistakeReview: React.FC<FocusMistakeReviewProps> = ({
  mistake,
  currentLang,
  onResolved,
  onExit,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Generate plausible options for the review retry
  const options = [
    { id: 'wrong', text: currentLang === 'kz' ? mistake.studentAnswerKz : mistake.studentAnswerRu, isCorrect: false },
    { id: 'correct', text: currentLang === 'kz' ? mistake.correctAnswerKz : mistake.correctAnswerRu, isCorrect: true },
  ];

  const handleRetrySubmit = () => {
    if (!selectedAnswer) return;
    setIsSubmitted(true);
    if (selectedAnswer === 'correct') {
      onResolved(mistake.id);
    }
  };

  const isSuccess = selectedAnswer === 'correct';

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Layout C Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>К списку ошибок</span>
        </button>
        <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">
          {currentLang === 'kz' ? mistake.subjectKz : mistake.subjectRu} · {currentLang === 'kz' ? mistake.topicKz : mistake.topicRu}
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[720px] space-y-6">
          <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-sm space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Работа над ошибкой</span>
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#171717] mt-1.5 leading-snug">
                {currentLang === 'kz' ? mistake.questionTextKz : mistake.questionTextRu}
              </h2>
            </div>

            {/* Previous mistake context */}
            <div className="p-4 bg-red-50/70 border border-red-200 rounded text-xs space-y-1">
              <div className="text-red-700 font-mono font-bold">Твой прошлый ошибочный ответ:</div>
              <div className="text-red-950 font-medium">
                {currentLang === 'kz' ? mistake.studentAnswerKz : mistake.studentAnswerRu}
              </div>
            </div>

            {/* Retry options */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono font-bold text-[#74736F] uppercase tracking-wider">
                Повторная попытка:
              </div>
              {options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                let optClass = 'border-[#E2DED5] bg-[#FAF8F5] hover:border-[#171717]';
                if (isSelected && !isSubmitted) {
                  optClass = 'border-[#FF5A36] bg-orange-50/50 ring-1 ring-[#FF5A36]';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    optClass = 'border-green-600 bg-green-50 text-green-950 font-medium';
                  } else if (isSelected) {
                    optClass = 'border-red-500 bg-red-50 text-red-950';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setSelectedAnswer(opt.id)}
                    className={`w-full p-4 text-left border rounded transition-all cursor-pointer flex items-center justify-between text-sm ${optClass}`}
                  >
                    <span>{opt.text}</span>
                    {isSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {!isSubmitted ? (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!selectedAnswer}
                  onClick={handleRetrySubmit}
                  className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Проверить исправление
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 animate-in fade-in">
                <div
                  className={`p-4 rounded text-xs leading-relaxed ${
                    isSuccess
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border border-red-200 text-red-900'
                  }`}
                >
                  <div className="font-bold font-mono uppercase tracking-wider mb-1">
                    {isSuccess ? 'Отлично! Ошибка усвоена' : 'Пока неверно'}
                  </div>
                  <p>{currentLang === 'kz' ? mistake.explanationKz : mistake.explanationRu}</p>
                </div>

                <button
                  type="button"
                  onClick={onExit}
                  className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Вернуться в список ошибок
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND
      </footer>
    </div>
  );
};
