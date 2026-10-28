import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Language } from '../../types';
import { ApiPracticeReview, ApiPracticeSession, OptionLabel, practiceApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface FocusPracticeProps {
  sessionId: string;
  currentLang: Language;
  /** Starts another run for the same subject. */
  onRestart: (subjectId: string) => void;
  onExit: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; session: ApiPracticeSession }
  | { status: 'error'; message: string };

/**
 * Full-viewport practice run. The server checks every answer and reveals the key only after the answer is saved,
 * so nothing on this screen can show a correct answer early.
 */
export const FocusPractice: React.FC<FocusPracticeProps> = ({ sessionId, currentLang, onRestart, onExit }) => {
  const isKz = currentLang === 'kz';
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<OptionLabel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    practiceApi
      .session(sessionId)
      .then((session) => {
        if (cancelled) return;
        // Resume at the first question that has no answer yet.
        const firstOpen = session.items.findIndex((item) => item.review === null);
        setIndex(firstOpen === -1 ? Math.max(session.items.length - 1, 0) : firstOpen);
        setLoad({ status: 'ready', session });
      })
      .catch((err) => !cancelled && setLoad({ status: 'error', message: errorText(err) }));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const text = (ru: string, kz: string) => (isKz && kz ? kz : ru);

  if (load.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center font-mono text-xs text-[#74736F]">
        Загрузка практики…
      </div>
    );
  }

  if (load.status === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-[460px] bg-white border border-[#E2DED5] p-8 rounded-sm">
          <h1 className="text-xl font-extrabold">Не удалось открыть практику</h1>
          <p className="text-sm text-[#74736F] mt-2 leading-relaxed">{load.message}</p>
          <button
            type="button"
            onClick={onExit}
            className="mt-6 w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold cursor-pointer"
          >
            К практике
          </button>
        </div>
      </div>
    );
  }

  const { session } = load;
  const finished = session.finished_at !== null;

  const setReview = (questionId: string, review: ApiPracticeReview) => {
    const items = session.items.map((item) => (item.question.id === questionId ? { ...item, review } : item));
    const answered = items.filter((item) => item.review).length;
    const correct = items.filter((item) => item.review?.is_correct).length;
    setLoad({ status: 'ready', session: { ...session, items, answered, correct } });
  };

  const check = async () => {
    const item = session.items[index];
    if (!picked || busy || item.review) return;
    setBusy(true);
    setError('');
    try {
      setReview(item.question.id, await practiceApi.answer(session.id, item.question.id, picked));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (index < session.items.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      setLoad({ status: 'ready', session: await practiceApi.finish(session.id) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // ----- results ---------------------------------------------------------------------------
  if (finished) {
    const missed = session.items.filter((item) => item.review && !item.review.is_correct);
    const skipped = session.total - session.answered;
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] selection:bg-[#FF5A36] selection:text-white">
        <main className="flex justify-center px-4 py-10 md:py-16">
          <div className="w-full max-w-[740px] space-y-8">
            <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF5A36] font-bold">
                {isKz ? 'Практика аяқталды' : 'Практика завершена'}
              </span>
              <div className="mt-2 text-5xl md:text-6xl font-black tracking-tight">
                {session.correct}
                <span className="text-[#A8A29E]"> / {session.total}</span>
              </div>
              <p className="mt-2 text-sm text-[#74736F]">
                {isKz ? 'дұрыс жауап' : 'правильных ответов'}
                {skipped > 0 && (isKz ? `, жауап берілмеген: ${skipped}` : `, без ответа: ${skipped}`)}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onRestart(session.subject_id)}
                  className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#E84D2B] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
                >
                  {isKz ? 'Тағы бір сессия' : 'Ещё раз'}
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="px-5 py-2.5 bg-white border border-[#E2DED5] hover:border-[#171717] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
                >
                  {isKz ? 'Кабинетке' : 'В кабинет'}
                </button>
              </div>
            </div>

            {missed.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#74736F]">
                  {isKz ? 'Қателермен жұмыс' : 'Разбор ошибок'}
                </h2>
                {missed.map(({ question, review }) => {
                  const label = (l: OptionLabel) => {
                    const o = question.options.find((opt) => opt.label === l);
                    return o ? text(o.text_ru, o.text_kz) : l;
                  };
                  return (
                    <div key={question.id} className="bg-white border border-[#E2DED5] p-5 rounded-sm space-y-3">
                      <p className="font-bold leading-snug">{text(question.text_ru, question.text_kz)}</p>
                      <p className="text-xs text-red-700">
                        {isKz ? 'Сіздің жауабыңыз' : 'Ваш ответ'}: {review!.selected_label}. {label(review!.selected_label)}
                      </p>
                      <p className="text-xs text-[#258568] font-semibold">
                        {isKz ? 'Дұрыс жауап' : 'Верный ответ'}: {review!.correct_label}. {label(review!.correct_label)}
                      </p>
                      {text(review!.explanation_ru, review!.explanation_kz) && (
                        <p className="text-xs text-[#5C574F] leading-relaxed">
                          {text(review!.explanation_ru, review!.explanation_kz)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ----- a question ------------------------------------------------------------------------
  const item = session.items[index];
  const review = item.review;
  const isLast = index === session.items.length - 1;
  const chosen = review ? review.selected_label : picked;

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (session.answered > 0 ? setShowExitConfirm(true) : onExit())}
          aria-label={isKz ? 'Шығу' : 'Выйти из практики'}
          className="p-1.5 hover:bg-[#EAE7DF] rounded text-[#171717] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{isKz ? 'Шығу' : 'Выйти'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#74736F]">
            {index + 1} / {session.total}
          </span>
          <div className="flex gap-1">
            {session.items.map((it, i) => (
              <div
                key={it.question.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? 'w-5 bg-[#FF5A36]'
                    : it.review
                      ? it.review.is_correct
                        ? 'w-2 bg-[#258568]'
                        : 'w-2 bg-red-500'
                      : 'w-2 bg-[#E2DED5]'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[740px] space-y-6">
          <h1 className="text-lg md:text-2xl font-bold leading-snug">{text(item.question.text_ru, item.question.text_kz)}</h1>

          <div className="space-y-3" role="radiogroup">
            {item.question.options.map((opt) => {
              const isChosen = chosen === opt.label;
              const isRight = review?.correct_label === opt.label;
              const isWrong = review && isChosen && !review.is_correct;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={!!review || busy}
                  onClick={() => setPicked(opt.label)}
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
                  <span className="flex-1 text-sm leading-relaxed">{text(opt.text_ru, opt.text_kz)}</span>
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
                  ? isKz ? 'Дұрыс!' : 'Верно!'
                  : isKz ? `Дұрыс жауап: ${review.correct_label}` : `Неверно. Правильный ответ: ${review.correct_label}`}
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

          <div className="pt-2">
            {review ? (
              <button
                type="button"
                onClick={next}
                disabled={busy}
                className="px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer rounded-sm"
              >
                <span>{isLast ? (isKz ? 'Аяқтау' : 'Завершить') : isKz ? 'Келесі' : 'Дальше'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={check}
                disabled={!picked || busy}
                className="px-6 py-3 bg-[#FF5A36] hover:bg-[#E84D2B] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
              >
                {busy ? '…' : isKz ? 'Тексеру' : 'Проверить'}
              </button>
            )}
          </div>
        </div>
      </main>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-[420px] w-full bg-white border border-[#E2DED5] p-6 rounded-sm space-y-4">
            <h2 className="text-lg font-extrabold">{isKz ? 'Сессияны тоқтату керек пе?' : 'Выйти из практики?'}</h2>
            <p className="text-sm text-[#74736F]">
              {isKz
                ? 'Берілген жауаптар сақталды.'
                : 'Уже данные ответы сохранены. Оставшиеся задания останутся без ответа.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 border border-[#E2DED5] hover:border-[#171717] font-mono text-xs font-bold cursor-pointer rounded-sm"
              >
                {isKz ? 'Жалғастыру' : 'Продолжить'}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold cursor-pointer rounded-sm"
              >
                {isKz ? 'Шығу' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
