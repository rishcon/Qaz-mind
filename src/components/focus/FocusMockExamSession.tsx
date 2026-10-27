import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { Language } from '../../types';
import { examSimulatorQuestions } from '../../content/questions';
import { calculateExamScore } from '../../utils/scoring';

interface FocusMockExamSessionProps {
  currentLang: Language;
  onFinishExam: (result: {
    score: number;
    total: number;
    answers: Record<number, string>;
    flagged: Record<number, boolean>;
    durationTakenSeconds: number;
  }) => void;
  onExit: () => void;
}

const STORAGE_KEY = 'qazmind_active_exam_session';
const DEMO_EXAM_DURATION_SECONDS = 15 * 60; // 15 minutes for 5-question demo

export const FocusMockExamSession: React.FC<FocusMockExamSessionProps> = ({
  currentLang,
  onFinishExam,
  onExit,
}) => {
  const questions = examSimulatorQuestions;
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(DEMO_EXAM_DURATION_SECONDS);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Initialize or restore session with timestamp tracking
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.flagged) setFlagged(parsed.flagged);
        if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);

        // Calculate remaining time from real start timestamp
        if (parsed.startTimestamp) {
          const elapsed = Math.floor((Date.now() - parsed.startTimestamp) / 1000);
          const remaining = Math.max(0, DEMO_EXAM_DURATION_SECONDS - elapsed);
          setTimeLeft(remaining);
        }
        return;
      }
    } catch {
      // Fallback
    }

    // New session
    const startObj = {
      startTimestamp: Date.now(),
      currentIdx: 0,
      answers: {},
      flagged: {},
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(startObj));
    } catch {}
  }, []);

  // Save progress on answer or flag change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          answers,
          flagged,
          currentIdx,
        })
      );
    } catch {}
  }, [answers, flagged, currentIdx]);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answers, flagged]);

  const handleAutoSubmit = () => {
    const scoreResult = calculateExamScore(answers, questions);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onFinishExam({
      score: scoreResult.score,
      total: questions.length,
      answers,
      flagged,
      durationTakenSeconds: DEMO_EXAM_DURATION_SECONDS - timeLeft,
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx] || questions[0];

  const handleSelectAnswer = (optId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const handleToggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleFinish = () => {
    const scoreResult = calculateExamScore(answers, questions);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onFinishExam({
      score: scoreResult.score,
      total: questions.length,
      answers,
      flagged,
      durationTakenSeconds: DEMO_EXAM_DURATION_SECONDS - timeLeft,
    });
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Layout C Fullscreen Header: ZERO SIDEBAR */}
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitDialog(true)}
            aria-label="Выйти из экзамена"
            className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
          <div className="h-4 w-px bg-[#E2DED5] hidden sm:block" />
          <span className="text-xl font-extrabold tracking-tight font-mono">
            qazmind<span className="text-[#FF5A36]">.</span>
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold hidden md:inline">
            Демонстрационный тест (5 вопросов)
          </span>
        </div>

        {/* Center Current Subject */}
        <div className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider hidden sm:block">
          {currentLang === 'kz' ? currentQ.subjectKz : currentQ.subjectRu}
        </div>

        {/* Right Timer and Submit */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#171717] bg-white px-3 py-1.5 border border-[#E2DED5] rounded">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-[#FF5A36]'}`} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="px-4 py-1.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm"
          >
            Завершить
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-[960px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question Column (8 or 9 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-sm space-y-6">
              {/* Question Header & Subject */}
              <div className="flex items-center justify-between border-b border-[#E2DED5] pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
                    {currentLang === 'kz' ? currentQ.subjectKz : currentQ.subjectRu}
                  </span>
                  <div className="text-xs font-mono text-[#74736F] mt-0.5">
                    Вопрос {currentIdx + 1} из {questions.length}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono border rounded transition-colors cursor-pointer ${
                    flagged[currentQ.id]
                      ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                      : 'border-[#E2DED5] text-[#74736F] hover:border-[#171717]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{flagged[currentQ.id] ? 'На проверке' : 'Отметить'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-lg md:text-xl font-bold text-[#171717] leading-snug">
                {currentLang === 'kz' ? currentQ.questionKz : currentQ.questionRu}
              </h2>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full p-4 text-left border rounded transition-all cursor-pointer flex items-center justify-between text-sm ${
                        isSelected
                          ? 'border-[#FF5A36] bg-orange-50/50 ring-1 ring-[#FF5A36]'
                          : 'border-[#E2DED5] bg-[#FAF8F5] hover:border-[#171717]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#FF5A36] bg-[#FF5A36] text-white'
                              : 'border-[#D9D5CB] text-[#171717]'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{currentLang === 'kz' ? opt.textKz : opt.textRu}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Question Navigator Column (4 cols on lg) */}
          <div className="lg:col-span-4 bg-white border border-[#E2DED5] p-5 rounded-sm shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2DED5] pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717]">
                Навигатор заданий
              </span>
              <span className="text-xs font-mono text-[#74736F]">
                {answeredCount} / {questions.length}
              </span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!answers[q.id];
                const isFlagged = !!flagged[q.id];

                let bgClass = 'bg-[#FAF8F5] border-[#E2DED5] text-[#171717]';
                if (isCurrent) {
                  bgClass = 'border-[#FF5A36] ring-2 ring-[#FF5A36]/30 font-bold';
                }
                if (isAnswered) {
                  bgClass = 'bg-[#171717] border-[#171717] text-white font-bold';
                }
                if (isFlagged) {
                  bgClass += ' ring-2 ring-amber-400';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded border flex items-center justify-center text-xs font-mono transition-colors cursor-pointer relative ${bgClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[#E2DED5] space-y-1.5 text-[11px] font-mono text-[#74736F]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#171717] rounded-xs" />
                <span>Отвечено ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#FAF8F5] border border-[#E2DED5] rounded-xs" />
                <span>Не отвечено ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-400 rounded-xs" />
                <span>На проверке ({Object.values(flagged).filter(Boolean).length})</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions Bar */}
      <footer className="sticky bottom-0 bg-[#F5F3EE]/95 backdrop-blur-md border-t border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад</span>
        </button>

        <div className="flex items-center gap-3">
          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="px-6 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
            >
              <span>Далее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="px-6 py-2.5 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
            >
              <span>Завершить тест</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* Finish Confirmation Dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DED5] max-w-sm w-full p-6 shadow-xl rounded-sm">
            <h3 className="text-lg font-bold text-[#171717]">Завершить пробный тест?</h3>
            <p className="text-xs text-[#74736F] mt-2 leading-relaxed">
              Вы ответили на <strong className="text-[#171717]">{answeredCount}</strong> из{' '}
              <strong className="text-[#171717]">{questions.length}</strong> вопросов.
              {answeredCount < questions.length && ' Неотвеченные вопросы будут засчитаны как неверные.'}
            </p>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer"
              >
                Вернуться
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-[#FF5A36] hover:bg-[#E54825] text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Завершить сейчас
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DED5] max-w-sm w-full p-6 shadow-xl rounded-sm">
            <h3 className="text-lg font-bold text-[#171717]">Выйти из экзамена?</h3>
            <p className="text-xs text-[#74736F] mt-1.5 leading-relaxed">
              Ваши текущие ответы сохранены. Вы сможете возобновить этот тест позже, пока не истечет таймер.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="px-4 py-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer"
              >
                Продолжить экзамен
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
