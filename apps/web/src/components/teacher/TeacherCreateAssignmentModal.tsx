import React, { useState } from 'react';
import { SchoolClass, AssignmentActivityType } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import { ArrowRight, CheckCircle2, Layers, BookOpen, PenTool, Award, Clock } from 'lucide-react';
import { ALL_SUBJECT_CURRICULA } from '../../content/curriculumData';

interface TeacherCreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedClasses: SchoolClass[];
  teacherUserId: string;
  teacherName: string;
  onAssignmentCreated: () => void;
}

export const TeacherCreateAssignmentModal: React.FC<TeacherCreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignedClasses,
  teacherUserId,
  teacherName,
  onAssignmentCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [selectedClassId, setSelectedClassId] = useState<string>(assignedClasses[0]?.id || '');
  const [activityType, setActivityType] = useState<AssignmentActivityType>('practice');
  const [subjectId, setSubjectId] = useState<string>('history_kz');
  const [topicId, setTopicId] = useState<string>('khanate-foundation');
  const [title, setTitle] = useState<string>('Проверочная работа: Казахское ханство');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [deadline, setDeadline] = useState<string>('2026-11-10');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [allowedAttempts, setAllowedAttempts] = useState<number>(2);

  if (!isOpen) return null;

  const currentSubjectCurriculum = ALL_SUBJECT_CURRICULA[subjectId];
  const selectedClass = assignedClasses.find((c) => c.id === selectedClassId) || assignedClasses[0];

  const handlePublish = () => {
    schoolService.createAssignment({
      organizationId: selectedClass.organizationId,
      classIds: [selectedClass.id],
      teacherId: teacherUserId,
      teacherName: teacherName || 'Преподаватель',
      title: title.trim(),
      subjectId,
      topicId,
      activityType,
      lessonId: activityType === 'lesson' ? 'lesson-khanate-foundation' : undefined,
      questionCount: activityType === 'lesson' ? 0 : questionCount,
      deadline,
      timeLimitMinutes: timeLimitMinutes > 0 ? timeLimitMinutes : undefined,
      allowedAttempts,
      status: 'published',
    });

    onAssignmentCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#D9D5CB] rounded p-6 md:p-8 max-w-xl w-full shadow-xl space-y-6">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2DED5]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#FF5A36]">
              ШАГ {step} ИЗ 5
            </span>
            <h2 className="text-lg font-black text-[#171717] tracking-tight">
              {step === 1 && 'Выберите класс'}
              {step === 2 && 'Выберите формат задания'}
              {step === 3 && 'Выберите предмет и тему'}
              {step === 4 && 'Настройки и срок сдачи'}
              {step === 5 && 'Проверка и публикация'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#74736F] hover:text-[#171717] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: Select Class */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#74736F]">
              Выберите один из ваших закрепленных классов для назначения задания:
            </p>
            <div className="space-y-2">
              {assignedClasses.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`w-full p-4 text-left border rounded transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                        : 'border-[#E2DED5] bg-[#FAF9F5] hover:border-[#171717]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#171717]">{cls.name}</div>
                      <div className="text-[11px] text-[#74736F]">{cls.academicYear}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF5A36]" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Далее</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Activity Type */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[#74736F]">Какой тип учебной активности требуется выполнить?</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActivityType('practice');
                  setTitle('Тематическая практика: Казахское ханство');
                }}
                className={`p-4 border rounded text-left transition-colors cursor-pointer ${
                  activityType === 'practice'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                    : 'border-[#E2DED5] bg-[#FAF9F5] hover:border-[#171717]'
                }`}
              >
                <PenTool className="w-4 h-4 text-[#FF5A36] mb-2" />
                <div className="font-bold text-[#171717]">Практика по теме</div>
                <div className="text-[10px] text-[#74736F] mt-1">
                  Набор вопросов с мгновенной проверкой
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType('lesson');
                  setTitle('Изучение урока: Образование Казахского ханства');
                }}
                className={`p-4 border rounded text-left transition-colors cursor-pointer ${
                  activityType === 'lesson'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                    : 'border-[#E2DED5] bg-[#FAF9F5] hover:border-[#171717]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#171717] mb-2" />
                <div className="font-bold text-[#171717]">Изучить урок</div>
                <div className="text-[10px] text-[#74736F] mt-1">
                  Теоретический конспект и тест
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType('test');
                  setTitle('Контрольный срез по теме');
                }}
                className={`p-4 border rounded text-left transition-colors cursor-pointer ${
                  activityType === 'test'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                    : 'border-[#E2DED5] bg-[#FAF9F5] hover:border-[#171717]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#258568] mb-2" />
                <div className="font-bold text-[#171717]">Тематический тест</div>
                <div className="text-[10px] text-[#74736F] mt-1">Ограничение по времени</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityType('mock_exam');
                  setTitle('Пробное ЕНТ (симулятор)');
                }}
                className={`p-4 border rounded text-left transition-colors cursor-pointer ${
                  activityType === 'mock_exam'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                    : 'border-[#E2DED5] bg-[#FAF9F5] hover:border-[#171717]'
                }`}
              >
                <Award className="w-4 h-4 text-purple-600 mb-2" />
                <div className="font-bold text-[#171717]">Пробное ЕНТ</div>
                <div className="text-[10px] text-[#74736F] mt-1">Полный экзаменационный формат</div>
              </button>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-[#EAE7DF] text-[#171717] text-xs font-semibold rounded cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Далее</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Content Selection */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                Название задания
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Учебный предмет
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D9D5CB] rounded font-semibold text-[#171717]"
                >
                  <option value="history_kz">История Казахстана</option>
                  <option value="math_lit">Математическая грамотность</option>
                  <option value="reading_lit">Грамотность чтения</option>
                  <option value="math_prof">Математика (профильная)</option>
                  <option value="physics">Физика</option>
                  <option value="biology">Биология</option>
                  <option value="chemistry">Химия</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Количество вопросов
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  disabled={activityType === 'lesson'}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D9D5CB] rounded font-semibold text-[#171717]"
                >
                  <option value={5}>5 вопросов</option>
                  <option value={10}>10 вопросов</option>
                  <option value={15}>15 вопросов</option>
                  <option value={20}>20 вопросов</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-[#EAE7DF] text-[#171717] text-xs font-semibold rounded cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Далее</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Settings & Deadline */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                Срок сдачи (дедлайн)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Ограничение по времени
                </label>
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D9D5CB] rounded"
                >
                  <option value={10}>10 минут</option>
                  <option value={15}>15 минут</option>
                  <option value={20}>20 минут</option>
                  <option value={45}>45 минут</option>
                  <option value={0}>Без таймера</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Разрешено попыток
                </label>
                <select
                  value={allowedAttempts}
                  onChange={(e) => setAllowedAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D9D5CB] rounded"
                >
                  <option value={1}>1 попытка</option>
                  <option value={2}>2 попытки</option>
                  <option value={3}>3 попытки</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-[#EAE7DF] text-[#171717] text-xs font-semibold rounded cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-5 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>К проверке</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Publish */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#FAF9F5] border border-[#D9D5CB] rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-[#74736F]">Класс:</span>
                <strong className="text-[#171717]">{selectedClass.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74736F]">Название:</span>
                <strong className="text-[#171717]">{title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74736F]">Формат:</span>
                <strong className="text-[#171717] uppercase">{activityType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74736F]">Вопросов:</span>
                <strong className="text-[#171717]">{questionCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74736F]">Срок сдачи:</span>
                <strong className="text-[#FF5A36]">до {deadline}</strong>
              </div>
            </div>

            <p className="text-[11px] text-[#74736F]">
              После публикации задание немедленно отобразится в личных кабинетах всех учащихся класса{' '}
              <strong>{selectedClass.name}</strong>.
            </p>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-[#EAE7DF] text-[#171717] text-xs font-semibold rounded cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-2.5 bg-[#258568] hover:bg-[#1f6e56] text-white text-xs font-bold rounded cursor-pointer shadow-xs"
              >
                ✓ Опубликовать задание
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
