import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Upload,
  Download,
  ExternalLink,
  Edit2,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { QuestionItem } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExportDialog } from '../components/ui/ExportDialog';
import { formatQuestionsCsv } from '../utils/entRules';

interface QuestionsPageProps {
  onNavigate: (path: string) => void;
}

export const QuestionsPage: React.FC<QuestionsPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const questions = adminService.getQuestions({
    search,
    subjectId: subjectFilter,
    type: typeFilter,
    status: statusFilter,
  });

  const subjects = adminService.getSubjects();

  const handleExport = (format: 'csv' | 'json') => {
    const subset = selectedIds.length > 0 ? questions.filter((q) => selectedIds.includes(q.id)) : questions;

    let content = '';
    if (format === 'csv') {
      content = formatQuestionsCsv(subset);
    } else {
      content = JSON.stringify(subset, null, 2);
    }

    const blob = new Blob([content], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qazmind_questions_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<QuestionItem>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      cell: (q) => (
        <span className="font-mono text-xs font-semibold text-[#FF5A36]">{q.id}</span>
      ),
    },
    {
      key: 'textRu',
      header: 'Формулировка вопроса',
      cell: (q) => (
        <div className="max-w-md">
          <div className="text-xs font-semibold text-[#171717] hover:text-[#FF5A36] transition-colors line-clamp-2 leading-relaxed">
            {q.textRu}
          </div>
          <div className="text-[11px] text-[#78716C] mt-0.5 truncate">
            {q.sectionName} • {q.tags.join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'subjectId',
      header: 'Предмет',
      sortable: true,
      cell: (q) => {
        const sub = subjects.find((s) => s.id === q.subjectId);
        return <span className="text-xs text-[#171717]">{sub?.nameRu || q.subjectId}</span>;
      },
    },
    {
      key: 'type',
      header: 'Тип вопроса',
      sortable: true,
      cell: (q) => {
        const typeLabels: Record<string, string> = {
          single_choice: 'Одиночный',
          multiple_choice: 'Множественный',
          matching: 'Соответствие',
          context_group: 'Контекст',
          numerical: 'Числовой',
        };
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0EEE8] text-[#5C574F]">
            {typeLabels[q.type] || q.type}
          </span>
        );
      },
    },
    {
      key: 'difficulty',
      header: 'Сложность',
      sortable: true,
      cell: (q) => (
        <span className="text-xs text-[#5C574F]">
          {q.difficulty === 'easy' ? 'Базовый' : q.difficulty === 'medium' ? 'Средний' : 'Повышенный'}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Балл',
      sortable: true,
      cell: (q) => <span className="font-bold text-xs text-[#171717]">+{q.points}</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      cell: (q) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/admin/content/questions/${q.id}`);
          }}
          className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] cursor-pointer"
          title="Открыть редактор вопроса"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
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
      key: 'type',
      label: 'Тип задания',
      selectedValue: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: 'Все типы', value: 'all' },
        { label: 'Одиночный выбор', value: 'single_choice' },
        { label: 'Множественный выбор', value: 'multiple_choice' },
        { label: 'На соответствие', value: 'matching' },
        { label: 'Контекстная группа', value: 'context_group' },
        { label: 'Числовой ответ', value: 'numerical' },
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
        { label: 'Требует правок', value: 'changes_requested' },
        { label: 'Черновик', value: 'draft' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Банк вопросов ЕНТ / ҰБТ</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Централизованный банк тестовых заданий: фильтрация, модерация, импорт и валидация.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" /> Экспорт ({selectedIds.length > 0 ? selectedIds.length : questions.length})
          </button>

          <button
            onClick={() => onNavigate('/admin/content/questions/import')}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#258568]" /> Импорт CSV
          </button>

          <button
            onClick={() => onNavigate('/admin/content/questions/new')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Добавить вопрос
          </button>
        </div>
      </div>

      <DataTable
        data={questions}
        columns={columns}
        keyExtractor={(q) => q.id}
        searchPlaceholder="Поиск по формулировке, ID или тегам..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(q) => onNavigate(`/admin/content/questions/${q.id}`)}
      />

      <ExportDialog
        isOpen={exportOpen}
        title="Экспорт вопросов ЕНТ"
        itemCount={selectedIds.length > 0 ? selectedIds.length : questions.length}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};
