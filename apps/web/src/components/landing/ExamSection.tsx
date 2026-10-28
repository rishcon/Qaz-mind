import React from 'react';
import { Language, SubjectItem } from '../../types';
import { locales } from '../../content/locales';
import { ENT_SUBJECTS } from '../../content/ent';
import { Reveal } from './Reveal';

/** The applicant chooses this many profile subjects. */
const PROFILE_CHOICES = 2;

/** Exam structure from the ENT specification: three mandatory subjects, then the profile subjects the applicant chooses. */
export const ExamSection: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const t = locales[currentLang].exam;
  const isRu = currentLang === 'ru';
  const name = (subject: SubjectItem) => (isRu ? subject.nameRu : subject.nameKz);

  // Every profile subject has the same number of tasks in the specification, so one of them sets the profile segments.
  const profileTasks = ENT_SUBJECTS.find((s) => s.category === 'profile')?.examTasks ?? 0;
  const segments = [
    ...ENT_SUBJECTS.filter((s) => s.category === 'mandatory').map((s) => ({
      key: s.id,
      tasks: s.examTasks,
      profile: false,
    })),
    ...Array.from({ length: PROFILE_CHOICES }, (_, i) => ({
      key: `profile-${i}`,
      tasks: profileTasks,
      profile: true,
    })),
  ];

  return (
    <section id="subjects" className="scroll-mt-24 py-16 md:py-32 border-t border-[#E2DED5]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{t.label}</span>
              <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.98] font-display text-[#171717]">
                {t.title}
              </h2>
            </div>
            <p className="lg:col-span-5 text-base text-[#5C574F] leading-relaxed">{t.caption}</p>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-14">
          <div className="flex h-16 border border-[#171717] shadow-[6px_6px_0px_#171717]" aria-hidden="true">
            {segments.map((segment, index) => (
              <div
                key={segment.key}
                style={{ flex: segment.tasks }}
                className={`min-w-0 flex items-center justify-center font-mono text-xs font-bold text-white ${
                  segment.profile ? 'bg-[#FF5A36]' : 'bg-[#171717]'
                } ${index ? 'border-l border-[#F5F3EE]/40' : ''}`}
              >
                {segment.tasks}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-6 text-xs text-[#5C574F]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#171717]" />
              {t.mandatory}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF5A36]" />
              {t.profile}
            </span>
          </div>
        </Reveal>

        <Reveal delay={160} className="mt-10 md:mt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DED5]">
            {ENT_SUBJECTS.map((subject) => (
              <div
                key={subject.id}
                className="min-w-0 p-5 md:p-6 border-r border-b border-[#E2DED5] flex flex-col gap-4 md:gap-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#A8A29E]">{subject.code}</span>
                  <span className={`w-2.5 h-2.5 ${subject.category === 'mandatory' ? 'bg-[#171717]' : 'bg-[#FF5A36]'}`} />
                </div>
                <div className="font-display text-lg font-bold leading-snug text-[#171717]">{name(subject)}</div>
                <div className="mt-auto font-mono text-[11px] text-[#78716C]">
                  {subject.examTasks} {t.tasks}
                  {subject.examPoints ? ` · ${subject.examPoints} ${t.points}` : ''}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-8 flex items-center gap-2 font-mono text-[11px] text-[#78716C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
            {t.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
};
