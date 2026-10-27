import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import { OFFICIAL_PROFILE_PAIRS } from '../../types/auth';
import { ApiCurriculum, ApiSubject, learningApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';

interface SubjectsViewProps {
  currentLang: Language;
  profile: StudentProfile;
  onNavigateToLesson: (lessonSlug: string, subjectId: string) => void;
  onNavigateToPractice: (subjectId: string) => void;
}

const MANDATORY_IDS = ['history_kz', 'math_lit', 'reading_lit'];

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  currentLang,
  profile,
  onNavigateToLesson,
  onNavigateToPractice,
}) => {
  // Find user's selected official pair
  const currentPair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === profile.profilePairId) || OFFICIAL_PROFILE_PAIRS[0];

  // The 5 active subjects for this student
  const activeSubjectIds = [...MANDATORY_IDS, currentPair.subjectIds[0], currentPair.subjectIds[1]];

  const [subjects, setSubjects] = useState<ApiSubject[] | null>(null);
  const [subjectsError, setSubjectsError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('history_kz');
  const [curriculum, setCurriculum] = useState<ApiCurriculum | null>(null);
  const [curriculumError, setCurriculumError] = useState('');
  const [openChapterSlug, setOpenChapterSlug] = useState<string>('');

  useEffect(() => {
    learningApi
      .listSubjects()
      .then(setSubjects)
      .catch((err) => setSubjectsError(errorText(err)));
  }, []);

  // Progress is read from the server on every visit, so a finished lesson shows up after a reload.
  useEffect(() => {
    let cancelled = false;
    setCurriculum(null);
    setCurriculumError('');
    learningApi
      .curriculum(selectedSubjectId)
      .then((data) => {
        if (!cancelled) setCurriculum(data);
      })
      .catch((err) => {
        if (!cancelled) setCurriculumError(errorText(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectId]);

  const shownSubjects = (subjects ?? []).filter((s) => activeSubjectIds.includes(s.id));
  const selectedSubject = subjects?.find((s) => s.id === selectedSubjectId);
  const toggleChapter = (slug: string) => {
    setOpenChapterSlug((prev) => (prev === slug ? '' : slug));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Менің пәндерім' : 'Мои предметы'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          3 обязательных предмета + {currentPair.titleRu} ({currentPair.clusterRu})
        </p>
      </div>

      {subjectsError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{subjectsError}</div>
      )}

      {/* 5 Subjects Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {subjects === null && !subjectsError &&
          activeSubjectIds.map((subId) => (
            <div key={subId} className="p-4 border border-[#E2DED5] bg-white rounded h-[92px] animate-pulse" />
          ))}
        {shownSubjects.map((sub) => {
          const isSelected = selectedSubjectId === sub.id;
          const isMandatory = MANDATORY_IDS.includes(sub.id);

          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelectedSubjectId(sub.id);
                setOpenChapterSlug('');
              }}
              className={`p-4 text-left border rounded transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#FF5A36] bg-white ring-2 ring-[#FF5A36]/20'
                  : 'border-[#E2DED5] bg-white hover:border-[#171717]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#74736F] mb-1">
                  <span>{isMandatory ? 'Обязательный' : 'Профильный'}</span>
                </div>
                <h3 className="font-bold text-sm text-[#171717] line-clamp-1">
                  {currentLang === 'kz' ? sub.title_kz : sub.title_ru}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E2DED5] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#74736F]">
                  {sub.published_lessons > 0 ? `Уроков: ${sub.published_lessons}` : 'Скоро'}
                </span>
                <span className={`text-xs font-bold ${isSelected ? 'text-[#FF5A36]' : 'text-[#171717]'}`}>
                  {isSelected ? 'Выбран' : 'Открыть'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Syllabus for Selected Subject */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DED5] pb-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF5A36]">
              Учебная программа дисциплины
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#171717] mt-0.5">
              {selectedSubject
                ? currentLang === 'kz' ? selectedSubject.title_kz : selectedSubject.title_ru
                : '…'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToPractice(selectedSubjectId)}
            className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Практика по предмету</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {curriculumError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{curriculumError}</div>
        )}

        {!curriculumError && curriculum === null && (
          <div className="p-8 text-center text-xs font-mono text-[#74736F]">Загрузка программы…</div>
        )}

        {curriculum && curriculum.topics.length > 0 && (
          <div className="space-y-4">
            {curriculum.topics.map((topic) => {
              const isOpen = openChapterSlug === topic.slug || curriculum.topics.length === 1;

              return (
                <div key={topic.slug} className="border border-[#E2DED5] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleChapter(topic.slug)}
                    className="w-full p-4 text-left bg-[#FAF8F5] hover:bg-[#F5F3EE] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#171717]">
                        {currentLang === 'kz' ? topic.title_kz : topic.title_ru}
                      </h3>
                      <span className="text-xs font-mono text-[#74736F] mt-0.5 block">
                        Уроков: {topic.lessons.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#74736F]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#74736F]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-[#E2DED5] bg-white">
                      {topic.lessons.map((lesson, index) => {
                        const isCompleted = lesson.progress.state === 'completed';

                        return (
                          <div
                            key={lesson.slug}
                            className="p-4 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                          >
                            <div className="flex items-center gap-3 pr-4">
                              <span className="font-mono text-xs text-[#74736F] font-bold w-6">{index + 1}</span>
                              <div>
                                <h4 className="text-sm font-semibold text-[#171717]">
                                  {currentLang === 'kz' ? lesson.title_kz : lesson.title_ru}
                                </h4>
                                <span className="text-[11px] font-mono text-[#74736F] mt-0.5 block">
                                  {lesson.estimated_minutes} мин
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isCompleted && (
                                <span className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Пройден</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => onNavigateToLesson(lesson.slug, selectedSubjectId)}
                                className="px-3 py-1.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold transition-colors cursor-pointer rounded-xs flex items-center gap-1"
                              >
                                <span>{isCompleted ? 'Повторить' : 'Открыть'}</span>
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {curriculum && curriculum.topics.length === 0 && (
          <div className="p-8 text-center bg-[#FAF8F5] border border-[#E2DED5] rounded text-xs text-[#74736F]">
            Учебные материалы по выбранному предмету готовятся методистами.
          </div>
        )}
      </div>
    </div>
  );
};
