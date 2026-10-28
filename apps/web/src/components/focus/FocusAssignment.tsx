import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Language } from '../../types';
import { ApiAttempt, OptionLabel, assignmentApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface FocusAssignmentProps {
  attemptId: string;
  currentLang: Language;
  onExit: () => void;
}

/**
 * A school assignment attempt in Focus Mode. Answers are saved on the server one by one and may be changed until
 * the attempt is submitted; the key is never shown while answering. After submitting, the score and the key
 * appear only if the teacher's setting allows it.
 */
export const FocusAssignment: React.FC<FocusAssignmentProps> = ({ attemptId, currentLang, onExit }) => {
  const [attemptLang, setAttemptLang] = useState<Language | null>(null);
  const [attempt, setAttempt] = useState<ApiAttempt | null>(null);
  const [loadError, setLoadError] = useState('');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, OptionLabel>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    assignmentApi
      .attempt(attemptId)
      .then((a) => {
        if (cancelled) return;
        setAttempt(a);
        setAttemptLang(a.language);
        const saved: Record<string, OptionLabel> = {};
        a.items.forEach((item) => {
          if (item.selected_label) saved[item.question.id] = item.selected_label as OptionLabel;
        });
        setPicked(saved);
      })
      .catch((err) => !cancelled && setLoadError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  // The class decides the language of school assignments, both for the questions and for the screen around them.
  const language: Language = attemptLang ?? currentLang;
  const isKz = language === 'kz';
  const text = (ru: string, kz: string) => (language === 'kz' && kz ? kz : ru);
  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button type="button" onClick={onExit} className="p-1.5 hover:bg-[#EAE7DF] rounded flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>{isKz ? 'Тапсырмаларға' : 'К заданиям'}</span>
        </button>
        <span className="text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider truncate max-w-[50%]">{attempt?.title ?? ''}</span>
      </header>
      <main className="flex-1 flex justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[740px] space-y-6">{children}</div>
      </main>
    </div>
  );

  if (loadError) return shell(<p role="alert" className="text-sm text-red-700">{loadError}</p>);
  if (!attempt) return shell(<p className="text-sm text-[#74736F]">{isKz ? 'Жүктелуде…' : 'Загрузка…'}</p>);

  const submitted = attempt.submitted_at !== null;
  const answered = attempt.items.filter((i) => picked[i.question.id]).length;

  if (submitted) {
    return shell(
      <>
        <div className="bg-white border border-[#E2DED5] p-6 rounded-sm space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{isKz ? 'Жұмыс тапсырылды' : 'Работа сдана'}</h1>
          {attempt.result_visible && attempt.score !== null ? (
            <p className="text-sm">
              {isKz ? 'Нәтиже' : 'Результат'}: <b>{attempt.score}</b> / {attempt.max_score}
            </p>
          ) : (
            <p className="text-sm text-[#74736F]">
              {isKz ? 'Нәтиже мұғалім рұқсат бергенде көрсетіледі.' : 'Результат и правильные ответы появятся, когда учитель откроет их.'}
            </p>
          )}
        </div>
        {attempt.result_visible &&
          attempt.items.map((item, n) => (
            <div key={item.question.id} className="bg-white border border-[#E2DED5] p-4 rounded-sm space-y-2 text-sm">
              <div className="flex gap-2">
                {item.review?.is_correct ? <Check className="w-4 h-4 text-[#258568] mt-0.5" /> : <X className="w-4 h-4 text-red-600 mt-0.5" />}
                <b>
                  {n + 1}. {text(item.question.text_ru, item.question.text_kz)}
                </b>
              </div>
              <ul className="space-y-1 pl-6">
                {item.question.options.map((o) => (
                  <li
                    key={o.label}
                    className={
                      o.label === item.review?.correct_label
                        ? 'text-[#258568] font-semibold'
                        : o.label === item.review?.selected_label
                          ? 'text-red-700'
                          : 'text-[#74736F]'
                    }
                  >
                    {o.label}. {text(o.text_ru, o.text_kz)}
                    {o.label === item.review?.selected_label && (isKz ? ' — сіздің жауабыңыз' : ' — ваш ответ')}
                  </li>
                ))}
              </ul>
              {item.review && text(item.review.explanation_ru, item.review.explanation_kz) && (
                <p className="pl-6 text-[#5C574F]">{text(item.review.explanation_ru, item.review.explanation_kz)}</p>
              )}
            </div>
          ))}
        <button type="button" onClick={onExit} className="px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm">
          {isKz ? 'Тапсырмаларға оралу' : 'К списку заданий'}
        </button>
      </>,
    );
  }

  const item = attempt.items[index];
  const current = picked[item.question.id] ?? null;

  const choose = async (label: OptionLabel) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await assignmentApi.answer(attempt.id, item.question.id, label);
      setPicked((prev) => ({ ...prev, [item.question.id]: label }));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      setAttempt(await assignmentApi.finish(attempt.id));
      setConfirmSubmit(false);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const nav = 'px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm disabled:opacity-40';

  return shell(
    <>
      <div className="flex flex-wrap gap-1.5">
        {attempt.items.map((it, n) => (
          <button
            key={it.question.id}
            type="button"
            onClick={() => setIndex(n)}
            className={`w-8 h-8 text-xs font-mono font-bold rounded-sm border cursor-pointer ${
              n === index ? 'bg-[#171717] text-white border-[#171717]' : picked[it.question.id] ? 'bg-[#FFEDE8] border-[#FF5A36]' : 'bg-white border-[#E2DED5]'
            }`}
          >
            {n + 1}
          </button>
        ))}
      </div>

      <h1 className="text-lg md:text-2xl font-bold leading-snug">{text(item.question.text_ru, item.question.text_kz)}</h1>

      <div className="space-y-3" role="radiogroup">
        {item.question.options.map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={current === o.label}
            disabled={busy}
            onClick={() => choose(o.label as OptionLabel)}
            className={`w-full text-left flex items-start gap-3 p-4 border rounded-sm transition-colors cursor-pointer ${
              current === o.label ? 'border-[#FF5A36] bg-white' : 'border-[#E2DED5] bg-white hover:border-[#171717]'
            }`}
          >
            <span className="font-mono text-xs font-bold w-5 shrink-0 pt-0.5 text-[#74736F]">{o.label}</span>
            <span className="flex-1 text-sm leading-relaxed">{text(o.text_ru, o.text_kz)}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className={`${nav} bg-white border border-[#E2DED5]`}>
          {isKz ? 'Артқа' : 'Назад'}
        </button>
        {index < attempt.items.length - 1 ? (
          <button type="button" onClick={() => setIndex(index + 1)} className={`${nav} bg-[#171717] hover:bg-[#FF5A36] text-white`}>
            {isKz ? 'Келесі' : 'Дальше'}
          </button>
        ) : null}
        <button type="button" onClick={() => setConfirmSubmit(true)} className={`${nav} bg-[#FF5A36] hover:bg-[#E84D2B] text-white ml-auto`}>
          {isKz ? 'Тапсыру' : 'Сдать работу'}
        </button>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white border border-[#E2DED5] rounded-sm p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-extrabold">{isKz ? 'Жұмысты тапсыру керек пе?' : 'Сдать работу?'}</h2>
            <p className="text-sm text-[#74736F]">
              {isKz ? `Жауап берілген: ${answered} / ${attempt.total}.` : `Отвечено: ${answered} из ${attempt.total}.`}{' '}
              {isKz ? 'Тапсырғаннан кейін жауаптарды өзгерту мүмкін емес.' : 'После сдачи ответы изменить нельзя.'}
            </p>
            <div className="flex gap-3">
              <button type="button" disabled={busy} onClick={submit} className={`${nav} bg-[#171717] hover:bg-[#FF5A36] text-white`}>
                {busy ? '…' : isKz ? 'Тапсыру' : 'Сдать'}
              </button>
              <button type="button" onClick={() => setConfirmSubmit(false)} className={`${nav} bg-white border border-[#E2DED5]`}>
                {isKz ? 'Жалғастыру' : 'Продолжить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
  );
};
