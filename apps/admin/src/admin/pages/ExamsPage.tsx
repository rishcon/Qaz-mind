import React, { useState } from 'react';
import { Award, Plus, Eye, Edit2, CheckCircle2, Clock, Users } from 'lucide-react';
import { ExamItem } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExamBuilder } from '../components/editors/ExamBuilder';
import { FullscreenExamPreview } from '../components/editors/FullscreenExamPreview';

interface ExamsPageProps {
  onNavigate: (path: string) => void;
}

export const ExamsPage: React.FC<ExamsPageProps> = ({ onNavigate }) => {
  const [editingExam, setEditingExam] = useState<ExamItem | null | undefined>(undefined);
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);

  const exams = adminService.getExams();

  const columns: ColumnDef<ExamItem>[] = [
    {
      key: 'titleRu',
      header: 'Название экзамена ЕНТ',
      sortable: true,
      cell: (e) => (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#D89B35] shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717] hover:text-[#FF5A36] transition-colors leading-snug">
              {e.titleRu}
            </div>
            <div className="text-[11px] text-[#78716C] mt-0.5">
              Год {e.year} • Версия #{e.version} • {e.questionCount} заданий
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Формат',
      cell: (e) => {
        const typeLabels: Record<string, string> = {
          official_mock: 'Официальный пробный',
          diagnostic: 'Диагностический',
          practice_set: 'Тренировочный',
          school_olympiad: 'Олимпиада',
        };
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0EEE8] text-[#5C574F]">
            {typeLabels[e.type] || e.type}
          </span>
        );
      },
    },
    {
      key: 'durationMinutes',
      header: 'Время / Макс. балл',
      sortable: true,
      cell: (e) => (
        <div>
          <div className="text-xs font-semibold text-[#171717]">{e.durationMinutes} минут</div>
          <div className="text-[11px] font-bold text-[#FF5A36]">Макс: {e.maxScore} баллов</div>
        </div>
      ),
    },
    {
      key: 'attemptsCount',
      header: 'Сдач учащимися',
      sortable: true,
      cell: (e) => (
        <div>
          <span className="font-semibold text-xs text-[#171717]">
            {e.attemptsCount.toLocaleString('ru-RU')}
          </span>
          {e.averageScore && (
            <div className="text-[10px] text-[#258568] font-medium">Ср: {e.averageScore} б.</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            onClick={() => setPreviewExam(e)}
            className="px-2.5 py-1 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Focus Mode симуляция ученика"
          >
            <Eye className="w-3.5 h-3.5 text-[#FF5A36]" /> Focus Mode
          </button>
          <button
            onClick={() => setEditingExam(e)}
            className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] cursor-pointer"
            title="Открыть конструктор"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  if (editingExam !== undefined) {
    return (
      <ExamBuilder
        initialExam={editingExam || undefined}
        onSave={() => setEditingExam(undefined)}
        onCancel={() => setEditingExam(undefined)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Сборка и конфигурация экзаменов ЕНТ</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Конструирование вариантов тестирования по официальной спецификации МОН РК (120 вопросов, 140 баллов).
          </p>
        </div>

        <button
          onClick={() => setEditingExam(null)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Собрать новый экзамен
        </button>
      </div>

      <DataTable
        data={exams}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Поиск экзамена..."
        onRowClick={(e) => setEditingExam(e)}
      />

      {previewExam && (
        <FullscreenExamPreview
          exam={previewExam}
          onClose={() => setPreviewExam(null)}
        />
      )}
    </div>
  );
};
