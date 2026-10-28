import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { locales } from '../../content/locales';
import { ENT_SUBJECTS } from '../../content/ent';
import { Reveal } from './Reveal';

/** The applicant takes this many profile subjects. */
const PROFILE_CHOICES = 2;

/** Counts from the previous value to the new one, so the total moves instead of jumping. */
const useCount = (target: number): number => {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      const next = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      current.current = next;
      setValue(next);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
};

/** Try the exam structure from the ENT specification: three mandatory subjects plus the two profile subjects you pick. */
export const ExamSection: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].build;
  const isRu = currentLang === 'ru';
  const name = (s: { nameRu: string; nameKz: string }) => (isRu ? s.nameRu : s.nameKz);

  const mandatory = ENT_SUBJECTS.filter((s) => s.category === 'mandatory');
  const profile = ENT_SUBJECTS.filter((s) => s.category === 'profile');
  const [chosen, setChosen] = useState<string[]>([]);

  const toggle = (id: string) =>
    setChosen((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return prev.length < PROFILE_CHOICES ? [...prev, id] : [...prev.slice(1), id];
    });

  const profileTasks = profile[0]?.examTasks ?? 0;
  const fullTotal = mandatory.reduce((sum, s) => sum + s.examTasks, 0) + PROFILE_CHOICES * profileTasks;
  const total = useCount(mandatory.reduce((sum, s) => sum + s.examTasks, 0) + chosen.length * profileTasks);

  const slots = Array.from({ length: PROFILE_CHOICES }, (_, i) => profile.find((s) => s.id === chosen[i]) ?? null);

  return (
    <section id="subjects" className="scroll-mt-20 py-20 md:py-32 border-t border-[#E2DED5]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Reveal>
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.label}</span>
          <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2 className="font-display font-extrabold tracking-tighter leading-[0.95] text-5xl md:text-7xl text-[#171717]">
              {t.title}
            </h2>
            <div className="font-display font-extrabold tracking-tighter leading-none text-[#171717] flex items-baseline gap-3">
              <span className="text-7xl md:text-8xl text-[#FF5A36] tabular-nums">{total}</span>
              <span className="text-base md:text-lg font-semibold text-[#171717]/60">
                {t.of} {fullTotal} {t.tasks}
              </span>
            </div>
          </div>
          <p className="mt-6 text-base text-[#5C574F]">{t.hint}</p>
        </Reveal>

        <Reveal delay={100} className="mt-8">
          <div className="flex flex-wrap gap-2">
            {profile.map((subject) => {
              const on = chosen.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(subject.id)}
                  className={`px-4 py-2.5 text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                    on
                      ? 'bg-[#FF5A36] border-[#FF5A36] text-white -translate-y-0.5'
                      : 'border-[#D9D5CB] text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  {name(subject)}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <div className="flex gap-1 h-24 md:h-32">
            {mandatory.map((subject) => (
              <div
                key={subject.id}
                style={{ flex: subject.examTasks }}
                className="min-w-0 bg-[#171717] text-white flex items-end p-2 md:p-3 font-mono text-xs font-bold"
              >
                {subject.examTasks}
              </div>
            ))}
            {slots.map((subject, i) => (
              <div
                key={i}
                style={{ flex: profileTasks }}
                className={`min-w-0 flex items-end p-2 md:p-3 font-mono text-xs font-bold transition-all duration-500 ${
                  subject ? 'bg-[#FF5A36] text-white' : 'border border-dashed border-[#FF5A36] text-[#FF5A36]'
                }`}
              >
                {subject ? profileTasks : '+'}
              </div>
            ))}
          </div>

          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-3">
            {mandatory.map((subject) => (
              <li key={subject.id} className="flex items-start gap-2 text-sm text-[#171717]">
                <span className="mt-1.5 w-2 h-2 bg-[#171717] shrink-0" />
                <span>
                  {name(subject)}
                  <span className="block font-mono text-[11px] text-[#78716C]">{t.mandatory}</span>
                </span>
              </li>
            ))}
            {slots.map((subject, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 w-2 h-2 bg-[#FF5A36] shrink-0" />
                <span key={subject?.id ?? 'empty'} className={subject ? 'text-[#171717] qm-swap' : 'text-[#A8A29E]'}>
                  {subject ? name(subject) : t.pick}
                  <span className="block font-mono text-[11px] text-[#78716C]">{t.profile}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-10 font-mono text-[11px] text-[#78716C]">{t.note}</p>
        </Reveal>
      </div>
    </section>
  );
};
