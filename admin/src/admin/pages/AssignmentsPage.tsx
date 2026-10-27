import React, { useState } from 'react';
import { CalendarCheck, Users, Clock, Award, Building2, CheckCircle2 } from 'lucide-react';
import { AssignmentItem } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';

interface AssignmentsPageProps {
  onNavigate: (path: string) => void;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

  const assignments = adminService.getAssignments();

  const columns: ColumnDef<AssignmentItem>[] = [
    {
      key: 'title',
      header: 'Задание',
      sortable: true,
      cell: (a) => (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#258568] shrink-0 mt-0.5">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{a.title}</div>
            <div className="text-[11px] text-[#78716C] mt-0.5">
              {a.targetResourceTitle}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'schoolName',
      header: 'Школа и класс',
      sortable: true,
      cell: (a) => (
        <div>
          <div className="text-xs font-semibold text-[#171717]">{a.schoolName}</div>
          <span className="px-1.5 py-0.2 rounded bg-[#F0EEE8] font-mono text-[10px] text-[#5C574F]">
            {a.className}
          </span>
        </div>
      ),
    },
    {
      key: 'teacherName',
      header: 'Преподаватель',
      sortable: true,
      cell: (a) => <span className="text-xs text-[#171717]">{a.teacherName}</span>,
    },
    {
      key: 'subjectName',
      header: 'Предмет',
      sortable: true,
      cell: (a) => <span className="text-xs text-[#78716C]">{a.subjectName}</span>,
    },
    {
      key: 'completedCount',
      header: 'Сдано / Назначено',
      sortable: true,
      cell: (a) => (
        <div>
          <div className="text-xs font-semibold text-[#171717]">
            {a.completedCount} / {a.assignedCount} учеников
          </div>
          <div className="w-24 bg-[#E2DED5] h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              style={{ width: `${Math.round((a.completedCount / a.assignedCount) * 100)}%` }}
              className="bg-[#258568] h-full"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Дедлайн',
      sortable: true,
      cell: (a) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(a.deadline).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (a) => <StatusBadge status={a.status} />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Школьные задания и контрольные срезы</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Агрегированный реестр домашних срезов и тестирований, назначенных преподавателями школ.
        </p>
      </div>

      <DataTable
        data={assignments}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Поиск по названию или школе..."
        searchValue={search}
        onSearchChange={setSearch}
        onRowClick={(a) => setSelectedAssignment(a)}
      />

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Карточка школьного задания
              </span>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-xs font-semibold text-[#78716C] hover:text-[#171717]"
              >
                Закрыть
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-[#171717]">{selectedAssignment.title}</h3>
                <p className="text-[#78716C] mt-0.5">{selectedAssignment.targetResourceTitle}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Школа:</span>
                  <span className="font-semibold text-[#171717]">{selectedAssignment.schoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Класс:</span>
                  <span className="font-bold text-[#FF5A36]">{selectedAssignment.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Преподаватель:</span>
                  <span className="font-medium text-[#171717]">{selectedAssignment.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Сдано работ:</span>
                  <span className="font-bold text-[#258568]">
                    {selectedAssignment.completedCount} из {selectedAssignment.assignedCount} (
                    {Math.round((selectedAssignment.completedCount / selectedAssignment.assignedCount) * 100)}%)
                  </span>
                </div>
                {selectedAssignment.averageScore && (
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Средний балл по классу:</span>
                    <span className="font-bold text-[#171717]">{selectedAssignment.averageScore} баллов</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] text-right">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#171717] rounded-md"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
