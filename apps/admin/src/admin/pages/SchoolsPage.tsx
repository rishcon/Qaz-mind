import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  ExternalLink,
  Users,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SchoolOrganization, SchoolApprovalStatus } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

interface SchoolsPageProps {
  onNavigate: (path: string) => void;
}

export const SchoolsPage: React.FC<SchoolsPageProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<'all' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Approval modal
  const [selectedSchool, setSelectedSchool] = useState<SchoolOrganization | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);

  const schools = adminService.getSchools({
    search,
    status: activeView === 'pending' ? 'pending_verification' : statusFilter,
    city: cityFilter,
  });

  const pendingCount = adminService.getSchools({ status: 'pending_verification' }).length;

  // City filter options come from the schools themselves, not from a fixed list.
  const cityOptions = Array.from(new Set(adminService.getSchools().map((s) => s.city)))
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((city) => ({ label: city, value: city }));

  const closeDialogs = () => {
    setApproveDialogOpen(false);
    setRejectDialogOpen(false);
    setSelectedSchool(null);
  };

  const handleApprove = () => {
    if (!selectedSchool) return;
    try {
      adminService.approveSchool(selectedSchool.id);
      setResult({ tone: 'success', text: 'Заявка школы одобрена.' });
    } catch (error) {
      setResult(failureResult(error));
    }
    closeDialogs();
  };

  const handleReject = () => {
    if (!selectedSchool || !rejectReason.trim()) return;
    try {
      adminService.rejectSchool(selectedSchool.id, rejectReason.trim());
      setResult({ tone: 'success', text: 'Заявка школы отклонена.' });
    } catch (error) {
      setResult(failureResult(error));
    }
    setRejectReason('');
    closeDialogs();
  };

  const columns: ColumnDef<SchoolOrganization>[] = [
    {
      key: 'name',
      header: 'Школа / Организация',
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717] hover:text-[#FF5A36] transition-colors">
              {s.name}
            </div>
            <div className="text-[11px] text-[#78716C]">
              {s.city} • БИН: <span className="font-mono">{s.binNumber}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Тип заведения',
      sortable: true,
      cell: (s) => {
        const typeMap: Record<string, string> = {
          lyceum: 'Лицей',
          gymnasium: 'Гимназия',
          nis: 'НИШ',
          bil: 'БИЛ (КТЛ)',
          private_school: 'Частная школа',
          public_school: 'Общеобразовательная',
        };
        return (
          <span className="text-xs font-medium text-[#5C574F]">
            {typeMap[s.type] || s.type}
          </span>
        );
      },
    },
    {
      key: 'totalStudents',
      header: 'Учащихся',
      sortable: true,
      cell: (s) => (
        <span className="font-semibold text-xs text-[#171717]">
          {s.totalStudents} <span className="text-[11px] text-[#78716C] font-normal">чел.</span>
        </span>
      ),
    },
    {
      key: 'assignedSeats',
      header: 'Места / Лицензия',
      sortable: true,
      cell: (s) => (
        <div>
          <div className="text-xs font-semibold text-[#171717]">
            {s.assignedSeats} / {s.purchasedSeats}
          </div>
          <div className="text-[10px] text-[#258568] font-medium">
            Лицензия: <StatusBadge status={s.licenseStatus} size="sm" />
          </div>
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Статус заявки',
      sortable: true,
      cell: (s) => <StatusBadge status={s.approvalStatus} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      headerClassName: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {s.approvalStatus === 'pending_verification' ? (
            <>
              <button
                onClick={() => {
                  setSelectedSchool(s);
                  setApproveDialogOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded cursor-pointer shadow-2xs"
              >
                Одобрить
              </button>
              <button
                onClick={() => {
                  setSelectedSchool(s);
                  setRejectDialogOpen(true);
                }}
                className="px-2 py-1 text-xs text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FFF1F2] cursor-pointer"
              >
                Отклонить
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate(`/admin/schools/${s.id}`)}
              className="px-2.5 py-1 text-xs text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] cursor-pointer"
            >
              Подробнее →
            </button>
          )}
        </div>
      ),
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'city',
      label: 'Город',
      selectedValue: cityFilter,
      onChange: setCityFilter,
      options: [
        { label: 'Все города', value: 'all' },
        ...cityOptions,
      ],
    },
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Все статусы', value: 'all' },
        { label: 'Одобренные', value: 'approved' },
        { label: 'На проверке', value: 'pending_verification' },
        { label: 'Отклоненные', value: 'rejected' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Школы и учебные заведения</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Управление организациями, одобрение заявок на подключение и распределение школьных лицензий ЕНТ.
          </p>
        </div>

        {/* View toggle tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          <button
            onClick={() => setActiveView('all')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
              activeView === 'all'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#171717]'
            }`}
          >
            Все школы ({adminService.getSchools().length})
          </button>
          <button
            onClick={() => setActiveView('pending')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer ${
              activeView === 'pending'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#171717]'
            }`}
          >
            <span>Заявки на верификацию</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeView === 'pending' ? 'bg-white text-[#FF5A36]' : 'bg-[#FF5A36] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {/* Main Table */}
      <DataTable
        data={schools}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Поиск по названию школы или городу..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={activeView === 'all' ? filters : undefined}
        onRowClick={(s) => onNavigate(`/admin/schools/${s.id}`)}
      />

      {/* Approval Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={approveDialogOpen}
        title={`Одобрить заявку: ${selectedSchool?.name}`}
        message="Статус заявки школы изменится на «Одобрено»."
        variant="primary"
        confirmLabel="Одобрить подключение"
        onConfirm={handleApprove}
        onCancel={() => setApproveDialogOpen(false)}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={rejectDialogOpen}
        title={`Отклонить заявку: ${selectedSchool?.name}`}
        message="Укажите причину отклонения заявки."
        variant="danger"
        confirmLabel="Отклонить заявку"
        confirmDisabled={!rejectReason.trim()}
        onConfirm={handleReject}
        onCancel={() => setRejectDialogOpen(false)}
      >
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Причина отклонения"
          className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
        />
      </ConfirmationDialog>
    </div>
  );
};
