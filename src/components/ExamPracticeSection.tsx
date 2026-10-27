import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { examSimulatorQuestions } from '../content/questions';
import { calculateExamScore, getScoreTargetFeedback } from '../utils/scoring';
import { Bookmark, Clock, Check, X, RotateCcw } from 'lucide-react';

interface ExamPracticeSectionProps {
  currentLang: Language;
}

export const ExamPracticeSection: React.FC<ExamPracticeSectionProps> = ({ currentLang }) => {
  const t = locales[currentLang];
  const questions = examSimulatorQuestions;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(3 * 3600 + 42 * 60 + 15); // 03:42:15
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Active question
  const currentQ = questions[currentIndex];

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning || isExamCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isExamCompleted]);

  // Format time hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const toggleFlag = (qId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleRestart = () => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentIndex(0);
    setIsExamCompleted(false);
    setTimerSeconds(3 * 3600 + 42 * 60 + 15);
    setIsTimerRunning(true);
  };

  // Keyboard shortcut listener for A, B, C, D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExamCompleted) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectAnswer(key);
      } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isExamCompleted]);

  // Scoring
  const scoreResult = calculateExamScore(userAnswers, questions);
  // Scale to 140 equivalent for educational feedback
  const scaledScore = Math.round((scoreResult.score / questions.length) * 140);
  const targetFeedback = getScoreTargetFeedback(scaledScore, 140);

  return (
    <section className="py-24 md:py-36 bg-[#171717] text-[#F5F3EE] border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.practice.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#333333]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-8">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#F5F3EE] font-display whitespace-pre-line leading-[0.98]">
              {t.practice.headline}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-base md:text-lg text-[#F5F3EE]/70 leading-relaxed font-normal">
              {t.practice.subheadline}
            </p>
          </div>
        </div>

        {/* High-Fidelity Realistic Examination Interface */}
        <div className="border border-[#2F2F2F] bg-[#1E1E1E] shadow-[8px_8px_0px_#0A0A0A] overflow-hidden">
          {/* Exam Header Ribbon */}
          <div className="bg-[#121212] px-6 py-4 border-b border-[#2A2A2A] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
                {t.practice.examConsoleTitle}
              </span>
              <span className="text-[#444] hidden sm:inline">|</span>
              <span className="text-xs font-mono text-[#F5F3EE]/70 hidden sm:inline">
                {currentLang === 'ru' ? currentQ.subjectRu : currentQ.subjectKz}
              </span>
            </div>

            {/* Official Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#171717] px-3.5 py-1.5 border border-[#333]">
                <Clock className="w-4 h-4 text-[#FF5A36]" />
                <span className="font-mono text-sm font-bold tracking-widest text-[#F5F3EE]">
                  {formatTime(timerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="text-[10px] font-mono text-[#F5F3EE]/50 hover:text-white uppercase ml-1 cursor-pointer"
                >
                  {isTimerRunning ? 'Пауза' : 'Старт'}
                </button>
              </div>

              {!isExamCompleted && (
                <button
                  type="button"
                  onClick={() => setIsExamCompleted(true)}
                  className="px-3.5 py-1.5 bg-[#FF5A36] hover:bg-[#E54825] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t.practice.finishExam}
                </button>
              )}
            </div>
          </div>

          {/* Exam Body Grid: Left Navigation Strip + Center Active Question */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Question Matrix (3 cols) */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#2A2A2A] p-6 bg-[#161616]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[#F5F3EE]/60 uppercase tracking-wider">
                  {currentLang === 'ru' ? 'Сетка заданий' : 'Тапсырмалар торы'}
                </span>
                <span className="font-mono text-xs text-[#FF5A36] font-bold">
                  {Object.keys(userAnswers).length} / {questions.length}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-11 flex items-center justify-center font-mono text-xs font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-sm'
                          : isAnswered
                          ? 'bg-[#2A2A2A] text-white border-[#444]'
                          : 'bg-[#1F1F1F] text-[#F5F3EE]/50 border-[#2A2A2A] hover:border-[#555]'
                      }`}
                    >
                      <span>{q.id}</span>
                      {isFlagged && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-[#2A2A2A] space-y-2 text-xs font-mono text-[#F5F3EE]/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#FF5A36] inline-block" />
                  <span>{currentLang === 'ru' ? 'Текущий вопрос' : 'Ағымдағы сұрақ'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#2A2A2A] border border-[#444] inline-block" />
                  <span>{currentLang === 'ru' ? 'Ответ выбран' : 'Жауап таңдалды'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#1F1F1F] border border-[#2A2A2A] inline-block" />
                  <span>{currentLang === 'ru' ? 'Без ответа' : 'Жауапсыз'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Active Question Workspace (9 cols) */}
            <div className="lg:col-span-9 p-6 md:p-10 flex flex-col justify-between bg-[#1E1E1E]">
              <div>
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#FF5A36]">
                      {t.practice.questionOutOf} {currentQ.id} / {questions.length}
                    </span>
                    <span className="text-[#333]">·</span>
                    <span className="font-mono text-xs text-[#F5F3EE]/60">
                      {currentLang === 'ru' ? currentQ.subjectRu : currentQ.subjectKz}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer px-2.5 py-1 border ${
                      flaggedQuestions[currentQ.id]
                        ? 'border-[#FF5A36] text-[#FF5A36] bg-[#FF5A36]/10'
                        : 'border-[#333] text-[#F5F3EE]/60 hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{t.practice.markForReview}</span>
                  </button>
                </div>

                {/* Question Text */}
                <div className="mb-8">
                  <p className="text-lg md:text-xl font-medium text-[#F5F3EE] leading-relaxed">
                    {currentLang === 'ru' ? currentQ.questionRu : currentQ.questionKz}
                  </p>
                </div>

                {/* Answer Options A, B, C, D */}
                <div className="space-y-3 mb-8">
                  {currentQ.options.map((opt) => {
                    const isSelected = userAnswers[currentQ.id] === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectAnswer(opt.id)}
                        className={`w-full text-left p-4 border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#2A2A2A] border-[#FF5A36] text-white shadow-sm'
                            : 'bg-[#171717] border-[#2A2A2A] text-[#F5F3EE]/85 hover:border-[#444] hover:bg-[#1C1C1C]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-1 shrink-0 border ${
                              isSelected
                                ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                                : 'bg-[#242424] text-[#F5F3EE]/70 border-[#333]'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-sm md:text-base font-normal">
                            {currentLang === 'ru' ? opt.textRu : opt.textKz}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#FF5A36]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] font-mono text-[#F5F3EE]/40">
                  {currentLang === 'ru'
                    ? 'Горячие клавиши: [A, B, C, D] для выбора, [← / →] для навигации'
                    : 'Жедел пернелер: [A, B, C, D] таңдау үшін, [← / →] навигация үшін'}
                </div>
              </div>

              {/* Navigation Controls: Back & Forward */}
              <div className="mt-8 pt-6 border-t border-[#2A2A2A] flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="px-5 py-2.5 border border-[#333] hover:border-[#555] disabled:opacity-30 disabled:pointer-events-none text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ← {t.practice.previous}
                </button>

                <div className="font-mono text-xs text-[#F5F3EE]/60">
                  {currentQ.id} / {questions.length}
                </div>

                <button
                  type="button"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="px-5 py-2.5 bg-[#F5F3EE] hover:bg-white text-[#171717] disabled:opacity-30 disabled:pointer-events-none text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t.practice.next} →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Interactive Exam Results & Diagnostic Breakdown */}
        {isExamCompleted && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1E1E1E] text-[#F5F3EE] border border-[#FF5A36] max-w-2xl w-full p-8 shadow-[12px_12px_0px_#000] max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-[#2A2A2A] pb-4 mb-6">
                <div>
                  <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
                    {currentLang === 'ru' ? 'ИТОГИ ТЕСТИРОВАНИЯ' : 'ТЕСТІЛЕУ НӘТИЖЕСІ'}
                  </span>
                  <h3 className="text-2xl font-bold font-display text-white mt-1">
                    {scaledScore} / 140 {currentLang === 'ru' ? 'баллов' : 'балл'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExamCompleted(false)}
                  className="p-1 text-[#F5F3EE]/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Band assessment */}
              <div className="p-4 bg-[#141414] border border-[#333] mb-6">
                <span className="font-mono text-[11px] text-[#F5F3EE]/50 uppercase tracking-wider block mb-1">
                  {currentLang === 'ru' ? 'ОЦЕНКА УРОВНЯ' : 'ДЕҢГЕЙ БАҒАМЫ'}
                </span>
                <p className="text-sm font-semibold text-[#FF5A36]">
                  {currentLang === 'ru' ? targetFeedback.bandRu : targetFeedback.bandKz}
                </p>
                <p className="text-xs text-[#F5F3EE]/70 mt-1">
                  {scoreResult.correctCount} {currentLang === 'ru' ? 'из 5 решено верно' : 'сұраққа дұрыс жауап берілді'} ({scoreResult.percentage}%).
                </p>
              </div>

              {/* Detailed answers review */}
              <div className="space-y-4 mb-8">
                <h4 className="font-mono text-xs uppercase text-[#F5F3EE]/60 font-semibold tracking-wider">
                  {currentLang === 'ru' ? 'Разбор вопросов' : 'Сұрақтарды талдау'}:
                </h4>

                {questions.map((q) => {
                  const userAns = userAnswers[q.id];
                  const isRight = userAns === q.correctId;

                  return (
                    <div key={q.id} className="p-3.5 bg-[#171717] border border-[#2A2A2A] text-xs">
                      <div className="flex items-center justify-between mb-1.5 font-mono">
                        <span className="font-bold text-[#F5F3EE]">
                          №{q.id} · {currentLang === 'ru' ? q.subjectRu : q.subjectKz}
                        </span>
                        <span className={isRight ? 'text-green-400 font-bold' : 'text-[#FF5A36] font-bold'}>
                          {isRight
                            ? (currentLang === 'ru' ? 'Верно' : 'Дұрыс')
                            : (currentLang === 'ru' ? `Ошибка (Твой: ${userAns || 'нет'})` : `Қате (Сенікі: ${userAns || 'жоқ'})`)}
                        </span>
                      </div>
                      <p className="text-[#F5F3EE]/90 mb-2 font-normal">
                        {currentLang === 'ru' ? q.questionRu : q.questionKz}
                      </p>
                      <p className="text-[#F5F3EE]/60 text-[11px] bg-[#121212] p-2 border-l-2 border-[#FF5A36]">
                        <span className="text-[#FF5A36] font-semibold">
                          {currentLang === 'ru' ? `Правильный ответ (${q.correctId}): ` : `Дұрыс жауап (${q.correctId}): `}
                        </span>
                        {currentLang === 'ru' ? q.explanationRu : q.explanationKz}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex items-center gap-2 text-xs font-mono text-[#F5F3EE]/70 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ru' ? 'Пройти заново' : 'Қайта тапсыру'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExamCompleted(false)}
                  className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#E54825] text-white text-xs font-display font-bold uppercase tracking-wider cursor-pointer"
                >
                  {currentLang === 'ru' ? 'Закрыть окно' : 'Терезені жабу'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
