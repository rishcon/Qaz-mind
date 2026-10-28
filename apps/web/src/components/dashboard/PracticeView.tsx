import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { DashboardView } from '../../types/dashboard';
import { ApiPracticeSubject, ApiSubject, learningApi, practiceApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { ArrowRight } from 'lucide-react';

interface PracticeViewProps {
  currentLang: Language;
  /** Subject chosen on the subjects screen, if the student came from there. */
  initialSubjectId?: string;
  onNavigate: (view: DashboardView) => void;
  /** Called with the id of a session the server has created. */
  onStarted: (sessionId: string) => void;
}

const COUNTS = [5, 10, 20];

/**
 * Practice runs on published questions from the bank. The server picks the questions; nothing is shown here
 * until the bank has published questions for a subject.
 */
export const PracticeView: React.FC<PracticeViewProps> = ({ currentLang, initialSubjectId, onNavigate, onStarted }) => {
  const isKz = currentLang === 'kz';
  const [available, setAvailable] = useState<ApiPracticeSubject[] | null>(null);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loadError, setLoadError] = useState('');
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? '');
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    Promise.all([practiceApi.subjects(), learningApi.listSubjects()])
      .then(([counts, list]) => {
        setAvailable(counts);
        setSubjects(list);
        setSubjectId((current) =>
          counts.some((c) => c.subject_id === current) ? current : (counts[0]?.subject_id ?? ''),
        );
      })
      .catch((err) => setLoadError(errorText(err)));
  }, []);

  const title = (id: string) => {
    const s = subjects.find((item) => item.id === id);
    return s ? (isKz ? s.title_kz : s.title_ru) : id;
  };
  const selected = available?.find((c) => c.subject_id === subjectId);
  const maxCount = selected ? Math.min(count, selected.available) : count;

  const start = async () => {
    if (!selected || starting) return;
    setStarting(true);
    setStartError('');
    try {
      const session = await practiceApi.start(selected.subject_id, count);
      onStarted(session.id);
    } catch (err) {
      setStartError(errorText(err));
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">Практика</h1>
        <p className="mt-1 text-sm text-[#74736F]">
          {isKz
            ? 'Өтілген тақырыптарды ҰБТ тапсырмаларында бекітіңіз.'
            : 'Закрепляйте пройденные темы на заданиях ЕНТ.'}
        </p>
      </div>

      {loadError && (
        <div role="alert" className="max-w-2xl p-4 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {loadError}
        </div>
      )}

      {available === null && !loadError && <p className="font-mono text-xs text-[#74736F]">Загрузка…</p>}

      {available !== null && available.length === 0 && (
        <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF5A36] font-bold">
            {isKz ? 'Әзірге қолжетімсіз' : 'Пока недоступно'}
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
            {isKz ? 'Жарияланған тапсырмалар жоқ' : 'Опубликованных заданий пока нет'}
          </h2>
          <p className="text-xs md:text-sm text-[#74736F] leading-relaxed">
            {isKz
              ? 'Практика тексерілген сұрақтар банкінен алынады. Банкте жарияланған тапсырмалар жоқ болса, сессия іске қосылмайды.'
              : 'Задания для практики берутся из банка проверенных вопросов. Пока в банке нет опубликованных заданий, сессия не запускается.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="px-5 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span>{isKz ? 'Пәндерге' : 'К предметам'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {available !== null && available.length > 0 && (
        <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#74736F] font-bold mb-2.5">
              {isKz ? 'Пән' : 'Предмет'}
            </div>
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button
                  key={c.subject_id}
                  type="button"
                  onClick={() => setSubjectId(c.subject_id)}
                  aria-pressed={c.subject_id === subjectId}
                  className={`px-3.5 py-2 text-xs font-bold border rounded-sm cursor-pointer transition-colors ${
                    c.subject_id === subjectId
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#171717] border-[#E2DED5] hover:border-[#FF5A36]'
                  }`}
                >
                  {title(c.subject_id)}
                  <span className="ml-2 font-mono font-normal opacity-60">{c.available}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#74736F] font-bold mb-2.5">
              {isKz ? 'Тапсырма саны' : 'Количество заданий'}
            </div>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={n === count}
                  className={`w-14 py-2 text-xs font-mono font-bold border rounded-sm cursor-pointer transition-colors ${
                    n === count
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#171717] border-[#E2DED5] hover:border-[#FF5A36]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {selected && selected.available < count && (
              <p className="mt-2 text-[11px] text-[#74736F]">
                {isKz
                  ? `Бұл пән бойынша ${selected.available} тапсырма ғана бар.`
                  : `По этому предмету пока ${selected.available} заданий, будет ${maxCount}.`}
              </p>
            )}
          </div>

          {startError && (
            <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
              {startError}
            </div>
          )}

          <button
            type="button"
            onClick={start}
            disabled={!selected || starting}
            className="px-6 py-3 bg-[#FF5A36] hover:bg-[#E84D2B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
          >
            <span>{starting ? '…' : isKz ? 'Бастау' : 'Начать практику'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
