import React, { useState } from 'react';
import { Language } from '../../types';
import { MistakeItem } from '../../types/dashboard';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface MistakesViewProps {
  mistakes: MistakeItem[];
  currentLang: Language;
  onReviewMistake: (mistake: MistakeItem) => void;
  onNavigateToPractice: () => void;
}

export const MistakesView: React.FC<MistakesViewProps> = ({
  mistakes,
  currentLang,
  onReviewMistake,
  onNavigateToPractice,
}) => {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  const filtered = mistakes.filter((m) => {
    if (filter === 'unresolved') return !m.resolved;
    if (filter === 'resolved') return m.resolved;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Менің қателерім' : 'Мои ошибки'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          Вопросы из тестов и практики, где были допущены неточности.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2DED5] pb-3">
        {[
          { id: 'unresolved' as const, label: 'Требуют разбора' },
          { id: 'all' as const, label: 'Все ошибки' },
          { id: 'resolved' as const, label: 'Усвоенные' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
              filter === f.id
                ? 'bg-[#171717] text-white'
                : 'text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mistakes List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white border border-[#E2DED5] hover:border-[#171717] rounded-sm transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5A36]">
                    {currentLang === 'kz' ? item.subjectKz : item.subjectRu}
                  </span>
                  <span className="text-[#E2DED5]">·</span>
                  <span className="text-xs font-mono text-[#74736F]">
                    {currentLang === 'kz' ? item.topicKz : item.topicRu}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#171717]">
                  {currentLang === 'kz' ? item.questionTextKz : item.questionTextRu}
                </h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {item.resolved ? (
                  <span className="text-xs font-mono text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Усвоено</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReviewMistake(item)}
                    className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-xs flex items-center gap-1.5"
                  >
                    <span>Разобрать</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-[#E2DED5] rounded text-xs text-[#74736F] space-y-3 max-w-md mx-auto">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-[#171717]">
            {filter === 'unresolved' ? 'Нет неразобранных ошибок' : 'Список пуст'}
          </div>
          <p className="text-xs text-[#74736F]">
            Продолжайте решать задания в разделе практики. Если возникнут ошибки, они появятся здесь.
          </p>
          <button
            type="button"
            onClick={onNavigateToPractice}
            className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
          >
            Перейти к практике
          </button>
        </div>
      )}
    </div>
  );
};
