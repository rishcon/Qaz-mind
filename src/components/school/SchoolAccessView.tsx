import React from 'react';
import { Organization } from '../../types/school';
import { ShieldCheck, Calendar, Users, Award, AlertCircle } from 'lucide-react';

interface SchoolAccessViewProps {
  organization: Organization;
}

export const SchoolAccessView: React.FC<SchoolAccessViewProps> = ({ organization }) => {
  const license = organization.licenses;
  const remaining = license.totalSeats - license.usedSeats;
  const percentUsed = Math.round((license.usedSeats / license.totalSeats) * 100);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#D9D5CB]">
        <h1 className="text-2xl font-black text-[#171717] tracking-tight">Доступы и лицензирование</h1>
        <p className="text-xs text-[#74736F] mt-0.5">
          Управление институциональной подпиской, лимитом ученических мест и сроком действия доступа.
        </p>
      </div>

      {/* License Summary Card */}
      <div className="bg-white border border-[#D9D5CB] rounded p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#258568]/10 text-[#258568] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase text-[#258568]">Активная лицензия</div>
              <h2 className="text-lg font-bold text-[#171717]">{license.planName}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-[#74736F]">Действует до:</span>
            <div className="font-bold text-sm text-[#171717]">
              {new Date(license.expiresAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>

        {/* Progress Bar of seats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#171717] font-bold">
              Использовано мест: {license.usedSeats} из {license.totalSeats}
            </span>
            <span className="text-[#74736F]">Свободно: {remaining} мест</span>
          </div>

          <div className="w-full h-3 bg-[#FAF9F5] border border-[#E2DED5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#258568] transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E2DED5] text-xs">
          <div>
            <span className="text-[#74736F] text-[11px] block">Тип лицензии:</span>
            <strong className="text-[#171717]">Школьная (ЕНТ 2026/2027)</strong>
          </div>
          <div>
            <span className="text-[#74736F] text-[11px] block">Предметы:</span>
            <strong className="text-[#171717]">Все 5 предметов + Симулятор</strong>
          </div>
          <div>
            <span className="text-[#74736F] text-[11px] block">Автопродление:</span>
            <strong className="text-[#171717]">По договору с организацией</strong>
          </div>
        </div>
      </div>

      {/* Institutional Privacy Guarantee */}
      <div className="p-4 bg-[#FAF9F5] border border-[#D9D5CB] rounded text-xs text-[#74736F] space-y-2">
        <div className="flex items-center gap-2 text-[#171717] font-bold">
          <AlertCircle className="w-4 h-4 text-[#FF5A36]" />
          <span>Разграничение личных и школьных данных</span>
        </div>
        <p>
          Школа оплачивает доступ учащихся к образовательным материалам. При окончании лицензии ученики сохраняют
          свои личные аккаунты, выбранные профильные пары и историю прохождения ЕНТ без риска потери прогресса.
        </p>
      </div>
    </div>
  );
};
