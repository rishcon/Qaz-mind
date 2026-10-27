import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, X, Check } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  title: string;
  itemCount: number;
  onClose: () => void;
  onExport: (format: 'csv' | 'json', options: { includePii: boolean }) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  title,
  itemCount,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includePii, setIncludePii] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleExportClick = () => {
    setIsExporting(true);
    setTimeout(() => {
      onExport(format, { includePii });
      setIsExporting(false);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 900);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
        <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#FF5A36]" />
            <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#171717]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#78716C]">
            Экспорт <span className="font-semibold text-[#171717]">{itemCount}</span> выбранных записей.
          </p>

          <div>
            <label className="text-xs font-medium text-[#171717] block mb-2">Формат файла</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'border-[#FF5A36] bg-[#FFF7F5] text-[#FF5A36]'
                    : 'border-[#E2DED5] bg-white text-[#78716C] hover:bg-[#F9F8F5]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">CSV</div>
                  <div className="text-[10px] text-[#A8A29E]">Excel / Таблицы</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  format === 'json'
                    ? 'border-[#FF5A36] bg-[#FFF7F5] text-[#FF5A36]'
                    : 'border-[#E2DED5] bg-white text-[#78716C] hover:bg-[#F9F8F5]'
                }`}
              >
                <FileJson className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">JSON</div>
                  <div className="text-[10px] text-[#A8A29E]">Для разработчиков</div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#F7F6F2] rounded-lg border border-[#E2DED5] flex items-start gap-2.5">
            <input
              type="checkbox"
              id="includePii"
              checked={includePii}
              onChange={(e) => setIncludePii(e.target.checked)}
              className="mt-0.5 rounded border-[#D5D0C5] text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
            />
            <label htmlFor="includePii" className="text-[11px] text-[#5C574F] cursor-pointer leading-tight">
              Включить полные контактные данные (телефоны и БИН) в выгрузку
            </label>
          </div>
        </div>

        <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#5C574F] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDone ? (
              <>
                <Check className="w-3.5 h-3.5" /> Готово
              </>
            ) : isExporting ? (
              'Экспорт...'
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Выгрузить файл
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
