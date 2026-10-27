import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional content under the message, for example a reason field. */
  children?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'primary',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          btn: 'bg-[#C94A43] hover:bg-[#B33F39] text-white',
          icon: <AlertTriangle className="w-5 h-5 text-[#C94A43]" />,
        };
      case 'warning':
        return {
          btn: 'bg-[#D89B35] hover:bg-[#C2892C] text-white',
          icon: <AlertTriangle className="w-5 h-5 text-[#D89B35]" />,
        };
      case 'primary':
      default:
        return {
          btn: 'bg-[#FF5A36] hover:bg-[#E84D2B] text-white',
          icon: <Info className="w-5 h-5 text-[#FF5A36]" />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#F5F3EE] flex items-center justify-center shrink-0">
              {styles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
              <p className="mt-1 text-xs text-[#78716C] leading-relaxed">{message}</p>

              {children && <div className="mt-3">{children}</div>}
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-[#5C574F] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${styles.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
