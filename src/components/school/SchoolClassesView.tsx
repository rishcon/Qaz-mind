import React, { useState } from 'react';
import { Organization, SchoolClass, SchoolAssignment, OrganizationMember } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import {
  Plus,
  Users,
  Copy,
  Check,
  RefreshCw,
  Mail,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface SchoolClassesViewProps {
  organization: Organization;
  classes: SchoolClass[];
  assignments: SchoolAssignment[];
  teachers: OrganizationMember[];
  onRefresh: () => void;
  selectedClassId?: string | null;
  onSelectClass: (classId: string | null) => void;
}

export const SchoolClassesView: React.FC<SchoolClassesViewProps> = ({
  organization,
  classes,
  assignments,
  teachers,
  onRefresh,
  selectedClassId,
  onSelectClass,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026–2027');
  const [newTeacherId, setNewTeacherId] = useState('');

  // Class Detail Tab
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'assignments' | 'results'>('students');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const currentClass = selectedClassId ? classes.find((c) => c.id === selectedClassId) : null;
  const currentJoinCode = currentClass ? schoolService.getJoinCodeForClass(currentClass.id) : null;
  const classAssignments = currentClass
    ? assignments.filter((a) => a.classIds.includes(currentClass.id))
    : [];

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    schoolService.createClass(organization.id, newClassName.trim(), newAcademicYear, newTeacherId || undefined);
    setNewClassName('');
    setIsCreateModalOpen(false);
    onRefresh();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRegenerateCode = () => {
    if (!currentClass) return;
    schoolService.generateJoinCode(currentClass.id, organization.id);
    onRefresh();
  };

  const handleInviteStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@') || !currentClass) return;

    setInviteSuccess(`Приглашение отправлено на ${inviteEmail}.`);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(''), 3500);
  };

  // If a class detail is selected, render Class Detail View
  if (currentClass) {
    const classResults = schoolService
      .getAllResults()
      .filter((r) => r.classId === currentClass.id);

    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D5CB]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectClass(null)}
              className="p-1.5 hover:bg-white rounded text-[#74736F] hover:text-[#171717] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#171717] tracking-tight">
                  Класс {currentClass.name}
                </h1>
                <span className="text-xs font-mono bg-white border border-[#D9D5CB] px-2 py-0.5 rounded text-[#74736F]">
                  {currentClass.academicYear}
                </span>
              </div>
              <p className="text-xs text-[#74736F] mt-0.5">
                {organization.name} · {currentClass.studentIds.length || 16} учеников
              </p>
            </div>
          </div>

          {/* Join Code Widget */}
          {currentJoinCode && (
            <div className="flex items-center gap-3 p-3 bg-white border border-[#D9D5CB] rounded shadow-2xs">
              <div className="text-left">
                <span className="text-[10px] font-mono text-[#74736F] uppercase block">
                  Код для подключения:
                </span>
                <span className="text-base font-mono font-bold text-[#FF5A36] tracking-wider">
                  {currentJoinCode.code}
                </span>
              </div>

              <div className="flex items-center gap-1 border-l border-[#E2DED5] pl-3">
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentJoinCode.code)}
                  className="p-1.5 hover:bg-[#FAF9F5] text-[#171717] rounded cursor-pointer transition-colors"
                  title="Скопировать код"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#258568]" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="p-1.5 hover:bg-[#FAF9F5] text-[#74736F] hover:text-[#171717] rounded cursor-pointer transition-colors"
                  title="Обновить код"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Row */}
        <div className="flex items-center bg-white border border-[#D9D5CB] p-1 rounded max-w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'students' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
            }`}
          >
            Ученики ({currentClass.studentIds.length || 16})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'teachers' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
            }`}
          >
            Учителя ({currentClass.teacherIds.length || 1})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'assignments' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
            }`}
          >
            Задания ({classAssignments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'results' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
            }`}
          >
            Результаты ({classResults.length})
          </button>
        </div>

        {/* TAB 1: Students */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Quick Invite Form */}
            <div className="p-4 bg-white border border-[#D9D5CB] rounded flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Пригласить ученика по email
                </h3>
                <p className="text-[11px] text-[#74736F] mt-0.5">
                  Ученик получит ссылку с кодом класса. Или покажите ему код{' '}
                  <strong className="text-[#FF5A36]">{currentJoinCode?.code}</strong>.
                </p>
              </div>

              <form onSubmit={handleInviteStudent} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@example.kz"
                  className="px-3 py-1.5 text-xs bg-[#FAF9F5] border border-[#D9D5CB] rounded w-full sm:w-60 focus:outline-none focus:border-[#FF5A36]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] cursor-pointer whitespace-nowrap"
                >
                  Отправить
                </button>
              </form>
            </div>

            {inviteSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded">
                {inviteSuccess}
              </div>
            )}

            {/* Students List */}
            <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
              <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] flex justify-between">
                <span>Ученик</span>
                <span>Статус в классе</span>
              </div>

              <div className="divide-y divide-[#E2DED5] text-xs">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                      А
                    </div>
                    <div>
                      <div className="font-bold text-[#171717]">Алия Касымова</div>
                      <div className="text-[11px] text-[#74736F]">aliyah@qazmind.kz · Подключена по коду</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded font-bold">
                    Активна
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                      О
                    </div>
                    <div>
                      <div className="font-bold text-[#171717]">Олжас Сейдахметов</div>
                      <div className="text-[11px] text-[#74736F]">olzhas@gmail.com · Подключен по коду</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded font-bold">
                    Активен
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#74736F] text-white flex items-center justify-center font-bold text-xs">
                      Д
                    </div>
                    <div>
                      <div className="font-bold text-[#171717]">Дина Ахметова</div>
                      <div className="text-[11px] text-[#74736F]">dina.a@mail.kz · Приглашена</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#74736F] bg-[#FAF9F5] px-2 py-0.5 rounded">
                    Ожидает входа
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Teachers */}
        {activeTab === 'teachers' && (
          <div className="bg-white border border-[#D9D5CB] rounded p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#171717]">Закрепленные преподаватели</h3>
            <div className="space-y-3">
              <div className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#258568] text-white flex items-center justify-center font-bold text-xs">
                    Д
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#171717]">Даулет Бауржанович</div>
                    <div className="text-[11px] text-[#74736F]">daulet.teacher@lyceum28.kz · Преподаватель истории и биологии</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#258568]">Куратор класса</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Assignments */}
        {activeTab === 'assignments' && (
          <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
            <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] flex justify-between">
              <span>Задание</span>
              <span>Срок сдачи</span>
            </div>

            {classAssignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#74736F]">
                В этом классе пока нет назначенных заданий.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DED5]">
                {classAssignments.map((asg) => (
                  <div key={asg.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#171717]">{asg.title}</div>
                      <div className="text-[11px] text-[#74736F] mt-0.5">
                        Назначил: {asg.teacherName} · {asg.questionCount > 0 ? `${asg.questionCount} вопросов` : 'Урок'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[#171717]">до {asg.deadline}</div>
                      <span className="text-[10px] font-mono text-[#258568] font-bold">Опубликовано</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Results */}
        {activeTab === 'results' && (
          <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
            <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] flex justify-between">
              <span>Ученик</span>
              <span>Балл / Результат</span>
            </div>

            <div className="divide-y divide-[#E2DED5] text-xs">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#171717]">Олжас Сейдахметов</div>
                  <div className="text-[11px] text-[#74736F]">Казахское ханство — базовая практика</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded">
                    4 из 5 (80%)
                  </span>
                  <div className="text-[10px] text-[#74736F] mt-0.5">22 октября 2026</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render Classes Table List
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D5CB]">
        <div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Классы школы</h1>
          <p className="text-xs text-[#74736F] mt-0.5">
            Управляйте составом учащихся, закрепляйте учителей и распространяйте коды подключения.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Создать класс</span>
        </button>
      </div>

      {/* Classes Table */}
      <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
        <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] grid grid-cols-12 gap-4">
          <div className="col-span-4">Класс / Учебный год</div>
          <div className="col-span-3">Ученики</div>
          <div className="col-span-3">Код подключения</div>
          <div className="col-span-2 text-right">Действия</div>
        </div>

        <div className="divide-y divide-[#E2DED5]">
          {classes.map((cls) => {
            const joinCode = schoolService.getJoinCodeForClass(cls.id);
            return (
              <div
                key={cls.id}
                className="p-4 grid grid-cols-12 gap-4 items-center text-xs hover:bg-[#FAF9F5] transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-[#F5F3EE] border border-[#D9D5CB] flex items-center justify-center font-bold text-xs text-[#171717]">
                    {cls.name}
                  </span>
                  <div>
                    <div className="font-bold text-[#171717] text-sm">{cls.name}</div>
                    <div className="text-[11px] text-[#74736F]">{cls.academicYear}</div>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className="font-semibold text-[#171717]">
                    {cls.studentIds.length > 0 ? `${cls.studentIds.length} учеников` : '16 учеников'}
                  </span>
                </div>

                <div className="col-span-3">
                  {joinCode ? (
                    <span className="font-mono font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2 py-0.5 rounded">
                      {joinCode.code}
                    </span>
                  ) : (
                    <span className="text-[#74736F]">Не сгенерирован</span>
                  )}
                </div>

                <div className="col-span-2 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectClass(cls.id)}
                    className="px-3 py-1 bg-[#171717] hover:bg-black text-white text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Открыть →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D5CB] rounded p-6 max-w-md w-full shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#171717]">Создать новый класс</h2>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Название класса
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Например, 11 «В»"
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Учебный год
                </label>
                <input
                  type="text"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Куратор / Учитель (опционально)
                </label>
                <select
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded"
                >
                  <option value="">Без закрепления</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.userName} ({t.userEmail})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#EAE7DF] text-[#171717] font-semibold rounded hover:bg-[#D9D5CB] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF5A36] text-white font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs"
                >
                  Создать класс
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
