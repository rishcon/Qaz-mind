import React, { useState, useEffect } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ExamItem, QuestionItem } from '../../types';
import { mockDb } from '../../repositories/mockDatabase';

interface FullscreenExamPreviewProps {
  exam: ExamItem;
  onClose: () => void;
}

export const FullscreenExamPreview: React.FC<FullscreenExamPreviewProps> = ({ exam, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);

  // Retrieve actual questions from database
  const questions: QuestionItem[] = exam.questionIds
    .map((id) => mockDb.questions.find((q) => q.id === id))
    .filter(Boolean) as QuestionItem[];

  // Fallback if exam had fewer questions in mock:
  const displayQuestions = questions.length > 0 ? questions : mockDb.questions.slice(0, 5);

  const currentQ = displayQuestions[currentIdx];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: string, optId: string) => {
    setUserAnswers({ ...userAnswers, [qId]: optId });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F3EE] flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* Top Warning Banner: Focus Mode Student Preview */}
      <div className="bg-[#171717] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-black">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FF5A36]" />
          <span className="font-semibold uppercase tracking-wider text-[#FF5A36]">
            Режим Focus Mode: Предпросмотр экзамена ЕНТ
          </span>
          <span className="hidden md:inline text-[#A8A29E]">
            (Результаты предпросмотра изолированы и не попадают в статистику учеников)
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#333] hover:bg-[#444] text-white text-xs font-medium cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> Выйти из предпросмотра
        </button>
      </div>

      {/* Test Exam Topbar */}
      <div className="bg-white border-b border-[#E2DED5] px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#171717]">{exam.titleRu}</h2>
          <p className="text-xs text-[#78716C]">
            Вопрос {currentIdx + 1} из {displayQuestions.length} • {currentQ?.points || 1} балл
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] font-mono text-xs font-semibold text-[#171717]">
          <Clock className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* Main Focus Question Surface */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-[#E2DED5] shadow-xs p-6 md:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Subject pill */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#FFF7F5] text-[#FF5A36] border border-[#FF5A36]/20">
                {currentQ?.sectionName || 'Раздел ЕНТ'}
              </span>
              <span className="text-xs text-[#78716C]">ID: {currentQ?.id}</span>
            </div>

            {/* Context passage if present */}
            {currentQ?.contextPassageRu && (
              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs text-[#444] leading-relaxed italic">
                {currentQ.contextPassageRu}
              </div>
            )}

            {/* Question Text */}
            <div className="text-base font-semibold text-[#171717] leading-relaxed">
              {currentQ?.textRu}
            </div>

            {/* Options */}
            {currentQ?.options && (
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, i) => {
                  const isChosen = userAnswers[currentQ.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`p-3.5 rounded-lg border flex items-center gap-3.5 cursor-pointer transition-all ${
                        isChosen
                          ? 'border-[#FF5A36] bg-[#FFF7F5] text-[#171717] shadow-xs'
                          : 'border-[#E2DED5] bg-white hover:bg-[#F9F8F5]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isChosen
                            ? 'bg-[#FF5A36] text-white'
                            : 'border border-[#D5D0C5] text-[#78716C]'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-xs leading-relaxed">{opt.textRu}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Between Questions */}
          <div className="pt-8 border-t border-[#E2DED5] mt-8 flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-3.5 py-2 rounded-md border border-[#E2DED5] text-xs font-medium bg-white text-[#171717] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>

            {/* Questions Jump Grid */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm px-2">
              {displayQuestions.map((q, idx) => {
                const answered = !!userAnswers[q.id];
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#FF5A36] text-white shadow-xs'
                        : answered
                        ? 'bg-[#258568] text-white'
                        : 'bg-[#F0EEE8] text-[#5C574F] hover:bg-[#E2DED5]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentIdx((i) => Math.min(displayQuestions.length - 1, i + 1))}
              disabled={currentIdx === displayQuestions.length - 1}
              className="px-3.5 py-2 rounded-md border border-[#E2DED5] text-xs font-medium bg-white text-[#171717] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              Вперед <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
