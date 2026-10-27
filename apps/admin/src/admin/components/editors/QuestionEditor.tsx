import React, { useState } from 'react';
import {
  Save,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  FileText,
  Tag,
  Check,
} from 'lucide-react';
import { QuestionItem, QuestionType, QuestionOption, MatchingPair } from '../../types';
import { mockDb } from '../../repositories/mockDatabase';
import { adminService } from '../../services/adminService';
import { validateQuestionDraft } from '../../utils/entRules';
import { StatusBadge } from '../ui/StatusBadge';

interface QuestionEditorProps {
  initialQuestion?: QuestionItem;
  onSave: (question: QuestionItem) => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  initialQuestion,
  onSave,
  onCancel,
}) => {
  const isEditing = !!initialQuestion;

  const subjects = mockDb.subjects;
  const [subjectId, setSubjectId] = useState(initialQuestion?.subjectId || subjects[0]?.id || 'history_kz');

  const topics = mockDb.topics.filter((t) => t.subjectId === subjectId);
  const [topicId, setTopicId] = useState(initialQuestion?.topicId || topics[0]?.id || '');
  const [sectionName, setSectionName] = useState(initialQuestion?.sectionName || 'Казахское ханство');
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'single_choice');
  const [language, setLanguage] = useState<'ru' | 'kz' | 'both'>(initialQuestion?.language || 'both');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialQuestion?.difficulty || 'medium');
  const [points, setPoints] = useState<number>(initialQuestion?.points || (type === 'multiple_choice' ? 2 : 1));

  // Question Texts
  const [textRu, setTextRu] = useState(initialQuestion?.textRu || '');
  const [textKz, setTextKz] = useState(initialQuestion?.textKz || '');

  // Single / Multi options
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options || [
      { id: 'opt-1', textRu: '', textKz: '', isCorrect: true },
      { id: 'opt-2', textRu: '', textKz: '', isCorrect: false },
      { id: 'opt-3', textRu: '', textKz: '', isCorrect: false },
      { id: 'opt-4', textRu: '', textKz: '', isCorrect: false },
    ]
  );

  // Matching pairs
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    initialQuestion?.matchingPairs || [
      { id: 'pair-1', leftRu: '', leftKz: '', rightRu: '', rightKz: '', correctRightId: 'right-1' },
      { id: 'pair-2', leftRu: '', leftKz: '', rightRu: '', rightKz: '', correctRightId: 'right-2' },
    ]
  );

  // Context Group
  const [contextPassageRu, setContextPassageRu] = useState(initialQuestion?.contextPassageRu || '');
  const [contextPassageKz, setContextPassageKz] = useState(initialQuestion?.contextPassageKz || '');

  // Numerical
  const [numericalAnswer, setNumericalAnswer] = useState<number | undefined>(initialQuestion?.numericalAnswer);
  const [tolerance, setTolerance] = useState<number | undefined>(initialQuestion?.tolerance ?? 0);

  // Pedagogical Explanation
  const [explanationRu, setExplanationRu] = useState(initialQuestion?.explanationRu || '');
  const [explanationKz, setExplanationKz] = useState(initialQuestion?.explanationKz || '');
  const [sourceReference, setSourceReference] = useState(initialQuestion?.sourceReference || 'Учебник МОН РК / ЕНТ 2026');
  const [tagsInput, setTagsInput] = useState((initialQuestion?.tags || ['ЕНТ', 'Подготовка']).join(', '));

  // Preview & Validation State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedToast, setSavedToast] = useState(false);

  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    const subTopics = mockDb.topics.filter((t) => t.subjectId === newSubId);
    if (subTopics.length > 0) {
      setTopicId(subTopics[0].id);
      setSectionName(subTopics[0].sectionTitle);
    } else {
      setTopicId('');
    }
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'multiple_choice') setPoints(2);
    else if (newType === 'context_group') setPoints(3);
    else setPoints(1);
  };

  // Option actions
  const handleAddOption = () => {
    const nextId = `opt-${Date.now().toString(36)}`;
    setOptions([...options, { id: nextId, textRu: '', textKz: '', isCorrect: false }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionCorrectChange = (id: string, isSingle: boolean) => {
    if (isSingle) {
      setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
    } else {
      setOptions(options.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)));
    }
  };

  // Build current question object
  const buildCurrentQuestion = (overrideStatus?: QuestionItem['status']): QuestionItem => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const correctOptionIds = options.filter((o) => o.isCorrect).map((o) => o.id);

    return {
      id: initialQuestion?.id || `qst-${Date.now().toString(36)}`,
      subjectId,
      sectionName,
      topicId: topicId || (topics[0]?.id ?? 'default-topic'),
      type,
      language,
      difficulty,
      status: overrideStatus || initialQuestion?.status || 'draft',
      points,
      textRu,
      textKz,
      options: type === 'single_choice' || type === 'multiple_choice' ? options : undefined,
      correctOptionIds: type === 'single_choice' || type === 'multiple_choice' ? correctOptionIds : undefined,
      matchingPairs: type === 'matching' ? matchingPairs : undefined,
      contextPassageRu: type === 'context_group' ? contextPassageRu : undefined,
      contextPassageKz: type === 'context_group' ? contextPassageKz : undefined,
      numericalAnswer: type === 'numerical' ? numericalAnswer : undefined,
      tolerance: type === 'numerical' ? tolerance : undefined,
      explanationRu,
      explanationKz,
      sourceReference,
      tags,
      author: initialQuestion?.author || mockDb.currentAdminName,
      version: (initialQuestion?.version || 0) + 1,
      createdAt: initialQuestion?.createdAt || new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = () => {
    const q = buildCurrentQuestion('draft');
    adminService.saveQuestion(q);
    setValidationErrors([]);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
    onSave(q);
  };

  const handleSubmitForReview = () => {
    const q = buildCurrentQuestion('in_review');
    const errors = validateQuestionDraft(q);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    adminService.saveQuestion(q);
    onSave(q);
  };

  const handlePublishDirectly = () => {
    const q = buildCurrentQuestion('published');
    const errors = validateQuestionDraft(q);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    adminService.saveQuestion(q);
    onSave(q);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-[#EBE8E0] text-[#78716C] transition-colors cursor-pointer"
            title="Назад к списку вопросов"
          >
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#171717]">
                {isEditing ? `Редактирование вопроса #${initialQuestion.id}` : 'Создание нового вопроса ЕНТ'}
              </h1>
              {initialQuestion && <StatusBadge status={initialQuestion.status} />}
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Заполните метаданные, формулировку на русском и казахском, варианты ответов и методическое пояснение.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedToast && (
            <span className="text-xs text-[#258568] flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Сохранено в черновики
            </span>
          )}

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#78716C]" /> Предпросмотр ученика
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-[#78716C]" /> Сохранить черновик
          </button>

          <button
            type="button"
            onClick={handleSubmitForReview}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#D89B35] hover:bg-[#C2892C] rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" /> На рецензию
          </button>

          <button
            type="button"
            onClick={handlePublishDirectly}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Опубликовать
          </button>
        </div>
      </div>

      {/* Validation alert if errors */}
      {validationErrors.length > 0 && (
        <div className="p-3.5 rounded-lg bg-[#FFF1F2] border border-[#FCA5A5] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#C94A43] shrink-0 mt-0.5" />
          <div className="text-xs text-[#991B1B]">
            <p className="font-semibold mb-1">Пожалуйста, исправьте ошибки перед публикацией:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid: Left metadata + Right content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Settings */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3.5">
            <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" /> Метаданные ЕНТ
            </h3>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Предмет</label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameRu} ({s.type === 'mandatory' ? 'Обязательный' : 'Профильный'})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Тема программы</label>
              <select
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value);
                  const found = topics.find((t) => t.id === e.target.value);
                  if (found) setSectionName(found.sectionTitle);
                }}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
              >
                {topics.length === 0 ? (
                  <option value="">Нет тем для предмета</option>
                ) : (
                  topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.sectionTitle} — {t.titleRu}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Тип задания</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
              >
                <option value="single_choice">Одиночный выбор (1 верный ответ)</option>
                <option value="multiple_choice">Множественный выбор (несколько верных)</option>
                <option value="matching">Установление соответствия (пары)</option>
                <option value="context_group">Контекстная группа (с источником)</option>
                <option value="numerical">Числовой ответ (практика)</option>
              </select>
            </div>

            {/* Difficulty & Points */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Сложность</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                >
                  <option value="easy">Базовый</option>
                  <option value="medium">Средний</option>
                  <option value="hard">Повышенный</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Баллов</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Язык задания</label>
              <div className="grid grid-cols-3 gap-1">
                {(['both', 'ru', 'kz'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`py-1 text-xs rounded border cursor-pointer font-medium transition-colors ${
                      language === l
                        ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                        : 'bg-white text-[#78716C] border-[#E2DED5] hover:bg-[#F9F8F5]'
                    }`}
                  >
                    {l === 'both' ? 'Оба языка' : l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reference & Tags */}
          <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
            <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#258568]" /> Источник и теги
            </h3>

            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Источник / Учебник</label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="Например: История Казахстана 8 класс, Мектеп 2021"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Теги (через запятую)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ЕНТ, 2026, Ханство, Керей"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
              />
            </div>
          </div>
        </div>

        {/* Right Columns: Question Content & Explanations */}
        <div className="lg:col-span-2 space-y-5">
          {/* Context group passage if applicable */}
          {type === 'context_group' && (
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
              <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                Текст контекста / Исторический документ
              </h3>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Контекст на русском языке</label>
                <textarea
                  rows={4}
                  value={contextPassageRu}
                  onChange={(e) => setContextPassageRu(e.target.value)}
                  placeholder="Вставьте фрагмент исторического источника, статьи или данных..."
                  className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              {(language === 'both' || language === 'kz') && (
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Контекст на казахском языке</label>
                  <textarea
                    rows={4}
                    value={contextPassageKz}
                    onChange={(e) => setContextPassageKz(e.target.value)}
                    placeholder="Мәтін үзіндісін енгізіңіз..."
                    className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Question Text */}
          <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
            <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#FF5A36]" /> Формулировка вопроса
            </h3>

            {(language === 'both' || language === 'ru') && (
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Вопрос на русском языке *</label>
                <textarea
                  rows={3}
                  value={textRu}
                  onChange={(e) => setTextRu(e.target.value)}
                  placeholder="Введите условие или вопрос задания..."
                  className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            )}

            {(language === 'both' || language === 'kz') && (
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Вопрос на казахском языке</label>
                <textarea
                  rows={3}
                  value={textKz}
                  onChange={(e) => setTextKz(e.target.value)}
                  placeholder="Тапсырманың қазақ тіліндегі шарты..."
                  className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            )}
          </div>

          {/* Interactive Answers Section based on Question Type */}
          {(type === 'single_choice' || type === 'multiple_choice') && (
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">Варианты ответа</h3>
                  <p className="text-[11px] text-[#78716C]">
                    {type === 'single_choice'
                      ? 'Выберите ровно один верный ответ'
                      : 'Отметьте все правильные варианты'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-2.5 py-1 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md hover:bg-[#FFEFEA] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить вариант
                </button>
              </div>

              <div className="space-y-2.5 mt-2">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                      opt.isCorrect ? 'border-[#258568] bg-[#F4FAF7]' : 'border-[#E2DED5] bg-white'
                    }`}
                  >
                    <div className="pt-1">
                      <input
                        type={type === 'single_choice' ? 'radio' : 'checkbox'}
                        name="correct-option"
                        checked={!!opt.isCorrect}
                        onChange={() => handleOptionCorrectChange(opt.id, type === 'single_choice')}
                        className="rounded border-[#D5D0C5] text-[#258568] focus:ring-[#258568] cursor-pointer w-4 h-4"
                        title={opt.isCorrect ? 'Правильный ответ' : 'Сделать правильным'}
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#78716C] w-5">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          value={opt.textRu}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptions(options.map((o) => (o.id === opt.id ? { ...o, textRu: val } : o)));
                          }}
                          placeholder="Текст варианта на русском языке..."
                          className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:border-[#FF5A36] focus:outline-none"
                        />
                      </div>

                      {(language === 'both' || language === 'kz') && (
                        <div className="flex items-center gap-2 pl-7">
                          <input
                            type="text"
                            value={opt.textKz}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOptions(options.map((o) => (o.id === opt.id ? { ...o, textKz: val } : o)));
                            }}
                            placeholder="Қазақша нұсқасы..."
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:border-[#FF5A36] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      disabled={options.length <= 2}
                      className="p-1 text-[#A8A29E] hover:text-[#C94A43] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Удалить вариант"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Editor */}
          {type === 'matching' && (
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                    Пары на соответствие
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Укажите левый элемент и соответствующий ему правый верный ответ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMatchingPairs([
                      ...matchingPairs,
                      {
                        id: `pair-${Date.now()}`,
                        leftRu: '',
                        leftKz: '',
                        rightRu: '',
                        rightKz: '',
                        correctRightId: `right-${Date.now()}`,
                      },
                    ])
                  }
                  className="px-2.5 py-1 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md hover:bg-[#FFEFEA] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить пару
                </button>
              </div>

              <div className="space-y-2 mt-2">
                {matchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="p-3 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div>
                      <span className="text-[11px] font-semibold text-[#78716C] block mb-1">
                        Левая колонка #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={pair.leftRu}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMatchingPairs(
                            matchingPairs.map((p) => (p.id === pair.id ? { ...p, leftRu: val } : p))
                          );
                        }}
                        placeholder="Например: Тюргешский каганат"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-[#78716C] block mb-1">
                          Верное соответствие #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={pair.rightRu}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMatchingPairs(
                              matchingPairs.map((p) => (p.id === pair.id ? { ...p, rightRu: val } : p))
                            );
                          }}
                          placeholder="Например: Суяб"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          matchingPairs.length > 2 &&
                          setMatchingPairs(matchingPairs.filter((p) => p.id !== pair.id))
                        }
                        disabled={matchingPairs.length <= 2}
                        className="mt-5 p-1 text-[#A8A29E] hover:text-[#C94A43] disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numerical answer */}
          {type === 'numerical' && (
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
              <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                Числовой ответ
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Правильное число</label>
                  <input
                    type="number"
                    value={numericalAnswer ?? ''}
                    onChange={(e) => setNumericalAnswer(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="Например: 4320"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Погрешность (±)</label>
                  <input
                    type="number"
                    value={tolerance ?? 0}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pedagogical Explanation */}
          <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
            <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
              Методическое пояснение (Explanation) *
            </h3>
            <p className="text-[11px] text-[#78716C]">
              Объяснение отображается учащемуся при разборе ошибок после сдачи экзамена.
            </p>

            <div>
              <label className="text-xs font-medium text-[#78716C] block mb-1">Пояснение на русском языке *</label>
              <textarea
                rows={3}
                value={explanationRu}
                onChange={(e) => setExplanationRu(e.target.value)}
                placeholder="Подробный разбор решения и обоснование правильного ответа..."
                className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            {(language === 'both' || language === 'kz') && (
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Пояснение на казахском языке</label>
                <textarea
                  rows={3}
                  value={explanationKz}
                  onChange={(e) => setExplanationKz(e.target.value)}
                  placeholder="Жауаптың қазақша түсіндірмесі мен негіздемесі..."
                  className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student View Modal Preview */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#F7F6F2]">
              <span className="text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
                Предпросмотр: интерфейс ученика ЕНТ
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-xs font-semibold text-[#78716C] hover:text-[#171717]"
              >
                Закрыть (Esc)
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {contextPassageRu && (
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs text-[#5C574F] italic leading-relaxed">
                  {contextPassageRu}
                </div>
              )}

              <div className="text-sm font-semibold text-[#171717] leading-relaxed">
                {textRu || '(Текст вопроса не введен)'}
              </div>

              {/* Options Preview */}
              {(type === 'single_choice' || type === 'multiple_choice') && (
                <div className="space-y-2 pt-2">
                  {options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className="p-3 rounded-lg border border-[#E2DED5] flex items-center gap-3 hover:bg-[#F9F8F5] cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-full border border-[#D5D0C5] flex items-center justify-center text-xs font-semibold text-[#78716C]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-xs text-[#171717]">{opt.textRu || '(Вариант ответа)'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation block */}
              {explanationRu && (
                <div className="mt-4 p-3 rounded-lg bg-[#EBF7F2] border border-[#258568]/20 text-xs text-[#1D6A53]">
                  <p className="font-semibold mb-1">Педагогическое пояснение:</p>
                  <p>{explanationRu}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] text-right">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#171717] rounded-md cursor-pointer"
              >
                Вернуться к редактору
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
