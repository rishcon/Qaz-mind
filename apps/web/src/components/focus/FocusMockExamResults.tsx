import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, AlertCircle, BookOpen, Layers } from 'lucide-react';
import { Language } from '../../types';
import { examSimulatorQuestions } from '../../content/questions';

interface FocusMockExamResultsProps {
  score: number;
  total: number;
  answers: Record<number, string>;
  durationTakenSeconds: number;
  currentLang: Language;
  onNavigateMistakes: () => void;
  onReturnToDashboard: () => void;
  onRetryExam: () => void;
}

export const FocusMockExamResults: React.FC<FocusMockExamResultsProps> = ({
  score,
  total,
  answers,
  durationTakenSeconds,
  currentLang,
  onNavigateMistakes,
  onReturnToDashboard,
  onRetryExam,
}) => {
  const questions = examSimulatorQuestions;
  const percentage = Math.round((score / total) * 100);

  // Group performance by subject
  const subjectScores: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q) => {
    const sub = currentLang === 'kz' ? q.subjectKz : q.subjectRu;
    if (!subjectScores[sub]) {
      subjectScores[sub] = { correct: 0, total: 0 };
    }
    subjectScores[sub].total += 1;
    if (answers[q.id] === q.correctId) {
      subjectScores[sub].correct += 1;
    }
  });

  const minutes = Math.floor(durationTakenSeconds / 60);
  const seconds = durationTakenSeconds % 60;

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Top Bar Layout C */}
      <header className="border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <button
          type="button"
          onClick={onReturnToDashboard}
          className="text-xl font-extrabold tracking-tight font-mono hover:text-[#FF5A36] transition-colors cursor-pointer"
        >
          qazmind<span className="text-[#FF5A36]">.</span>
        </button>
        <span className="text-xs font-mono text-[#74736F]">Результаты тестирования</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[760px] space-y-6">
          {/* Main Results Card */}
          <div className="bg-white border border-[#E2DED5] p-6 md:p-10 shadow-sm rounded-sm text-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
              Демонстрационный тест ЕНТ
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
              {currentLang === 'kz' ? 'Тест аяқталды' : 'Тест завершен'}
            </h1>

            {/* Honest raw score representation */}
            <div className="my-6 p-6 bg-[#FAF8F5] border border-[#E2DED5] rounded max-w-md mx-auto">
              <div className="text-5xl md:text-6xl font-black font-mono text-[#171717]">
                {score} <span className="text-2xl text-[#74736F]">/ {total}</span>
              </div>
              <div className="text-sm font-bold text-[#171717] mt-2">
                Точность: {percentage}%
              </div>
              <p className="text-xs text-[#74736F] mt-1">
                Время прохождения: {minutes} мин {seconds} сек
              </p>
              <div className="mt-3 text-[11px] font-mono text-[#74736F] bg-gray-100 p-2 rounded">
                Честный результат без искусственного масштабирования до 140 баллов.
              </div>
            </div>

            {/* Breakdown by subject */}
            <div className="text-left mt-8 pt-6 border-t border-[#E2DED5]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717] block mb-3">
                Результаты по дисциплинам
              </span>
              <div className="space-y-2">
                {Object.entries(subjectScores).map(([subjectName, stat]) => (
                  <div
                    key={subjectName}
                    className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#171717]">{subjectName}</span>
                    <span className="font-mono font-bold text-[#171717]">
                      {stat.correct} / {stat.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Question by question review */}
            <div className="text-left mt-8 pt-6 border-t border-[#E2DED5] space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717] block">
                Подробный разбор заданий
              </span>

              {questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctId;
                const userOpt = q.options.find((o) => o.id === userAns);
                const correctOpt = q.options.find((o) => o.id === q.correctId);

                return (
                  <div
                    key={q.id}
                    className={`p-4 border rounded text-xs space-y-2 ${
                      isCorrect
                        ? 'border-green-200 bg-green-50/40'
                        : 'border-red-200 bg-red-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#74736F]">
                        Вопрос {idx + 1} · {currentLang === 'kz' ? q.subjectKz : q.subjectRu}
                      </span>
                      {isCorrect ? (
                        <span className="text-green-700 font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Верно
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center gap-1 font-mono">
                          <XCircle className="w-3.5 h-3.5" /> Ошибка
                        </span>
                      )}
                    </div>

                    <div className="font-medium text-[#171717] text-sm">
                      {currentLang === 'kz' ? q.questionKz : q.questionRu}
                    </div>

                    <div className="text-[#74736F] pt-1">
                      <div>
                        Твой ответ:{' '}
                        <strong className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                          {userOpt ? (currentLang === 'kz' ? userOpt.textKz : userOpt.textRu) : 'Не отвечено'}
                        </strong>
                      </div>
                      {!isCorrect && (
                        <div>
                          Правильный ответ:{' '}
                          <strong className="text-green-800">
                            {correctOpt ? (currentLang === 'kz' ? correctOpt.textKz : correctOpt.textRu) : ''}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="pt-1.5 text-xs text-[#262626] bg-white/70 p-2.5 rounded border border-[#E2DED5]">
                      <span className="font-bold font-mono">Пояснение:</span>{' '}
                      {currentLang === 'kz' ? q.explanationKz : q.explanationRu}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[#E2DED5] flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onReturnToDashboard}
                className="flex-1 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm"
              >
                Вернуться в кабинет
              </button>
              <button
                type="button"
                onClick={onRetryExam}
                className="py-3 px-6 bg-white border border-[#E2DED5] hover:border-[#171717] text-[#171717] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Пройти заново</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND
      </footer>
    </div>
  );
};
