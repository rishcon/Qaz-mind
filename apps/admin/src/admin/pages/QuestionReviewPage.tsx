import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Check,
  X,
  Eye,
  BookOpen,
} from 'lucide-react';
import { QuestionItem } from '../types';
import { adminService } from '../services/adminService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockDb } from '../repositories/mockDatabase';

interface QuestionReviewPageProps {
  onNavigate: (path: string) => void;
}

export const QuestionReviewPage: React.FC<QuestionReviewPageProps> = ({ onNavigate }) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [actionDoneToast, setActionDoneToast] = useState<string | null>(null);

  const reviewQueue = mockDb.questions.filter(
    (q) => q.status === 'in_review' || q.status === 'draft' || q.status === 'changes_requested'
  );

  const selectedQuestion =
    reviewQueue.find((q) => q.id === selectedQuestionId) || reviewQueue[0];

  // Quality metrics
  const missingExplanations = mockDb.questions.filter((q) => !q.explanationRu || q.explanationRu.length < 10).length;
  const missingKz = mockDb.questions.filter((q) => !q.textKz || q.textKz.length < 5).length;
  const reportedCount = mockDb.contentReports.filter((r) => r.status === 'pending').length;

  const handleReviewAction = (action: 'approve' | 'request_changes' | 'reject' | 'publish') => {
    if (!selectedQuestion) return;
    adminService.reviewQuestion(selectedQuestion.id, action, reviewerNotes);
    setReviewerNotes('');
    const actionLabel =
      action === 'approve'
        ? 'Вопрос одобрен'
        : action === 'publish'
        ? 'Вопрос опубликован в боевой реестр'
        : action === 'request_changes'
        ? 'Отправлены замечания автору'
        : 'Вопрос отклонен';
    setActionDoneToast(actionLabel);
    setTimeout(() => setActionDoneToast(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">
          Модерация и контроль качества контента ЕНТ
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Экспертная рецензия методистов, проверка формулировок, валидация ключей и работа с замечаниями.
        </p>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2DED5]">
          <span className="text-xs text-[#78716C]">На рецензировании</span>
          <div className="text-xl font-bold text-[#FF5A36] mt-1">{reviewQueue.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2DED5]">
          <span className="text-xs text-[#78716C]">Жалобы учащихся</span>
          <div className="text-xl font-bold text-[#C94A43] mt-1">{reportedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2DED5]">
          <span className="text-xs text-[#78716C]">Без перевода (KZ)</span>
          <div className="text-xl font-bold text-[#D89B35] mt-1">{missingKz}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2DED5]">
          <span className="text-xs text-[#78716C]">Без пояснений</span>
          <div className="text-xl font-bold text-[#171717] mt-1">{missingExplanations}</div>
        </div>
      </div>

      {actionDoneToast && (
        <div className="p-3 bg-[#EBF7F2] border border-[#258568]/30 rounded-xl text-xs font-semibold text-[#1D6A53] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {actionDoneToast}. Событие зафиксировано в журнале аудита.
        </div>
      )}

      {/* Main Review Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Queue */}
        <div className="bg-white rounded-xl border border-[#E2DED5] p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DED5]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
              Очередь на проверку ({reviewQueue.length})
            </h2>
          </div>

          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
            {reviewQueue.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78716C]">
                Все вопросы проверены! Очередь пуста.
              </div>
            ) : (
              reviewQueue.map((q) => {
                const isSelected = q.id === selectedQuestion?.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#FF5A36] bg-[#FFF7F5] shadow-xs'
                        : 'border-[#E2DED5] bg-white hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#FF5A36]">{q.id}</span>
                      <StatusBadge status={q.status} size="sm" />
                    </div>
                    <p className="text-xs font-medium text-[#171717] line-clamp-2 mt-1 leading-snug">
                      {q.textRu}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#A8A29E]">
                      <span>{q.sectionName}</span>
                      <span>Автор: {q.author.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Inspection & Decision Card */}
        <div className="lg:col-span-2 space-y-4">
          {selectedQuestion ? (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DED5]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FF5A36]">
                      #{selectedQuestion.id}
                    </span>
                    <StatusBadge status={selectedQuestion.status} />
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Раздел: {selectedQuestion.sectionName} • Тип: {selectedQuestion.type} • Баллов: {selectedQuestion.points}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate(`/admin/content/questions/${selectedQuestion.id}`)}
                  className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Открыть полный редактор
                </button>
              </div>

              {/* Context passage if present */}
              {selectedQuestion.contextPassageRu && (
                <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs text-[#5C574F] italic leading-relaxed">
                  <p className="font-semibold not-italic text-[#171717] mb-1">Фрагмент источника / Контекст:</p>
                  {selectedQuestion.contextPassageRu}
                </div>
              )}

              {/* Question Text */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Текст задания (RU):
                </h3>
                <p className="text-sm font-semibold text-[#171717] leading-relaxed">
                  {selectedQuestion.textRu}
                </p>
                {selectedQuestion.textKz && (
                  <p className="text-xs text-[#5C574F] mt-1 italic">KZ: {selectedQuestion.textKz}</p>
                )}
              </div>

              {/* Answer Options & Verification */}
              {selectedQuestion.options && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                    Варианты ответа и правильный ключ:
                  </h3>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          opt.isCorrect
                            ? 'border-[#258568] bg-[#F4FAF7] text-[#1D6A53] font-semibold'
                            : 'border-[#E2DED5] bg-white text-[#171717]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              opt.isCorrect
                                ? 'bg-[#258568] text-white'
                                : 'border border-[#D5D0C5] text-[#78716C]'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt.textRu}</span>
                        </div>
                        {opt.isCorrect && (
                          <span className="text-[11px] font-bold text-[#258568] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> ВЕРНЫЙ ОТВЕТ
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedagogical Explanation Check */}
              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs space-y-1.5">
                <p className="font-bold text-[#171717] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" /> Методическое пояснение:
                </p>
                <p className="text-[#5C574F] leading-relaxed">{selectedQuestion.explanationRu}</p>
              </div>

              {/* Reviewer Feedback Input */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-[#171717] block">
                  Замечания методиста / Комментарий рецензента:
                </label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Укажите замечания по формулировке, источнику или ключу ответа..."
                  className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E2DED5] flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleReviewAction('request_changes')}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded-md hover:bg-[#FFF1F2] cursor-pointer"
                >
                  Вернуть на доработку
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction('approve')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" /> Утвердить вопрос
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction('publish')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Опубликовать сразу
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-12 text-center text-xs text-[#78716C]">
              Выберите вопрос из левой колонки для проведения экспертизы.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
