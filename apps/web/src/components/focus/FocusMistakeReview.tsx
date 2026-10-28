import React, { useState } from 'react';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { Language } from '../../types';
import { MistakeItem } from '../../types/dashboard';
import { ApiPracticeReview, OptionLabel, mistakesApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface FocusMistakeReviewProps {
  mistake: MistakeItem;
  currentLang: Language;
  /** Language of the question text: the student's exam language. */
  contentLang: Language;
  /** Called after the server has stored the retry, so the list can be reloaded. */
  onAnswered: () => void;
  onExit: () => void;
}

/**
 * Retry of a question that was answered wrongly. All options are offered again; the server checks the answer and
 * stores it, and the mistake counts as resolved only when the latest answer is correct.
 */
export const FocusMistakeReview: React.FC<FocusMistakeReviewProps> = ({ mistake, currentLang, contentLang, onAnswered, onExit }) => {
  const isKz = currentLang === 'kz';
  const [picked, setPicked] = useState<OptionLabel | null>(null);
  const [review, setReview] = useState<ApiPracticeReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const text = (ru: string, kz: string) => (contentLang === 'kz' && kz ? kz : ru);
  const optionText = (label: string) => {
    const o = mistake.options.find((opt) => opt.label === label);
    return o ? text(o.textRu, o.textKz) : label;
  };

  const check = async () => {
    if (!picked || busy || review) return;
    setBusy(true);
    setError('');
    try {
      setReview(await mistakesApi.retry(mistake.id, picked));
      onAnswered();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const retryAgain = () => {
    setReview(null);
    setPicked(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isKz ? 'Қателер тізіміне' : 'К списку ошибок'}</span>
        </button>
        <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">
          {isKz ? mistake.subjectKz : mistake.subjectRu}
        </span>
      </header>

      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[740px] space-y-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isKz ? 'Қатемен жұмыс' : 'Работа над ошибкой'}</span>
            </span>
            <h1 className="text-lg md:text-2xl font-bold leading-snug mt-1.5">
              {text(mistake.questionTextRu, mistake.questionTextKz)}
            </h1>
          </div>

          <div className="p-4 bg-red-50/70 border border-red-200 rounded-sm text-xs space-y-1">
            <div className="text-red-700 font-mono font-bold">
              {isKz ? 'Соңғы қате жауабың:' : 'Твой прошлый ошибочный ответ:'}
            </div>
            <div className="text-red-950 font-medium">
              {mistake.wrongLabel}. {optionText(mistake.wrongLabel)}
            </div>
          </div>

          <div className="space-y-3" role="radiogroup">
            {mistake.options.map((opt) => {
              const isChosen = picked === opt.label;
              const isRight = review?.correct_label === opt.label;
              const isWrong = review && isChosen && !review.is_correct;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={!!review || busy}
                  onClick={() => setPicked(opt.label as OptionLabel)}
                  className={`w-full text-left flex items-start gap-3 p-4 border rounded-sm transition-colors ${
                    isRight
                      ? 'border-[#258568] bg-[#F4FAF7]'
                      : isWrong
                        ? 'border-red-400 bg-red-50'
                        : isChosen
                          ? 'border-[#FF5A36] bg-white'
                          : 'border-[#E2DED5] bg-white hover:border-[#171717]'
                  } ${review ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="font-mono text-xs font-bold w-5 shrink-0 pt-0.5 text-[#74736F]">{opt.label}</span>
                  <span className="flex-1 text-sm leading-relaxed">{text(opt.textRu, opt.textKz)}</span>
                  {isRight && <Check className="w-4 h-4 text-[#258568] shrink-0 mt-0.5" />}
                  {isWrong && <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {review && (
            <div
              className={`p-4 border rounded-sm text-sm space-y-1.5 ${
                review.is_correct ? 'border-[#BFE3D4] bg-[#F4FAF7]' : 'border-red-200 bg-red-50'
              }`}
            >
              <p className="font-bold">
                {review.is_correct
                  ? isKz ? 'Керемет! Қате меңгерілді' : 'Отлично! Ошибка исправлена'
                  : isKz ? 'Әзірге қате' : 'Пока неверно'}
              </p>
              {text(review.explanation_ru, review.explanation_kz) && (
                <p className="text-[#5C574F] leading-relaxed">{text(review.explanation_ru, review.explanation_kz)}</p>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
              {error}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            {!review ? (
              <button
                type="button"
                onClick={check}
                disabled={!picked || busy}
                className="px-6 py-3 bg-[#FF5A36] hover:bg-[#E84D2B] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
              >
                {busy ? '…' : isKz ? 'Тексеру' : 'Проверить'}
              </button>
            ) : (
              <>
                {!review.is_correct && (
                  <button
                    type="button"
                    onClick={retryAgain}
                    className="px-6 py-3 bg-[#FF5A36] hover:bg-[#E84D2B] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
                  >
                    {isKz ? 'Қайта көру' : 'Попробовать ещё раз'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
                >
                  {isKz ? 'Тізімге оралу' : 'Вернуться в список ошибок'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
