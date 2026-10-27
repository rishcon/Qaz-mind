import React, { useState } from 'react';
import { FileQuestion } from 'lucide-react';
import { ContentReport } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

interface ReportsPageProps {
  onNavigate: (path: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  // The resolution is the methodologist's own text. It is never pre-filled, because it records what was done.
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);

  const reports = adminService.getContentReports({ status: statusFilter });

  // A refused resolution keeps the report open with the typed resolution.
  const handleResolve = (action: 'resolved' | 'rejected') => {
    if (!selectedReport || !resolutionNotes.trim()) return;
    try {
      adminService.resolveReport(selectedReport.id, action, resolutionNotes.trim());
      setSelectedReport(null);
      setResolutionNotes('');
      setResult({
        tone: 'success',
        text: action === 'resolved' ? 'Жалоба помечена решённой.' : 'Жалоба отклонена.',
      });
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  const columns: ColumnDef<ContentReport>[] = [
    {
      key: 'questionId',
      header: 'ID вопроса',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-[#FF5A36]">{r.questionId}</span>
      ),
    },
    {
      key: 'questionPreview',
      header: 'Фрагмент вопроса',
      cell: (r) => (
        <div>
          <div className="text-xs font-semibold text-[#171717] line-clamp-1">{r.questionPreview}</div>
          <div className="text-[11px] text-[#78716C]">{r.subjectName}</div>
        </div>
      ),
    },
    {
      key: 'reportType',
      header: 'Тип жалобы',
      sortable: true,
      cell: (r) => {
        const typeLabels: Record<string, string> = {
          wrong_answer: 'Неверный ключ ответа',
          typo: 'Опечатка в тексте',
          unclear_wording: 'Непонятная формулировка',
          translation_error: 'Ошибка перевода (KZ/RU)',
          missing_image: 'Нет иллюстрации',
          other: 'Другое',
        };
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFF1F2] text-[#BE123C]">
            {typeLabels[r.reportType] || r.reportType}
          </span>
        );
      },
    },
    {
      key: 'reporterName',
      header: 'Автор жалобы',
      cell: (r) => <span className="text-xs text-[#171717]">{r.reporterName}</span>,
    },
    {
      key: 'reportDate',
      header: 'Дата',
      sortable: true,
      cell: (r) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(r.reportDate).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const filters: TableFilter[] = [];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Жалобы учащихся на контент ЕНТ</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Обработка замечаний по ключам ответов, ошибкам перевода и разночтениям с учебниками.
        </p>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      <DataTable
        data={reports}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Поиск по ID или формулировке..."
        filters={filters}
        onRowClick={(r) => {
          setResult(null);
          setSelectedReport(r);
        }}
      />

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Разбор жалобы на вопрос #{selectedReport.questionId}
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-xs font-semibold text-[#78716C] hover:text-[#171717]"
              >
                Закрыть
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[#78716C] block mb-1">Предмет: {selectedReport.subjectName}</span>
                <p className="text-sm font-semibold text-[#171717]">{selectedReport.questionPreview}</p>
              </div>

              <div className="p-3 bg-[#FFF1F2] border border-[#FCA5A5]/30 rounded-lg space-y-1">
                <span className="font-bold text-[#991B1B]">Комментарий учащегося:</span>
                <p className="text-[#171717] leading-relaxed">{selectedReport.userComment}</p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate(`/admin/content/questions/${selectedReport.questionId}`)}
                  className="px-3 py-1.5 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md hover:bg-[#FFEFEA] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileQuestion className="w-3.5 h-3.5" /> Открыть вопрос в редакторе →
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-[#171717] block">Резолюция методиста:</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Что проверено и что изменено"
                  className="w-full text-xs p-2 bg-white border border-[#E2DED5] rounded-md"
                />
              </div>

              <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
            </div>

            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={!resolutionNotes.trim()}
                onClick={() => handleResolve('rejected')}
                className="px-3.5 py-1.5 text-xs text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FFF1F2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Отклонить как необоснованную
              </button>
              <button
                type="button"
                disabled={!resolutionNotes.trim()}
                onClick={() => handleResolve('resolved')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Пометить решенной
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
