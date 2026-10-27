import React, { useState } from 'react';
import { Language } from '../../types';
import {
  DashboardView,
  StudentStateType,
  StudentProfile,
  DailyTask,
} from '../../types/dashboard';
import { SchoolAssignment } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  PenTool,
  AlertCircle,
  Play,
  Building,
  Plus,
} from 'lucide-react';

interface TodayViewProps {
  currentLang: Language;
  studentState: StudentStateType;
  profile: StudentProfile;
  dailyTasks: DailyTask[];
  completedLessonsCount: number;
  mistakesCount: number;
  studentAffiliation?: { schoolName: string; className: string } | null;
  schoolAssignments?: SchoolAssignment[];
  onToggleTask: (taskId: string) => void;
  onStartLesson: (lessonId: string, subjectId: string) => void;
  onStartPractice: (subjectId: string) => void;
  onStartExam: () => void;
  onNavigateMistakes: () => void;
  onStartSchoolAssignment?: (asg: SchoolAssignment) => void;
  onJoinClassByCode?: (code: string) => { success: boolean; message: string };
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentLang,
  studentState,
  profile,
  dailyTasks,
  completedLessonsCount,
  mistakesCount,
  studentAffiliation,
  schoolAssignments = [],
  onToggleTask,
  onStartLesson,
  onStartPractice,
  onStartExam,
  onNavigateMistakes,
  onStartSchoolAssignment,
  onJoinClassByCode,
}) => {
  const isNew = studentState === 'new' && completedLessonsCount === 0;

  // Join class modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    if (onJoinClassByCode) {
      const res = onJoinClassByCode(joinCodeInput.trim());
      if (res.success) {
        setJoinSuccess(res.message);
        setJoinError('');
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setJoinSuccess('');
          setJoinCodeInput('');
        }, 1500);
      } else {
        setJoinError(res.message);
      }
    }
  };

  const allResults = schoolService.getAllResults();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header with School Affiliation Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
            {currentLang === 'kz' ? `Сәлем, ${profile.name}` : `Привет, ${profile.name}`}
          </h1>
          <p className="mt-1 text-sm md:text-base text-[#74736F]">
            {currentLang === 'kz' ? 'Дайындықты жалғастырамыз ба?' : 'Продолжим подготовку?'}
          </p>
        </div>

        {/* Affiliation Indicator */}
        {studentAffiliation ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D9D5CB] rounded text-xs">
            <Building className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span className="font-bold text-[#171717]">{studentAffiliation.schoolName}</span>
            <span className="text-[#74736F]">·</span>
            <span className="font-mono font-bold text-[#FF5A36]">{studentAffiliation.className}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D9D5CB] hover:border-[#171717] rounded text-xs font-semibold text-[#171717] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Присоединиться к классу</span>
          </button>
        )}
      </div>

      {/* Main Focus Card: Most prominent element */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs">
        {isNew ? (
          /* New Student Baseline State */
          <div className="space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
              Первый шаг
            </span>
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
                {currentLang === 'kz' ? 'Бірінші сабақтан бастаңыз' : 'Начни с первого урока'}
              </h2>
              <p className="text-xs md:text-sm text-[#74736F] mt-1.5 leading-relaxed">
                Пошаговый разбор темы «Образование Казахского ханства (1465 г.)» с опорными фактами и проверочным заданием.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onStartLesson('lesson-khanate-foundation', 'history_kz')}
                className="px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm"
              >
                <span>Начать обучение</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onStartPractice('history_kz')}
                className="px-5 py-3 bg-white border border-[#E2DED5] hover:border-[#171717] text-[#171717] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm"
              >
                Пройти диагностику (5 вопросов)
              </button>
            </div>
          </div>
        ) : (
          /* Active Student Continuing Education */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Продолжить обучение
                </span>
                <span className="text-[#E2DED5]">·</span>
                <span className="text-xs font-mono text-[#74736F]">
                  История Казахстана
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#171717]">
                Образование Казахского ханства (1465 г.)
              </h2>
              <div className="flex items-center gap-4 text-xs font-mono text-[#74736F] pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FF5A36]" /> ~8 минут
                </span>
                <span>Шаг 2 из 3</span>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onStartLesson('lesson-khanate-foundation', 'history_kz')}
                className="w-full md:w-auto px-6 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
              >
                <span>Продолжить</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* School Assignments Section (When Enrolled) */}
      {schoolAssignments.length > 0 && (
        <div className="bg-white border border-[#D9D5CB] p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DED5] pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FF5A36]" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
                Задания от школы ({schoolAssignments.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-[#74736F]">
              {studentAffiliation?.schoolName || 'Лицей №28'}
            </span>
          </div>

          <div className="space-y-3">
            {schoolAssignments.map((asg) => {
              const myResult = allResults.find((r) => r.assignmentId === asg.id);

              return (
                <div
                  key={asg.id}
                  className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#FF5A36]">
                        {asg.title}
                      </span>
                      {myResult && (
                        <span className="px-2 py-0.5 bg-[#258568]/10 text-[#258568] font-mono text-[10px] font-bold rounded">
                          Сдано: {myResult.score}/{myResult.total}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#74736F] mt-1">
                      Учитель: {asg.teacherName} · Срок: до {asg.deadline} · {asg.questionCount > 0 ? `${asg.questionCount} вопросов` : 'Урок'}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartSchoolAssignment && onStartSchoolAssignment(asg)}
                      className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] text-white text-xs font-bold rounded transition-colors cursor-pointer"
                    >
                      {myResult ? 'Пройти повторно' : 'Начать'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Daily Plan (Left) & Compact Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Today Tasks: 2-3 Clickable Items (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white border border-[#E2DED5] p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#E2DED5] pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
              {currentLang === 'kz' ? 'Бүгінгі жоспар' : 'Сегодня'}
            </h3>
            <span className="text-xs font-mono text-[#74736F]">3 активности</span>
          </div>

          <div className="space-y-3">
            {/* Task 1 */}
            <div
              onClick={() => onStartLesson('lesson-khanate-foundation', 'history_kz')}
              className="p-3.5 border border-[#E2DED5] hover:border-[#171717] rounded transition-all cursor-pointer flex items-center justify-between bg-[#FAF8F5] hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#FF5A36]">01</span>
                <div>
                  <div className="font-bold text-xs text-[#171717]">
                    История Казахстана · Изучить тему
                  </div>
                  <div className="text-[11px] text-[#74736F] mt-0.5">
                    Образование Казахского ханства (1465 г.)
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#74736F] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 8 мин.
              </span>
            </div>

            {/* Task 2 */}
            <div
              onClick={() => onStartPractice('math_lit')}
              className="p-3.5 border border-[#E2DED5] hover:border-[#171717] rounded transition-all cursor-pointer flex items-center justify-between bg-[#FAF8F5] hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#FF5A36]">02</span>
                <div>
                  <div className="font-bold text-xs text-[#171717]">
                    Матграмотность · Решить 5 вопросов
                  </div>
                  <div className="text-[11px] text-[#74736F] mt-0.5">
                    Проценты, пропорции и смеси
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#74736F] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 7 мин.
              </span>
            </div>

            {/* Task 3 */}
            <div
              onClick={onNavigateMistakes}
              className="p-3.5 border border-[#E2DED5] hover:border-[#171717] rounded transition-all cursor-pointer flex items-center justify-between bg-[#FAF8F5] hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#FF5A36]">03</span>
                <div>
                  <div className="font-bold text-xs text-[#171717]">
                    Повторение · Разобрать ошибки
                  </div>
                  <div className="text-[11px] text-[#74736F] mt-0.5">
                    {mistakesCount > 0 ? `${mistakesCount} нерешенных вопроса` : 'Все ошибки разобраны'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#74736F] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#FF5A36]" /> {mistakesCount} вопр.
              </span>
            </div>
          </div>
        </div>

        {/* Compact Progress (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white border border-[#E2DED5] p-6 rounded-sm shadow-xs space-y-4">
          <div className="border-b border-[#E2DED5] pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
              Прогресс
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                Моя цель
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">
                {profile.targetScore} <span className="text-sm font-normal text-[#74736F]">/ 140</span>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                Изучено тем
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">
                {completedLessonsCount}
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#E2DED5] rounded">
              <span className="text-[11px] font-mono text-[#74736F] uppercase tracking-wider block">
                Повторить
              </span>
              <div className="text-2xl font-black font-mono text-[#171717] mt-0.5">
                {mistakesCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Class Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D5CB] rounded p-6 max-w-md w-full shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#171717]">Присоединиться к классу</h2>
            <p className="text-xs text-[#74736F]">
              Введите 6-значный код класса, полученный от вашего учителя (например, <strong>QM-28A1</strong>).
              Все ваши личные темы и прогресс сохранятся.
            </p>

            {joinError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {joinError}
              </div>
            )}

            {joinSuccess && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded font-bold">
                {joinSuccess}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Код класса
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="QM-XXXX"
                  maxLength={8}
                  className="w-full px-3.5 py-2.5 font-mono text-center text-lg uppercase tracking-wider bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 bg-[#EAE7DF] text-[#171717] font-semibold rounded hover:bg-[#D9D5CB] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF5A36] text-white font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs"
                >
                  Присоединиться
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
