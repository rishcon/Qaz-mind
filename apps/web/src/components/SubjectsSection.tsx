import React, { useState } from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { entSubjects } from '../content/questions';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SubjectsSectionProps {
  currentLang: Language;
}

export const SubjectsSection: React.FC<SubjectsSectionProps> = ({ currentLang }) => {
  const t = locales[currentLang];
  const isRu = currentLang === 'ru';
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>('history_kz');

  const mandatorySubjects = entSubjects.filter((s) => s.category === 'mandatory');
  const profileSubjects = entSubjects.filter((s) => s.category === 'profile');

  const toggleExpand = (id: string) => {
    setExpandedSubjectId((prev) => (prev === id ? null : id));
  };

  const renderSubject = (sub: (typeof entSubjects)[number]) => {
    const isExpanded = expandedSubjectId === sub.id;
    const tasksLabel = `${sub.examTasks} ${isRu ? 'заданий' : 'тапсырма'}`;
    const pointsLabel =
      sub.examPoints !== undefined ? ` · ${sub.examPoints} ${isRu ? 'баллов' : 'балл'}` : '';

    return (
      <div key={sub.id} className="group transition-colors hover:bg-white/80">
        <div
          onClick={() => toggleExpand(sub.id)}
          className="py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-baseline gap-4 md:gap-8">
            <span className="font-mono text-xs md:text-sm font-bold text-[#FF5A36]">{sub.code}</span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-[#171717] tracking-tight group-hover:text-[#FF5A36] transition-colors">
              {isRu ? sub.nameRu : sub.nameKz}
            </h3>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto pl-8 md:pl-0">
            <span className="font-mono text-xs text-[#171717]/60">
              {tasksLabel}
              {pointsLabel}
            </span>

            <div className="text-[#171717]/50 group-hover:text-[#171717]">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="pb-8 pl-8 md:pl-16 pr-4 animate-in fade-in duration-200">
            <div className="p-6 bg-white border border-[#D9D5CB]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#FF5A36] font-bold block mb-2">
                {isRu ? 'О содержании предмета' : 'Пән мазмұны туралы'}
              </span>
              <p className="text-sm md:text-base text-[#171717]/85 leading-relaxed font-normal">
                {isRu ? sub.descriptionRu : sub.descriptionKz}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="subjects" className="py-24 md:py-36 border-b border-[#D9D5CB] bg-[#F5F3EE]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.subjects.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        <div className="max-w-3xl mb-16 md:mb-20">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
            {t.subjects.headline}
          </h2>
        </div>

        {/* Part 1: Mandatory Subjects */}
        <div className="mb-16">
          <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-[#171717]">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
              {t.subjects.mandatoryHeading}
            </span>
            <span className="font-mono text-xs text-[#171717]/60">
              {mandatorySubjects.length} {isRu ? 'ОБЯЗАТЕЛЬНЫХ' : 'МІНДЕТТІ'}
            </span>
          </div>
          <div className="divide-y divide-[#D9D5CB] border-b border-[#D9D5CB]">
            {mandatorySubjects.map(renderSubject)}
          </div>
        </div>

        {/* Part 2: Profile Subjects */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-[#171717]">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
              {t.subjects.profileHeading}
            </span>
            <span className="font-mono text-xs text-[#171717]/60">
              {profileSubjects.length} {isRu ? 'ПРОФИЛЬНЫХ ДИСЦИПЛИН' : 'БЕЙІНДІК ПӘН'}
            </span>
          </div>
          <div className="divide-y divide-[#D9D5CB] border-b border-[#D9D5CB]">
            {profileSubjects.map(renderSubject)}
          </div>
        </div>
      </div>
    </section>
  );
};
