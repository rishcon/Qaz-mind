import React, { useState } from 'react';
import { FileText, Plus, ExternalLink, Edit2, CheckCircle2, Clock } from 'lucide-react';
import { LessonItem } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LessonEditor } from '../components/editors/LessonEditor';

interface LessonsPageProps {
  onNavigate: (path: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor mode
  const [editingLesson, setEditingLesson] = useState<LessonItem | null | undefined>(undefined);

  const lessons = adminService.getLessons({
    subjectId: subjectFilter,
    status: statusFilter,
    search,
  });

  const subjects = adminService.getSubjects();

  const handlePublish = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    adminService.publishLesson(lessonId);
  };

  const columns: ColumnDef<LessonItem>[] = [
    {
      key: 'titleRu',
      header: 'Название урока',
      sortable: true,
      cell: (l) => {
        const sub = subjects.find((s) => s.id === l.subjectId);
        return (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36] shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-[#171717] hover:text-[#FF5A36] transition-colors leading-snug">
                {l.titleRu}
              </div>
              <div className="text-[11px] text-[#78716C] mt-0.5">
                {sub?.nameRu || l.subjectId} • Версия v{l.version}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'estimatedMinutes',
      header: 'Длительность',
      sortable: true,
      cell: (l) => (
        <span className="text-xs text-[#5C574F] flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#A8A29E]" />
          {l.estimatedMinutes} мин
        </span>
      ),
    },
    {
      key: 'language',
      header: 'Язык',
      cell: (l) => (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F0EEE8] text-[#5C574F]">
          {l.language === 'both' ? 'RU + KZ' : l.language.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Сложность',
      cell: (l) => (
        <span className="text-xs text-[#5C574F]">
          {l.difficulty === 'easy' ? 'Базовый' : l.difficulty === 'medium' ? 'Средний' : 'Продвинутый'}
        </span>
      ),
    },
    {
      key: 'author',
      header: 'Автор / Редактор',
      cell: (l) => <span className="text-xs text-[#171717]">{l.author}</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      cell: (l) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {l.status !== 'published' && (
            <button
              onClick={(e) => handlePublish(l.id, e)}
              className="px-2 py-1 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded cursor-pointer shadow-2xs"
            >
              Опубликовать
            </button>
          )}
          <button
            onClick={() => setEditingLesson(l)}
            className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] cursor-pointer"
            title="Редактировать в блочном редакторе"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'subjectId',
      label: 'Предмет',
      selectedValue: subjectFilter,
      onChange: setSubjectFilter,
      options: [
        { label: 'Все предметы', value: 'all' },
        ...subjects.map((s) => ({ label: s.nameRu, value: s.id })),
      ],
    },
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Все статусы', value: 'all' },
        { label: 'Опубликован', value: 'published' },
        { label: 'На рецензии', value: 'in_review' },
        { label: 'Черновик', value: 'draft' },
      ],
    },
  ];

  if (editingLesson !== undefined) {
    return (
      <LessonEditor
        initialLesson={editingLesson || undefined}
        onSave={() => setEditingLesson(undefined)}
        onCancel={() => setEditingLesson(undefined)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Образовательные уроки</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Реестр уроков, управление версиями теоретического материала и педагогическая модерация.
          </p>
        </div>

        <button
          onClick={() => setEditingLesson(null)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Создать урок
        </button>
      </div>

      <DataTable
        data={lessons}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchPlaceholder="Поиск по названию урока..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onRowClick={(l) => setEditingLesson(l)}
      />
    </div>
  );
};
