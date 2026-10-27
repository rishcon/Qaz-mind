import React from 'react';
import { AlertTriangle, Loader2, Lock, RefreshCw } from 'lucide-react';

export const LoadingBlock: React.FC<{ text?: string }> = ({ text = 'Загрузка данных…' }) => (
  <div className="bg-white rounded-xl border border-[#E2DED5] p-8 flex items-center justify-center gap-2 text-xs text-[#78716C]">
    <Loader2 className="w-4 h-4 animate-spin" /> {text}
  </div>
);

export const ErrorBlock: React.FC<{ text: string; onRetry?: () => void }> = ({ text, onRetry }) => (
  <div role="alert" className="flex items-start gap-3 p-4 rounded-xl border border-[#FCA5A5] bg-[#FFF1F2] text-xs text-[#9F2F28]">
    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
    <span className="flex-1">Данные не загружены: {text}</span>
    {onRetry && (
      <button type="button" onClick={onRetry} className="flex items-center gap-1 font-semibold hover:underline cursor-pointer">
        <RefreshCw className="w-3.5 h-3.5" /> Повторить
      </button>
    )}
  </div>
);

export const ForbiddenBlock: React.FC = () => (
  <div className="bg-white rounded-xl border border-[#E2DED5] p-10 text-center space-y-2">
    <Lock className="w-6 h-6 text-[#A8A29E] mx-auto" />
    <h2 className="text-base font-bold text-[#171717]">Нет доступа</h2>
    <p className="text-xs text-[#78716C]">У вашей роли нет прав на этот раздел. Роли назначает владелец платформы.</p>
  </div>
);

/** Shown above a section whose server side does not exist yet: nothing on it is saved or loaded. */
export const SectionNotConnected: React.FC<{ what: string }> = ({ what }) => (
  <div
    role="status"
    className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-[#D89B35]/40 bg-[#FFF8EC] text-xs text-[#7A5410]"
  >
    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
    <span>
      Раздел ещё не подключён к серверу: {what}. Здесь нет данных, и изменения не сохраняются. Остальные разделы
      работают с реальной базой.
    </span>
  </div>
);

export const fmtDate = (value: string | null | undefined, withTime = false): string =>
  value
    ? new Date(value).toLocaleString('ru-RU', withTime
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
