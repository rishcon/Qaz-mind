import React, { useState } from 'react';
import { CreditCard, Building2, Users, AlertTriangle, ShieldCheck, Check, Edit3 } from 'lucide-react';
import { DemoBadge } from '../components/ui/DemoBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockDb } from '../repositories/mockDatabase';
import { adminService } from '../services/adminService';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'plans'>('licenses');
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [newSeats, setNewSeats] = useState<number>(300);
  const [savedNotice, setSavedNotice] = useState(false);

  const schools = adminService.getSchools();

  const handleUpdateQuota = (schoolId: string) => {
    adminService.updateSchoolSeats(schoolId, newSeats);
    setEditingSchoolId(null);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#171717]">Подписки, лицензии и финансы</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Администрирование школьных квот, распределение лицензионных пакетов и учет тарифных планов.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
              activeTab === 'licenses' ? 'bg-[#FF5A36] text-white shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Школьные лицензии
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
              activeTab === 'plans' ? 'bg-[#FF5A36] text-white shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Тарифные планы
          </button>
        </div>
      </div>

      <div className="p-3.5 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-xl text-xs text-[#9A6715] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Финансовые операции отображаются в режиме демонстрации архитектурных интерфейсов.
          Реальный биллинг будет подключен через платежный шлюз бэкенда FastAPI.
        </span>
      </div>

      {savedNotice && (
        <div className="p-3 bg-[#EBF7F2] border border-[#258568]/30 rounded-xl text-xs font-semibold text-[#1D6A53] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Квота лицензий успешно скорректирована и зафиксирована в аудите!
        </div>
      )}

      {/* Licenses View */}
      {activeTab === 'licenses' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Распределение лицензий по подключенным школам
          </h2>

          <div className="divide-y divide-[#E2DED5] text-xs">
            {schools.map((s) => (
              <div key={s.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[#171717]">{s.name}</div>
                  <div className="text-[#78716C] mt-0.5">
                    {s.city} • Срок действия до: {new Date(s.licenseExpiresAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs font-bold text-[#171717]">
                      {s.assignedSeats} / {s.purchasedSeats} мест
                    </div>
                    <div className="text-[10px] text-[#258568]">
                      Занято {Math.round((s.assignedSeats / s.purchasedSeats) * 100)}%
                    </div>
                  </div>

                  <StatusBadge status={s.licenseStatus} />

                  {editingSchoolId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={newSeats}
                        onChange={(e) => setNewSeats(Number(e.target.value))}
                        className="w-20 text-xs px-2 py-1 border border-[#E2DED5] rounded font-bold"
                      />
                      <button
                        onClick={() => handleUpdateQuota(s.id)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#258568] rounded cursor-pointer"
                      >
                        ОК
                      </button>
                      <button
                        onClick={() => setEditingSchoolId(null)}
                        className="px-2 py-1 text-xs text-[#78716C] border rounded cursor-pointer"
                      >
                        Х
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingSchoolId(s.id);
                        setNewSeats(s.purchasedSeats);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-[#171717] bg-[#FAF9F6] border border-[#E2DED5] rounded hover:bg-[#F5F3EE] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#FF5A36]" /> Изменить квоту
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans View */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#E2DED5] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">Базовый</span>
            <h3 className="text-lg font-bold text-[#171717]">QazMind Free</h3>
            <p className="text-xs text-[#78716C]">Для самостоятельного знакомства учеников с форматом ЕНТ.</p>
            <div className="text-2xl font-bold text-[#171717] pt-2">₸ 0</div>
            <ul className="text-xs space-y-1.5 text-[#5C574F] pt-3 border-t border-[#E2DED5]">
              <li>• Доступ к 3 вводным урокам по предмету</li>
              <li>• 1 пробный экзамен в месяц</li>
              <li>• Базовая статистика ошибок</li>
            </ul>
          </div>

          <div className="bg-[#FFF7F5] p-6 rounded-xl border border-[#FF5A36]/40 space-y-3 shadow-xs relative">
            <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5A36] text-white uppercase">
              Популярный
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A36]">Индивидуальный</span>
            <h3 className="text-lg font-bold text-[#171717]">QazMind Plus</h3>
            <p className="text-xs text-[#78716C]">Полный безлимитный доступ ко всем предметам и банку заданий.</p>
            <div className="text-2xl font-bold text-[#FF5A36] pt-2">₸ 4,990 <span className="text-xs font-normal text-[#78716C]">/ месяц</span></div>
            <ul className="text-xs space-y-1.5 text-[#5C574F] pt-3 border-t border-[#E2DED5]">
              <li>• Неограниченная сдача официальных пробных ЕНТ</li>
              <li>• Полный банк пояснений и разборов</li>
              <li>• Индивидуальный трекер баллов до гранта</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2DED5] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#258568]">Для школ</span>
            <h3 className="text-lg font-bold text-[#171717]">QazMind Schools</h3>
            <p className="text-xs text-[#78716C]">Для лицеев, гимназий и образовательных центров с кабинетом учителя.</p>
            <div className="text-2xl font-bold text-[#171717] pt-2">Корпоративный</div>
            <ul className="text-xs space-y-1.5 text-[#5C574F] pt-3 border-t border-[#E2DED5]">
              <li>• Выделенный пул ученических лицензий</li>
              <li>• Кабинеты учителей и аналитика по классам</li>
              <li>• Создание и назначение домашних срезов ЕНТ</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
