import React, { useState } from 'react';
import { Organization, OrganizationMember, SchoolClass } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import { Plus, GraduationCap, Mail, ShieldAlert, Check } from 'lucide-react';

interface SchoolTeachersViewProps {
  organization: Organization;
  teachers: OrganizationMember[];
  classes: SchoolClass[];
  onRefresh: () => void;
}

export const SchoolTeachersView: React.FC<SchoolTeachersViewProps> = ({
  organization,
  teachers,
  classes,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    schoolService.inviteTeacher(organization.id, email.trim(), name.trim(), selectedClassIds);
    setToast(`Приглашение отправлено преподавателю на ${email}.`);
    setName('');
    setEmail('');
    setSelectedClassIds([]);
    setIsModalOpen(false);
    onRefresh();
    setTimeout(() => setToast(''), 3500);
  };

  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleRevoke = (memberId: string) => {
    if (confirm('Отозвать доступ преподавателя к школьному пространству?')) {
      schoolService.revokeMember(memberId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D5CB]">
        <div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Преподаватели школы</h1>
          <p className="text-xs text-[#74736F] mt-0.5">
            Учителя имеют доступ к назначению заданий и просмотру результатов только по закрепленным за ними классам.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Пригласить учителя</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded">
          {toast}
        </div>
      )}

      {/* Teachers List */}
      <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
        <div className="p-3.5 bg-[#FAF9F5] border-b border-[#D9D5CB] text-xs font-mono font-bold uppercase text-[#74736F] grid grid-cols-12 gap-4">
          <div className="col-span-4">Преподаватель / Email</div>
          <div className="col-span-4">Закрепленные классы</div>
          <div className="col-span-2">Статус</div>
          <div className="col-span-2 text-right">Действия</div>
        </div>

        <div className="divide-y divide-[#E2DED5]">
          {teachers.map((teacher) => {
            const assignedClasses = classes.filter((c) =>
              teacher.classIds ? teacher.classIds.includes(c.id) : c.teacherIds.includes(teacher.userId)
            );

            return (
              <div
                key={teacher.id}
                className="p-4 grid grid-cols-12 gap-4 items-center text-xs hover:bg-[#FAF9F5] transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#258568] text-white flex items-center justify-center font-bold text-xs">
                    {teacher.userName[0] || 'У'}
                  </span>
                  <div>
                    <div className="font-bold text-[#171717]">{teacher.userName}</div>
                    <div className="text-[11px] text-[#74736F]">{teacher.userEmail}</div>
                  </div>
                </div>

                <div className="col-span-4 flex flex-wrap gap-1.5">
                  {assignedClasses.length > 0 ? (
                    assignedClasses.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 bg-[#F5F3EE] border border-[#D9D5CB] text-[11px] font-bold rounded"
                      >
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#74736F] text-[11px]">Нет закрепленных классов</span>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] font-mono font-bold text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded">
                    Активен
                  </span>
                </div>

                <div className="col-span-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleRevoke(teacher.id)}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Отозвать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D5CB] rounded p-6 max-w-md w-full shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#171717]">Пригласить преподавателя</h2>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  ФИО преподавателя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например, Бауржанов Даулет"
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Рабочий Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.kz"
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F5] border border-[#D9D5CB] rounded focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Закрепить за классами
                </label>
                <div className="space-y-1.5 p-2 bg-[#FAF9F5] border border-[#D9D5CB] rounded max-h-36 overflow-y-auto">
                  {classes.map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClass(cls.id)}
                          className="rounded text-[#FF5A36]"
                        />
                        <span className="font-bold text-[#171717]">{cls.name}</span>
                        <span className="text-[#74736F] text-[10px]">({cls.academicYear})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#EAE7DF] text-[#171717] font-semibold rounded hover:bg-[#D9D5CB] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF5A36] text-white font-bold rounded hover:bg-[#e04825] cursor-pointer shadow-xs"
                >
                  Отправить приглашение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
