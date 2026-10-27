import React, { useState } from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import { OFFICIAL_PROFILE_PAIRS } from '../../types/auth';
import { ALL_SUBJECT_CURRICULA, SubjectContent } from '../../content/curriculumData';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Play,
  Layers,
} from 'lucide-react';

interface SubjectsViewProps {
  currentLang: Language;
  profile: StudentProfile;
  completedLessonIds: string[];
  onNavigateToLesson: (lessonId: string, subjectId: string) => void;
  onNavigateToPractice: (subjectId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  currentLang,
  profile,
  completedLessonIds,
  onNavigateToLesson,
  onNavigateToPractice,
}) => {
  // Find user's selected official pair
  const currentPair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === profile.profilePairId) || OFFICIAL_PROFILE_PAIRS[0];

  // The 5 active subjects for this student
  const activeSubjectIds = [
    'history_kz',
    'math_lit',
    'reading_lit',
    currentPair.subjectIds[0],
    currentPair.subjectIds[1],
  ];

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('history_kz');
  const [openChapterId, setOpenChapterId] = useState<string>('');

  const currentSubjectCurriculum: SubjectContent =
    ALL_SUBJECT_CURRICULA[selectedSubjectId] || ALL_SUBJECT_CURRICULA['history_kz'];

  const toggleChapter = (chapterId: string) => {
    setOpenChapterId((prev) => (prev === chapterId ? '' : chapterId));
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

      {/* 5 Subjects Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {activeSubjectIds.map((subId) => {
          const sub = ALL_SUBJECT_CURRICULA[subId] || {
            id: subId,
            code: '00',
            nameRu: subId,
            nameKz: subId,
            category: 'profile',
            totalQuestions: 1000,
            totalTopics: 30,
            chapters: [],
          };

          const isSelected = selectedSubjectId === subId;
          const isMandatory = ['history_kz', 'math_lit', 'reading_lit'].includes(subId);

          return (
            <button
              key={subId}
              type="button"
              onClick={() => {
                setSelectedSubjectId(subId);
                setOpenChapterId('');
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
                  {currentLang === 'kz' ? sub.nameKz : sub.nameRu}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E2DED5] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#74736F]">
                  {sub.totalTopics} тем
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
              {currentLang === 'kz' ? currentSubjectCurriculum.nameKz : currentSubjectCurriculum.nameRu}
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

        {/* Chapters list */}
        {currentSubjectCurriculum.chapters.length > 0 ? (
          <div className="space-y-4">
            {currentSubjectCurriculum.chapters.map((chapter) => {
              const isOpen = openChapterId === chapter.id || currentSubjectCurriculum.chapters.length === 1;

              return (
                <div key={chapter.id} className="border border-[#E2DED5] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full p-4 text-left bg-[#FAF8F5] hover:bg-[#F5F3EE] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#171717]">
                        {currentLang === 'kz' ? chapter.titleKz : chapter.titleRu}
                      </h3>
                      <span className="text-xs font-mono text-[#74736F] mt-0.5 block">
                        Уроков: {chapter.lessons.length}
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
                      {chapter.lessons.map((lesson) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            className="p-4 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                          >
                            <div className="flex items-center gap-3 pr-4">
                              <span className="font-mono text-xs text-[#74736F] font-bold w-6">
                                {lesson.number}
                              </span>
                              <div>
                                <h4 className="text-sm font-semibold text-[#171717]">
                                  {currentLang === 'kz' ? lesson.titleKz : lesson.titleRu}
                                </h4>
                                <span className="text-[11px] font-mono text-[#74736F] mt-0.5 block">
                                  {lesson.duration}
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
                                onClick={() => onNavigateToLesson(lesson.id, selectedSubjectId)}
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
        ) : (
          <div className="p-8 text-center bg-[#FAF8F5] border border-[#E2DED5] rounded text-xs text-[#74736F]">
            Учебные материалы по выбранному предмету готовятся методистами.
          </div>
        )}
      </div>
    </div>
  );
};
