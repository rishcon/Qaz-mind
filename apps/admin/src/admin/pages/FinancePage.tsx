import React, { useState } from 'react';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { adminService, ADMIN_API_CONNECTED } from '../services/adminService';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

/**
 * School licences and seats. Billing is not connected: the ТЗ (6.7) keeps payments out of the MVP and the price
 * model is still an open decision (22.10), so no prices or plans are shown here.
 */
export const FinancePage: React.FC = () => {
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [newSeats, setNewSeats] = useState<number>(0);
  const [result, setResult] = useState<ActionResult | null>(null);

  const schools = adminService.getSchools();

  const handleUpdateQuota = (schoolId: string) => {
    try {
      adminService.updateSchoolSeats(schoolId, newSeats);
      setEditingSchoolId(null);
      setResult({ tone: 'success', text: 'Квота обновлена.' });
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Подписки и лицензии</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Учёт школьных лицензий и мест: сколько мест куплено, сколько занято, до какого срока действует лицензия.
        </p>
      </div>

      <div className="p-3.5 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-xl text-xs text-[#9A6715] flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
        <span>
          Платежи не подключены. Тарифы и цены не показываются: ценовая модель ещё не утверждена.
          Подключение платёжного сервиса — отдельная задача.
        </span>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Лицензии школ</h2>

        {schools.length === 0 ? (
          <p className="py-6 text-xs text-[#78716C]">
            {ADMIN_API_CONNECTED ? 'Школ с лицензиями нет.' : 'Данные не загружены: сервер администрирования не подключён.'}
          </p>
        ) : (
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
                      {s.purchasedSeats > 0 ? `Занято ${Math.round((s.assignedSeats / s.purchasedSeats) * 100)}%` : 'Мест не куплено'}
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
                        Отмена
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
        )}
      </div>
    </div>
  );
};
