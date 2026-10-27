import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Edit3,
  Check,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockDb } from '../repositories/mockDatabase';

interface SchoolDetailPageProps {
  schoolId: string;
  onNavigate: (path: string) => void;
}

export const SchoolDetailPage: React.FC<SchoolDetailPageProps> = ({ schoolId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'teachers' | 'licenses'>('overview');
  const [seatsEditMode, setSeatsEditMode] = useState(false);
  const [newSeatsValue, setNewSeatsValue] = useState<number>(300);
  const [seatsSavedToast, setSeatsSavedToast] = useState(false);

  const school = adminService.getSchoolById(schoolId);

  if (!school) {
    return (
      <div className="bg-white rounded-xl border border-[#E2DED5] p-12 text-center">
        <h2 className="text-base font-bold text-[#171717]">Школа не найдена</h2>
        <button
          onClick={() => onNavigate('/admin/schools')}
          className="mt-4 px-4 py-2 bg-[#FF5A36] text-white text-xs font-semibold rounded-md"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const schoolTeachers = mockDb.users.filter((u) => u.role === 'teacher' && u.organizationId === school.id);
  const schoolStudents = mockDb.users.filter((u) => u.role === 'student' && u.organizationId === school.id);

  const handleSaveSeats = () => {
    adminService.updateSchoolSeats(school.id, newSeatsValue);
    setSeatsEditMode(false);
    setSeatsSavedToast(true);
    setTimeout(() => setSeatsSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/admin/schools')}
              className="p-1.5 rounded-md hover:bg-[#F5F3EE] text-[#78716C] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#171717]" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#FFF7F5] border border-[#FF5A36]/30 flex items-center justify-center text-[#FF5A36]">
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-[#171717]">{school.name}</h1>
                <StatusBadge status={school.approvalStatus} />
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                {school.city} • БИН: <span className="font-mono">{school.binNumber}</span> • Лицензия: {school.purchasedSeats} мест
              </p>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex items-center gap-1 border-t border-[#E2DED5] mt-6 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Обзор и контакты' },
            { id: 'classes', label: `Классы (${school.totalClasses})` },
            { id: 'teachers', label: `Преподаватели (${school.totalTeachers})` },
            { id: 'licenses', label: 'Управление лицензиями' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Официальные реквизиты школы
            </h3>
            <div className="divide-y divide-[#E2DED5] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Город / Регион:</span>
                <span className="font-semibold text-[#171717]">{school.city}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">БИН организации:</span>
                <span className="font-mono text-[#171717]">{school.binNumber}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Контактное лицо:</span>
                <span className="font-medium text-[#171717]">{school.contactPerson}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Email:</span>
                <span className="font-mono text-[#171717]">{school.contactEmail}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#78716C]">Телефон:</span>
                <span className="font-mono text-[#171717]">{school.contactPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Статистика использования платформы
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg">
                <div className="text-xs text-[#78716C]">Учащихся в системе</div>
                <div className="text-xl font-bold text-[#171717] mt-1">{school.totalStudents}</div>
              </div>
              <div className="p-3 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg">
                <div className="text-xs text-[#78716C]">Учителей активно</div>
                <div className="text-xl font-bold text-[#171717] mt-1">{school.totalTeachers}</div>
              </div>
              <div className="p-3 bg-[#EBF7F2] border border-[#258568]/20 rounded-lg">
                <div className="text-xs text-[#1D6A53]">Занято мест</div>
                <div className="text-xl font-bold text-[#258568] mt-1">
                  {Math.round((school.assignedSeats / school.purchasedSeats) * 100)}%
                </div>
              </div>
              <div className="p-3 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg">
                <div className="text-xs text-[#78716C]">Всего классов</div>
                <div className="text-xl font-bold text-[#171717] mt-1">{school.totalClasses}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Список классов и параллелей
          </h3>
          <div className="divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg overflow-hidden text-xs">
            {(school.classesList || [
              { id: 'c-1', name: '11-А (ФизМат)', studentCount: 28, grade: '11' },
              { id: 'c-2', name: '11-Б (ХимБио)', studentCount: 26, grade: '11' },
              { id: 'c-3', name: '10-А (Подготовка к ЕНТ)', studentCount: 30, grade: '10' },
            ]).map((cl) => (
              <div key={cl.id} className="p-3 flex items-center justify-between hover:bg-[#FAF9F6]">
                <div className="font-semibold text-[#171717]">{cl.name}</div>
                <span className="text-[#78716C]">{cl.studentCount} учеников</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEACHERS */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Прикрепленные преподаватели
          </h3>
          <div className="divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg overflow-hidden text-xs">
            {schoolTeachers.length === 0 ? (
              <p className="p-4 text-[#78716C]">Преподаватели еще не зарегистрировали профили.</p>
            ) : (
              schoolTeachers.map((t) => (
                <div key={t.id} className="p-3 flex items-center justify-between hover:bg-[#FAF9F6]">
                  <div>
                    <div className="font-semibold text-[#171717]">{t.name}</div>
                    <div className="text-[11px] text-[#78716C]">{t.email}</div>
                  </div>
                  <button
                    onClick={() => onNavigate(`/admin/users/${t.id}`)}
                    className="text-xs text-[#FF5A36] font-medium hover:underline"
                  >
                    Профиль учителя →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LICENSES ALLOCATION */}
      {activeTab === 'licenses' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Распределение ученических мест и лицензий
          </h3>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Администратор платформы может выделить дополнительный лимит мест для школы при заключении договора или продлении подписки.
          </p>

          <div className="p-4 bg-[#FAF9F6] border border-[#E2DED5] rounded-xl space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#78716C]">Текущий оплаченный лимит мест:</span>
              <span className="font-bold text-[#171717] text-sm">{school.purchasedSeats} мест</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#78716C]">Фактически активировано учениками:</span>
              <span className="font-bold text-[#258568]">{school.assignedSeats} мест</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#78716C]">Доступно для регистрации:</span>
              <span className="font-bold text-[#FF5A36]">{school.purchasedSeats - school.assignedSeats} мест</span>
            </div>
          </div>

          {!seatsEditMode ? (
            <button
              onClick={() => {
                setNewSeatsValue(school.purchasedSeats);
                setSeatsEditMode(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#333] rounded-md cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> Изменить квоту мест школы
            </button>
          ) : (
            <div className="p-4 border border-[#FF5A36]/30 bg-[#FFF7F5] rounded-xl space-y-3">
              <label className="text-xs font-bold text-[#171717] block">
                Новый лимит мест для учащихся:
              </label>
              <input
                type="number"
                min={school.assignedSeats}
                value={newSeatsValue}
                onChange={(e) => setNewSeatsValue(Number(e.target.value))}
                className="w-full text-sm font-bold px-3 py-2 bg-white border border-[#E2DED5] rounded-md"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveSeats}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded cursor-pointer shadow-xs"
                >
                  Сохранить квоту
                </button>
                <button
                  onClick={() => setSeatsEditMode(false)}
                  className="px-3 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE]"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {seatsSavedToast && (
            <div className="p-3 bg-[#EBF7F2] text-[#1D6A53] rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" /> Квота мест успешно обновлена. Событие внесено в аудит.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
