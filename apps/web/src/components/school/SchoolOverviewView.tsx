import React from 'react';
import { Organization, SchoolClass, SchoolAssignment } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import {
  Users,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  BookOpen,
} from 'lucide-react';

interface SchoolOverviewViewProps {
  organization: Organization;
  classes: SchoolClass[];
  assignments: SchoolAssignment[];
  onNavigateClasses: () => void;
  onNavigateTeachers: () => void;
  onNavigateAssignments: () => void;
  onCreateClass: () => void;
  onOpenClassDetail: (classId: string) => void;
}

export const SchoolOverviewView: React.FC<SchoolOverviewViewProps> = ({
  organization,
  classes,
  assignments,
  onNavigateClasses,
  onNavigateTeachers,
  onNavigateAssignments,
  onCreateClass,
  onOpenClassDetail,
}) => {
  const stats = schoolService.getSchoolStats(organization.id);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 bg-white border border-[#D9D5CB] rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block">
            СВОДКА УЧЕБНОГО ПРОЦЕССА
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight mt-1">
            {organization.name}
          </h1>
          <p className="text-xs text-[#74736F] mt-1">
            г. {organization.city} · Подготовка к ЕНТ 2026/2027 · Лицензия активна ({organization.licenses.usedSeats}/{organization.licenses.totalSeats} мест)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateClass}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#171717] hover:bg-black text-white text-xs font-bold rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать класс</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="flex items-center justify-between text-[#74736F]">
            <span className="text-[11px] font-mono uppercase">Классы</span>
            <Layers className="w-4 h-4 text-[#FF5A36]" />
          </div>
          <div className="text-2xl font-black text-[#171717] mt-2">{stats.totalClasses}</div>
          <div className="text-[10px] text-[#74736F] mt-1">11 «А», 11 «Б»</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="flex items-center justify-between text-[#74736F]">
            <span className="text-[11px] font-mono uppercase">Учащихся</span>
            <Users className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="text-2xl font-black text-[#171717] mt-2">{stats.totalStudents}</div>
          <div className="text-[10px] text-[#74736F] mt-1">Подключено в систему</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="flex items-center justify-between text-[#74736F]">
            <span className="text-[11px] font-mono uppercase">Учителей</span>
            <GraduationCap className="w-4 h-4 text-[#258568]" />
          </div>
          <div className="text-2xl font-black text-[#171717] mt-2">{stats.totalTeachers}</div>
          <div className="text-[10px] text-[#74736F] mt-1">Кураторы предметов</div>
        </div>

        <div className="p-4 bg-white border border-[#D9D5CB] rounded">
          <div className="flex items-center justify-between text-[#74736F]">
            <span className="text-[11px] font-mono uppercase">Сдача заданий</span>
            <CheckCircle2 className="w-4 h-4 text-[#258568]" />
          </div>
          <div className="text-2xl font-black text-[#258568] mt-2">{stats.completionRate}%</div>
          <div className="text-[10px] text-[#74736F] mt-1">В срок без просрочек</div>
        </div>
      </div>

      {/* Classes & Current Assignments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Classes Column (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#D9D5CB] rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
              Активные классы ({classes.length})
            </h2>
            <button
              type="button"
              onClick={onNavigateClasses}
              className="text-xs font-semibold text-[#FF5A36] hover:underline cursor-pointer"
            >
              Все классы →
            </button>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => {
              const codeObj = schoolService.getJoinCodeForClass(cls.id);
              const classAssignments = assignments.filter((a) => a.classIds.includes(cls.id));

              return (
                <div
                  key={cls.id}
                  onClick={() => onOpenClassDetail(cls.id)}
                  className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded hover:border-[#171717]/50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded bg-white border border-[#D9D5CB] flex items-center justify-center font-bold text-sm text-[#171717]">
                      {cls.name}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#171717]">{cls.name}</div>
                      <div className="text-[11px] text-[#74736F]">
                        {cls.studentIds.length > 0 ? `${cls.studentIds.length} учеников` : '16 учеников'} · {classAssignments.length} активных заданий
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    {codeObj && (
                      <span className="text-xs font-mono font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2.5 py-1 rounded">
                        {codeObj.code}
                      </span>
                    )}
                    <span className="text-xs text-[#74736F]">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attention & Recent Assignments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Attention Required */}
          <div className="bg-white border border-[#D9D5CB] rounded p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FF5A36]">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717]">
                Требует внимания
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DED5] rounded">
                <div className="font-bold text-[#171717]">Дедлайн через 2 дня</div>
                <div className="text-[#74736F] text-[11px] mt-0.5">
                  История Казахстана (11 «А») — 4 ученика еще не сдали тест.
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DED5] rounded">
                <div className="font-bold text-[#171717]">Лицензионные места</div>
                <div className="text-[#74736F] text-[11px] mt-0.5">
                  Использовано 28 из 60 мест. Доступно еще 32 учащихся.
                </div>
              </div>
            </div>
          </div>

          {/* Recent Published Assignments */}
          <div className="bg-white border border-[#D9D5CB] rounded p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717]">
                Последние задания
              </h3>
              <button
                type="button"
                onClick={onNavigateAssignments}
                className="text-xs text-[#FF5A36] font-semibold hover:underline cursor-pointer"
              >
                Все →
              </button>
            </div>

            <div className="space-y-2">
              {assignments.slice(0, 3).map((asg) => (
                <div key={asg.id} className="p-3 bg-[#FAF9F5] border border-[#E2DED5] rounded text-xs">
                  <div className="font-bold text-[#171717]">{asg.title}</div>
                  <div className="text-[11px] text-[#74736F] mt-1 flex items-center justify-between">
                    <span>Срок: {asg.deadline}</span>
                    <span className="text-[#258568] font-bold">Опубликовано</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
