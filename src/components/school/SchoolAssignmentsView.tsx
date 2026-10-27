import React from 'react';
import { Organization, SchoolAssignment, SchoolClass } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import { FileText, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';

interface SchoolAssignmentsViewProps {
  organization: Organization;
  assignments: SchoolAssignment[];
  classes: SchoolClass[];
  onOpenCreateAssignment?: () => void;
}

export const SchoolAssignmentsView: React.FC<SchoolAssignmentsViewProps> = ({
  organization,
  assignments,
  classes,
  onOpenCreateAssignment,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D5CB]">
        <div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Задания школы</h1>
          <p className="text-xs text-[#74736F] mt-0.5">
            Все опубликованные и активные проверочные работы, тесты и уроки по всем классам.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
        <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] grid grid-cols-12 gap-4">
          <div className="col-span-5">Задание / Предмет</div>
          <div className="col-span-3">Классы</div>
          <div className="col-span-2">Срок сдачи</div>
          <div className="col-span-2 text-right">Статус</div>
        </div>

        <div className="divide-y divide-[#E2DED5]">
          {assignments.map((asg) => {
            const targetClasses = classes.filter((c) => asg.classIds.includes(c.id));
            const results = schoolService.getAssignmentResults(asg.id);

            return (
              <div
                key={asg.id}
                className="p-4 grid grid-cols-12 gap-4 items-center text-xs hover:bg-[#FAF9F5] transition-colors"
              >
                <div className="col-span-5">
                  <div className="font-bold text-[#171717] text-sm">{asg.title}</div>
                  <div className="text-[11px] text-[#74736F] mt-0.5">
                    Учитель: {asg.teacherName} · {asg.questionCount > 0 ? `${asg.questionCount} вопросов` : 'Изучение теории'}
                  </div>
                </div>

                <div className="col-span-3 flex flex-wrap gap-1">
                  {targetClasses.map((c) => (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 bg-[#F5F3EE] border border-[#D9D5CB] text-[11px] font-bold rounded"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>

                <div className="col-span-2 font-mono text-[#171717]">
                  до {asg.deadline}
                </div>

                <div className="col-span-2 text-right">
                  <span className="text-[11px] font-mono font-bold text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded">
                    Опубликовано ({results.length} сдали)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
