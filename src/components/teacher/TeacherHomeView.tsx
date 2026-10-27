import React, { useState } from 'react';
import { SchoolClass, SchoolAssignment, AssignmentResult } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import {
  Layers,
  FileText,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface TeacherHomeViewProps {
  teacherName: string;
  assignedClasses: SchoolClass[];
  assignments: SchoolAssignment[];
  onOpenCreateModal: () => void;
  onSelectClass: (classId: string) => void;
}

export const TeacherHomeView: React.FC<TeacherHomeViewProps> = ({
  teacherName,
  assignedClasses,
  assignments,
  onOpenCreateModal,
  onSelectClass,
}) => {
  const allResults = schoolService.getAllResults();
  const myAssignmentIds = assignments.map((a) => a.id);
  const myResults = allResults.filter((r) => myAssignmentIds.includes(r.assignmentId));

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 bg-white border border-[#D9D5CB] rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#258568] uppercase tracking-wider block">
            КАБИНЕТ ПРЕПОДАВАТЕЛЯ
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight mt-1">
            Здравствуйте, {teacherName}
          </h1>
          <p className="text-xs text-[#74736F] mt-1">
            Закреплено классов: {assignedClasses.length} · Активных заданий: {assignments.length}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Создать задание</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="text-[11px] font-mono uppercase text-[#74736F]">Мои классы</div>
          <div className="text-2xl font-black text-[#171717] mt-2">{assignedClasses.length}</div>
          <div className="text-[10px] text-[#74736F] mt-1">11 «А»</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="text-[11px] font-mono uppercase text-[#74736F]">Назначено заданий</div>
          <div className="text-2xl font-black text-[#171717] mt-2">{assignments.length}</div>
          <div className="text-[10px] text-[#74736F] mt-1">В процессе выполнения</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="text-[11px] font-mono uppercase text-[#74736F]">Сданных работ</div>
          <div className="text-2xl font-black text-[#258568] mt-2">{myResults.length}</div>
          <div className="text-[10px] text-[#74736F] mt-1">Проверено автоматически</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="text-[11px] font-mono uppercase text-[#74736F]">Средний балл</div>
          <div className="text-2xl font-black text-[#171717] mt-2">4.2 / 5</div>
          <div className="text-[10px] text-[#74736F] mt-1">По проверенным тестам</div>
        </div>
      </div>

      {/* Assigned Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
            Закрепленные классы ({assignedClasses.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedClasses.map((cls) => {
            const classAsgs = assignments.filter((a) => a.classIds.includes(cls.id));
            const joinCode = schoolService.getJoinCodeForClass(cls.id);

            return (
              <div
                key={cls.id}
                className="p-5 bg-white border border-[#D9D5CB] rounded space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded bg-[#FAF9F5] border border-[#D9D5CB] flex items-center justify-center font-bold text-base text-[#171717]">
                      {cls.name}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-[#171717]">{cls.name}</h3>
                      <div className="text-[11px] text-[#74736F]">{cls.academicYear}</div>
                    </div>
                  </div>

                  {joinCode && (
                    <span className="text-xs font-mono font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2 py-0.5 rounded">
                      {joinCode.code}
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#74736F] flex items-center justify-between pt-2 border-t border-[#E2DED5]">
                  <span>{cls.studentIds.length > 0 ? `${cls.studentIds.length} учеников` : '16 учеников'}</span>
                  <span>{classAsgs.length} активных заданий</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectClass(cls.id)}
                  className="w-full py-2 bg-[#FAF9F5] hover:bg-[#F0EEE8] border border-[#D9D5CB] text-xs font-bold text-[#171717] rounded transition-colors cursor-pointer"
                >
                  Открыть класс →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-[#D9D5CB] rounded p-6 space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
          Свежие сдачи учащихся ({myResults.length})
        </h2>

        {myResults.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#74736F]">
            Сданных работ пока нет. Как только учащиеся выполнят задание, их результаты появятся здесь.
          </div>
        ) : (
          <div className="divide-y divide-[#E2DED5]">
            {myResults.map((res) => (
              <div key={res.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#171717]">{res.studentName}</div>
                  <div className="text-[11px] text-[#74736F]">
                    {res.studentEmail} · Задание: {res.assignmentId}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded">
                    {res.score} из {res.total}
                  </span>
                  <div className="text-[10px] text-[#74736F] mt-0.5">
                    {new Date(res.completedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
