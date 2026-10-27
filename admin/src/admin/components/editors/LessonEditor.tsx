import React, { useState } from 'react';
import {
  Save,
  Eye,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  Heading,
  AlignLeft,
  AlertTriangle,
  Lightbulb,
  Clock,
  Send,
  MoveUp,
  MoveDown,
  Quote,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LessonItem, LessonContentBlock, ContentStatus } from '../../types';
import { mockDb } from '../../repositories/mockDatabase';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../ui/StatusBadge';

interface LessonEditorProps {
  initialLesson?: LessonItem;
  onSave: (lesson: LessonItem) => void;
  onCancel: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  initialLesson,
  onSave,
  onCancel,
}) => {
  const subjects = mockDb.subjects;
  const [subjectId, setSubjectId] = useState(initialLesson?.subjectId || subjects[0]?.id || 'hist-kz');
  const topics = mockDb.topics.filter((t) => t.subjectId === subjectId);
  const [topicId, setTopicId] = useState(initialLesson?.topicId || topics[0]?.id || '');

  const [titleRu, setTitleRu] = useState(initialLesson?.titleRu || '');
  const [titleKz, setTitleKz] = useState(initialLesson?.titleKz || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialLesson?.estimatedMinutes || 20);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialLesson?.difficulty || 'medium');
  const [language, setLanguage] = useState<'ru' | 'kz' | 'both'>(initialLesson?.language || 'both');
  const [status, setStatus] = useState<ContentStatus>(initialLesson?.status || 'draft');
  const [objectivesText, setObjectivesText] = useState(
    (initialLesson?.learningObjectives || [
      'Усвоить ключевые исторические даты и хронологию событий',
      'Уметь анализировать причинно-следственные связи',
    ]).join('\n')
  );

  const [blocksRu, setBlocksRu] = useState<LessonContentBlock[]>(
    initialLesson?.blocksRu || [
      { id: 'b-1', type: 'heading', content: 'Введение в тему урока' },
      { id: 'b-2', type: 'paragraph', content: 'Основной теоретический материал урока...' },
      { id: 'b-3', type: 'important_fact', content: 'Ключевой факт для подготовки к ЕНТ...' },
    ]
  );

  const [activeTab, setActiveTab] = useState<'ru' | 'kz' | 'preview'>('ru');

  const addBlock = (type: LessonContentBlock['type']) => {
    const newBlock: LessonContentBlock = {
      id: `b-${Date.now().toString(36)}`,
      type,
      content:
        type === 'heading'
          ? 'Новый подзаголовок'
          : type === 'important_fact'
          ? 'Важный факт для запоминания'
          : type === 'callout'
          ? 'Обратите внимание'
          : type === 'quote'
          ? 'Цитата исторического деятеля...'
          : 'Введите текст блока...',
    };
    setBlocksRu([...blocksRu, newBlock]);
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocksRu(blocksRu.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocksRu(blocksRu.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocksRu];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocksRu(newBlocks);
  };

  const handleSave = (newStatus: ContentStatus) => {
    const objectives = objectivesText
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);

    const lesson: LessonItem = {
      id: initialLesson?.id || `les-${Date.now().toString(36)}`,
      subjectId,
      topicId: topicId || (topics[0]?.id ?? 'default-topic'),
      titleRu,
      titleKz,
      language,
      status: newStatus,
      estimatedMinutes,
      difficulty,
      learningObjectives: objectives,
      blocksRu,
      blocksKz: initialLesson?.blocksKz || [],
      author: initialLesson?.author || mockDb.currentAdminName,
      version: (initialLesson?.version || 0) + 1,
      lastModifiedAt: new Date().toISOString(),
      publishedAt: newStatus === 'published' ? new Date().toISOString() : initialLesson?.publishedAt,
    };

    adminService.saveLesson(lesson);
    onSave(lesson);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-[#EBE8E0] text-[#78716C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#171717]">
                {initialLesson ? `Редактирование урока: ${initialLesson.titleRu}` : 'Создание нового урока в CMS'}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Модульный блочный редактор образовательного контента для подготовки к ЕНТ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'preview' ? 'ru' : 'preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              activeTab === 'preview'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-white text-[#171717] border-[#E2DED5] hover:bg-[#F5F3EE]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> {activeTab === 'preview' ? 'Режим редактирования' : 'Предпросмотр'}
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-[#78716C]" /> Сохранить черновик
          </button>

          <button
            type="button"
            onClick={() => handleSave('in_review')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#D89B35] hover:bg-[#C2892C] rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" /> На утверждение
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Опубликовать
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        /* Preview Mode */
        <div className="bg-white rounded-xl border border-[#E2DED5] p-8 max-w-3xl mx-auto shadow-xs space-y-6">
          <div className="border-b border-[#E2DED5] pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF5A36]">
              {subjects.find((s) => s.id === subjectId)?.nameRu || 'Предмет'} • {estimatedMinutes} мин чтения
            </span>
            <h1 className="text-2xl font-bold text-[#171717] mt-1">{titleRu || 'Название урока'}</h1>
            {titleKz && <p className="text-sm text-[#78716C] mt-0.5">{titleKz}</p>}
          </div>

          <div className="space-y-4">
            {blocksRu.map((b) => (
              <div key={b.id}>
                {b.type === 'heading' && (
                  <h2 className="text-lg font-bold text-[#171717] mt-4 mb-2">{b.content}</h2>
                )}
                {b.type === 'paragraph' && (
                  <p className="text-sm text-[#333] leading-relaxed">{b.content}</p>
                )}
                {b.type === 'important_fact' && (
                  <div className="p-3.5 rounded-lg bg-[#FFF7F5] border-l-4 border-[#FF5A36] text-xs text-[#171717] font-medium leading-relaxed">
                    💡 <strong>Важно для ЕНТ:</strong> {b.content}
                  </div>
                )}
                {b.type === 'callout' && (
                  <div className="p-3.5 rounded-lg bg-[#EBF7F2] border-l-4 border-[#258568] text-xs text-[#1D6A53] leading-relaxed">
                    📌 {b.content}
                  </div>
                )}
                {b.type === 'quote' && (
                  <blockquote className="border-l-2 border-[#A8A29E] pl-4 italic text-sm text-[#5C574F] my-3">
                    «{b.content}»
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Metadata Settings */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3.5">
              <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" /> Метаданные урока
              </h3>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Предмет</label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    const subTopics = mockDb.topics.filter((t) => t.subjectId === e.target.value);
                    setTopicId(subTopics[0]?.id || '');
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameRu}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Тема курса</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titleRu}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Сложность</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                  >
                    <option value="easy">Базовый</option>
                    <option value="medium">Средний</option>
                    <option value="hard">Продвинутый</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#78716C] block mb-1">Время (мин)</label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Цели обучения (по строкам)</label>
                <textarea
                  rows={3}
                  value={objectivesText}
                  onChange={(e) => setObjectivesText(e.target.value)}
                  placeholder="Чему научится студент..."
                  className="w-full text-xs p-2 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Right Blocks Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title Inputs */}
            <div className="bg-white p-4 rounded-lg border border-[#E2DED5] space-y-3">
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Заголовок урока (RU) *</label>
                <input
                  type="text"
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                  placeholder="Например: Образование Казахского ханства при ханах Керее и Жанибеке"
                  className="w-full text-sm font-semibold px-3 py-2 bg-white border border-[#E2DED5] rounded-md focus:border-[#FF5A36] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Сабақ тақырыбы (KZ)</label>
                <input
                  type="text"
                  value={titleKz}
                  onChange={(e) => setTitleKz(e.target.value)}
                  placeholder="Қазақ тіліндегі тақырыбы..."
                  className="w-full text-xs px-3 py-1.5 bg-white border border-[#E2DED5] rounded-md focus:border-[#FF5A36] focus:outline-none"
                />
              </div>
            </div>

            {/* Block Insert Toolbar */}
            <div className="bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E2DED5] flex flex-wrap items-center gap-1.5 text-xs text-[#78716C]">
              <span className="text-[11px] font-semibold text-[#171717] mr-1 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-[#FF5A36]" /> Добавить блок:
              </span>
              <button
                type="button"
                onClick={() => addBlock('heading')}
                className="px-2 py-1 bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer"
              >
                <Heading className="w-3 h-3" /> Заголовок
              </button>
              <button
                type="button"
                onClick={() => addBlock('paragraph')}
                className="px-2 py-1 bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer"
              >
                <AlignLeft className="w-3 h-3" /> Параграф
              </button>
              <button
                type="button"
                onClick={() => addBlock('important_fact')}
                className="px-2 py-1 bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer text-[#FF5A36]"
              >
                <Lightbulb className="w-3 h-3" /> Факт ЕНТ
              </button>
              <button
                type="button"
                onClick={() => addBlock('callout')}
                className="px-2 py-1 bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer text-[#258568]"
              >
                <Sparkles className="w-3 h-3" /> Выноска
              </button>
              <button
                type="button"
                onClick={() => addBlock('quote')}
                className="px-2 py-1 bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer"
              >
                <Quote className="w-3 h-3" /> Цитата
              </button>
            </div>

            {/* Blocks List */}
            <div className="space-y-3">
              {blocksRu.map((block, index) => (
                <div
                  key={block.id}
                  className="bg-white p-3.5 rounded-lg border border-[#E2DED5] space-y-2 group hover:border-[#C5BFB5] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] bg-[#F5F3EE] px-2 py-0.5 rounded">
                      {block.type === 'heading'
                        ? 'Подзаголовок'
                        : block.type === 'important_fact'
                        ? 'Факт ЕНТ'
                        : block.type === 'callout'
                        ? 'Выноска'
                        : block.type === 'quote'
                        ? 'Цитата'
                        : 'Параграф'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-[#A8A29E] hover:text-[#171717] disabled:opacity-30 cursor-pointer"
                        title="Поднять блок выше"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'down')}
                        disabled={index === blocksRu.length - 1}
                        className="p-1 text-[#A8A29E] hover:text-[#171717] disabled:opacity-30 cursor-pointer"
                        title="Опустить блок ниже"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 text-[#A8A29E] hover:text-[#C94A43] cursor-pointer ml-1"
                        title="Удалить блок"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'heading' ? (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className="w-full text-sm font-bold px-2.5 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md focus:border-[#FF5A36] focus:outline-none"
                    />
                  ) : (
                    <textarea
                      rows={block.type === 'important_fact' ? 2 : 3}
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className={`w-full text-xs p-2.5 rounded-md border focus:border-[#FF5A36] focus:outline-none ${
                        block.type === 'important_fact'
                          ? 'bg-[#FFF7F5] border-[#FF5A36]/30 text-[#171717]'
                          : block.type === 'callout'
                          ? 'bg-[#F4FAF7] border-[#258568]/30 text-[#171717]'
                          : 'bg-[#FAF9F6] border-[#E2DED5] text-[#171717]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
