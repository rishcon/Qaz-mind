import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { ADMIN_API_CONNECTED } from '../../services/adminService';

/** Always visible while the administrative API is not connected. It states the fact; it shows no data. */
export const ConnectionStatusBar: React.FC = () => {
  if (ADMIN_API_CONNECTED) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-[#D89B35]/40 bg-[#FFF8EC] text-xs text-[#7A5410]"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
      <span>
        Сервер администрирования не подключён. Списки и показатели не загружены, изменения не сохраняются.
      </span>
    </div>
  );
};

/** Outcome of the last action on a screen. A refused action is an error, never a success. */
export interface ActionResult {
  tone: 'success' | 'error';
  text: string;
}

/** Turns an error thrown by adminService into a result. Refusals carry their own explanation. */
export function failureResult(error: unknown): ActionResult {
  return { tone: 'error', text: error instanceof Error ? error.message : 'Действие не выполнено.' };
}

interface ActionResultNoticeProps {
  result: ActionResult | null;
  onDismiss: () => void;
}

/** Shown next to the control that triggered the action. Success is shown only after the call actually succeeded. */
export const ActionResultNotice: React.FC<ActionResultNoticeProps> = ({ result, onDismiss }) => {
  if (!result) return null;
  const isError = result.tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
        isError ? 'bg-[#FFF1F2] border-[#FCA5A5] text-[#9F2F28]' : 'bg-[#EBF7F2] border-[#258568]/30 text-[#1D6A53]'
      }`}
    >
      {isError ? <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /> : <Check className="w-4 h-4 shrink-0 mt-px" />}
      <span className="flex-1 font-semibold">{result.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Закрыть"
        className="opacity-60 hover:opacity-100 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
