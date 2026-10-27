import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ExamItem, ExamSpecification } from '../../types';
import { adminService } from '../../services/adminService';
import { ActionResultNotice, failureResult, type ActionResult } from '../ui/ConnectionNotice';
import { FullscreenExamPreview } from './FullscreenExamPreview';
import { subjectNameRu } from '../../constants/subjects';

interface ExamBuilderProps {
  initialExam?: ExamItem;
  onSave: (exam: ExamItem) => void;
  onCancel: () => void;
}

/**
 * The builder needs at least one specification version, and those come from the server.
 * Without them nothing can be built, so the screen says so instead of inventing a specification.
 */
export const ExamBuilder: React.FC<ExamBuilderProps> = (props) => {
  const specs = adminService.getExamSpecifications();
  if (specs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E2DED5]">
          <button onClick={props.onCancel} className="p-1.5 rounded-md hover:bg-[#EBE8E0] text-[#78716C] cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <h1 className="text-lg font-bold text-[#171717]">Конструктор экзамена</h1>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DED5] p-8 text-center text-xs text-[#78716C] leading-relaxed">
          Конструктор недоступен: версии экзаменационной спецификации загружаются с сервера администрирования, который
          ещё не подключён. Спецификация не задаётся здесь вручную.
        </div>
      </div>
    );
  }
  return <ExamBuilderForm {...props} specs={specs} />;
};

interface ExamBuilderFormProps extends ExamBuilderProps {
  specs: ExamSpecification[];
}

const ExamBuilderForm: React.FC<ExamBuilderFormProps> = ({ initialExam, onSave, onCancel, specs }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);

  // Specification version (from the server)
  const [selectedSpecId, setSelectedSpecId] = useState(initialExam?.specificationId || specs[0].id);
  const activeSpec = specs.find((s) => s.id === selectedSpecId) || specs[0];

  // Metadata: empty until the author fills them in
  const [titleRu, setTitleRu] = useState(initialExam?.titleRu || '');
  const [titleKz, setTitleKz] = useState(initialExam?.titleKz || '');
  const [examType, setExamType] = useState<ExamItem['type']>(initialExam?.type || 'official_mock');
  const [durationMinutes, setDurationMinutes] = useState(initialExam?.durationMinutes || activeSpec.durationMinutes);
  // The passing score is part of the scale and has no default: the author sets it, and saving needs it.
  const [passingScore, setPassingScore] = useState<number | null>(initialExam?.passingScore ?? null);
  const [result, setResult] = useState<ActionResult | null>(null);

  // Subject selection & Profile pair
  const [profilePairIndex, setProfilePairIndex] = useState(0);
  const activeProfileConfig = activeSpec.profileSubjectConfigs[profilePairIndex];

  // Question IDs
  const allVerifiedQuestions = adminService.getQuestions().filter((q) => q.status === 'published' || q.status === 'approved');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    initialExam?.questionIds || allVerifiedQuestions.map((q) => q.id)
  );

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((item) => item !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleAutoFillQuestions = () => {
    setSelectedQuestionIds(allVerifiedQuestions.map((q) => q.id));
  };

  const buildExamObject = (status: ExamItem['status'], score: number): ExamItem => {
    return {
      id: initialExam?.id || `ex-${Date.now().toString(36)}`,
      titleRu,
      titleKz,
      specificationId: selectedSpecId,
      year: activeSpec.year,
      version: (initialExam?.version || 0) + 1,
      type: examType,
      // The number of questions is what the author selected, never the specification's target.
      questionCount: selectedQuestionIds.length,
      maxScore: activeSpec.maxScore,
      durationMinutes,
      status,
      selectedSubjectIds: [
        ...activeSpec.mandatorySubjectConfigs.map((config) => config.subjectId),
        activeProfileConfig.subject1Id,
        activeProfileConfig.subject2Id,
      ],
      questionIds: selectedQuestionIds,
      passingScore: score,
      attemptsCount: initialExam?.attemptsCount || 0,
      publishedAt: status === 'published' ? new Date().toISOString() : initialExam?.publishedAt,
    };
  };

  const saveExam = (status: ExamItem['status']) => {
    if (passingScore === null) {
      setResult({ tone: 'error', text: 'Экзамен не сохранён: задайте пороговый балл на шаге «Шкала оценивания».' });
      return;
    }
    const exam = buildExamObject(status, passingScore);
    try {
      adminService.saveExam(exam);
      onSave(exam);
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  const handlePublish = () => saveExam('published');

  const handleSaveDraft = () => saveExam('draft');

  const steps = [
    { num: 1, label: 'Метаданные' },
    { num: 2, label: 'Регламент ЕНТ' },
    { num: 3, label: 'Предметы и профили' },
    { num: 4, label: 'Банк вопросов' },
    { num: 5, label: 'Шкала оценивания' },
    { num: 6, label: 'Проверка и предпросмотр' },
    { num: 7, label: 'Публикация' },
  ];

  return (
    <div className="space-y-6">
      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-[#EBE8E0] text-[#78716C] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#171717]">
              {initialExam ? `Редактирование экзамена #${initialExam.id}` : 'Интерактивный конструктор экзамена ЕНТ'}
            </h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              Сборка варианта тестирования по официальной спецификации с верификацией вопросов.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFullscreenPreviewOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#FF5A36]" /> Fullscreen Focus Mode
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] cursor-pointer shadow-2xs"
          >
            Сохранить черновик
          </button>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2DED5] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[640px] gap-2">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className="flex items-center gap-2 group cursor-pointer text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isCompleted
                        ? 'bg-[#258568] text-white'
                        : isCurrent
                        ? 'bg-[#FF5A36] text-white ring-4 ring-[#FF5A36]/15'
                        : 'bg-[#F0EEE8] text-[#78716C] group-hover:bg-[#E2DED5]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        isCurrent ? 'text-[#FF5A36] font-semibold' : 'text-[#78716C]'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 min-w-[20px] ${
                      currentStep > idx + 1 ? 'bg-[#258568]' : 'bg-[#E2DED5]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs min-h-[380px] flex flex-col justify-between">
        {/* Step 1: Metadata */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Шаг 1: Метаданные экзамена
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">
                  Название экзамена на русском языке *
                </label>
                <input
                  type="text"
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#FAF9F6] border border-[#E2DED5] rounded-md font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">
                  Название на казахском языке
                </label>
                <input
                  type="text"
                  value={titleKz}
                  onChange={(e) => setTitleKz(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Тип тестирования</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
                  >
                    <option value="official_mock">Официальный пробный ЕНТ</option>
                    <option value="diagnostic">Диагностический срез</option>
                    <option value="practice_set">Тренировочный вариант</option>
                    <option value="school_olympiad">Школьная олимпиада</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Длительность (минут)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Specification */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Шаг 2: Выбор официального регламента ЕНТ
            </h2>
            <div className="space-y-3">
              {specs.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSpecId(s.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedSpecId === s.id
                      ? 'border-[#FF5A36] bg-[#FFF7F5] shadow-xs'
                      : 'border-[#E2DED5] bg-white hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717]">{s.title}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F0EEE8] text-[#5C574F]">
                      Версия: {s.version}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                    <div className="p-2 bg-white rounded border border-[#E2DED5]">
                      <div className="text-[10px] text-[#78716C]">Всего вопросов</div>
                      <div className="font-bold text-[#171717]">{s.totalQuestions}</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2DED5]">
                      <div className="text-[10px] text-[#78716C]">Максимальный балл</div>
                      <div className="font-bold text-[#FF5A36]">{s.maxScore}</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2DED5]">
                      <div className="text-[10px] text-[#78716C]">Время сдачи</div>
                      <div className="font-bold text-[#171717]">{s.durationMinutes} мин (4 часа)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Subjects & Profile config */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Шаг 3: Обязательные предметы и выбор профильной пары
            </h2>

            <div>
              <h3 className="text-xs font-semibold text-[#78716C] mb-2">3 обязательных предмета ЕНТ:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {activeSpec.mandatorySubjectConfigs.map((cfg) => (
                  <div key={cfg.subjectId} className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs">
                    <div className="font-bold text-[#171717]">{subjectNameRu(cfg.subjectId)}</div>
                    <div className="text-[#78716C] mt-0.5">
                      {cfg.questionCount} вопросов • {cfg.questionCount * cfg.pointsPerQuestion} баллов
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-[#78716C] mb-2">Выберите профильную пару:</h3>
              <div className="space-y-2">
                {activeSpec.profileSubjectConfigs.map((cfg, idx) => (
                  <div
                    key={cfg.profilePairName}
                    onClick={() => setProfilePairIndex(idx)}
                    className={`p-3.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                      profilePairIndex === idx
                        ? 'border-[#FF5A36] bg-[#FFF7F5]'
                        : 'border-[#E2DED5] bg-white hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#171717]">{cfg.profilePairName}</div>
                      <div className="text-[11px] text-[#78716C] mt-0.5">
                        Предмет 1: {cfg.subject1Questions} вопросов • Предмет 2: {cfg.subject2Questions} вопросов
                      </div>
                    </div>
                    {profilePairIndex === idx && <Check className="w-4 h-4 text-[#FF5A36]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Questions selection */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
                  Шаг 4: Отбор вопросов из банка заданий
                </h2>
                <p className="text-xs text-[#78716C]">
                  Выбрано вопросов: <span className="font-bold text-[#171717]">{selectedQuestionIds.length}</span> (верифицированные методистами)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillQuestions}
                className="px-3 py-1.5 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md hover:bg-[#FFEFEA] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Автозаполнение из банка
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg">
              {allVerifiedQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`p-3 text-xs flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-[#FFF7F5]' : 'bg-white hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-[#D5D0C5] text-[#FF5A36] focus:ring-[#FF5A36] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-[#171717] leading-snug">{q.textRu}</div>
                        <div className="text-[11px] text-[#78716C] mt-0.5">
                          ID: {q.id} • {q.sectionName} • {q.type} • {q.points} балл
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0EEE8] text-[#5C574F] shrink-0">
                      {q.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Scoring */}
        {currentStep === 5 && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Шаг 5: Конфигурация шкалы оценивания
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Максимальный суммарный балл:</span>
                  <span className="font-bold text-[#171717]">{activeSpec.maxScore} баллов</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Пороговый балл для сдачи:</span>
                  <span className="font-bold text-[#258568]">{passingScore !== null ? `${passingScore} баллов` : 'не задан'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">
                  Настроить пороговый балл для зачета теста
                </label>
                <input
                  type="number"
                  min={30}
                  max={100}
                  value={passingScore ?? ''}
                  onChange={(e) => setPassingScore(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E2DED5] rounded-md font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Validate & Preview */}
        {currentStep === 6 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Шаг 6: Валидация и предпросмотр
            </h2>
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DED5] space-y-2 text-xs text-[#5C574F]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#171717]">Проверка перед публикацией</div>
              <p>
                Соответствие варианта спецификации проверяется на сервере при публикации. Здесь проверка не выполняется.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFullscreenPreviewOpen(true)}
                className="w-full py-3 rounded-lg bg-[#171717] text-white text-xs font-bold hover:bg-[#333] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#FF5A36]" /> Запустить симуляцию сдачи учеником в Focus Mode
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Publish */}
        {currentStep === 7 && (
          <div className="space-y-4 max-w-xl text-center py-4 mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#FFF7F5] border border-[#FF5A36]/30 flex items-center justify-center mx-auto text-[#FF5A36]">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[#171717]">
              Экзамен готов к немедленной публикации
            </h2>
            <p className="text-xs text-[#78716C] leading-relaxed">
              После публикации вариант получит неизменяемую версию #{((initialExam?.version || 0) + 1)} и станет доступен школам и ученикам в кабинетах тестирования.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-lg bg-[#FF5A36] text-white text-xs font-bold hover:bg-[#E84D2B] transition-colors shadow-sm cursor-pointer"
              >
                Опубликовать экзамен в боевой реестр
              </button>
            </div>
          </div>
        )}

        {/* Navigation bottom buttons */}
        <div className="pt-6 border-t border-[#E2DED5] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="px-4 py-1.5 text-xs font-medium text-[#5C574F] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Далее <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Завершить сборку
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Preview overlay. The preview does not show the passing score, so an unset score is passed as 0. */}
      {fullscreenPreviewOpen && (
        <FullscreenExamPreview
          exam={buildExamObject('draft', passingScore ?? 0)}
          onClose={() => setFullscreenPreviewOpen(false)}
        />
      )}
    </div>
  );
};
