import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Download,
  MoreVertical,
  ExternalLink,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, AccountStatus } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ExportDialog } from '../components/ui/ExportDialog';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

interface UsersPageProps {
  onNavigate: (path: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user?: UserAccount;
    action?: 'suspend' | 'activate';
  }>({ open: false });

  const [exportOpen, setExportOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const users = adminService.getUsers({
    search,
    role: roleFilter,
    status: statusFilter,
  });

  const handleConfirmAction = () => {
    if (!confirmDialog.user || !confirmDialog.action) return;
    const newStatus: AccountStatus = confirmDialog.action === 'suspend' ? 'suspended' : 'active';
    try {
      adminService.updateUserStatus(confirmDialog.user.id, newStatus);
      setResult({ tone: 'success', text: newStatus === 'suspended' ? 'Доступ приостановлен.' : 'Доступ восстановлен.' });
    } catch (error) {
      setResult(failureResult(error));
    }
    setConfirmDialog({ open: false });
  };

  const columns: ColumnDef<UserAccount>[] = [
    {
      key: 'name',
      header: 'Пользователь',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#F0EEE8] border border-[#E2DED5] flex items-center justify-center font-bold text-xs text-[#5C574F]">
            {u.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717] hover:text-[#FF5A36] transition-colors">
              {u.name}
            </div>
            <div className="text-[11px] text-[#78716C]">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Тип аккаунта',
      sortable: true,
      cell: (u) => {
        const roleLabels: Record<string, string> = {
          student: 'Ученик ЕНТ',
          teacher: 'Преподаватель',
          school_admin: 'Админ школы',
          platform_admin: 'Администратор',
        };
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0EEE8] text-[#5C574F]">
            {roleLabels[u.role] || u.role}
          </span>
        );
      },
    },
    {
      key: 'organizationName',
      header: 'Организация / Школа',
      sortable: true,
      cell: (u) => (
        <span className="text-xs text-[#171717]">{u.organizationName || '— (Индивидуально)'}</span>
      ),
    },
    {
      key: 'registeredAt',
      header: 'Дата регистрации',
      sortable: true,
      cell: (u) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(u.registeredAt).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Последняя активность',
      sortable: true,
      cell: (u) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(u.lastActiveAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      headerClassName: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {u.status === 'active' ? (
            <button
              onClick={() => setConfirmDialog({ open: true, user: u, action: 'suspend' })}
              className="px-2 py-1 text-[11px] font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FDF2F2] cursor-pointer"
              title="Приостановить доступ"
            >
              Заблокировать
            </button>
          ) : (
            <button
              onClick={() => setConfirmDialog({ open: true, user: u, action: 'activate' })}
              className="px-2 py-1 text-[11px] font-medium text-[#258568] bg-white border border-[#A7F3D0] rounded hover:bg-[#EBF7F2] cursor-pointer"
              title="Восстановить доступ"
            >
              Активировать
            </button>
          )}

          <button
            onClick={() => onNavigate(`/admin/users/${u.id}`)}
            className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] cursor-pointer"
            title="Открыть подробный профиль"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter[] = [
    {
      key: 'role',
      label: 'Роль',
      selectedValue: roleFilter,
      onChange: setRoleFilter,
      options: [
        { label: 'Все роли', value: 'all' },
        { label: 'Ученики', value: 'student' },
        { label: 'Преподаватели', value: 'teacher' },
        { label: 'Админы школ', value: 'school_admin' },
      ],
    },
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Все статусы', value: 'all' },
        { label: 'Активные', value: 'active' },
        { label: 'На проверке', value: 'pending_verification' },
        { label: 'Заблокированные', value: 'suspended' },
      ],
    },
  ];

  const handleExport = (format: 'csv' | 'json', options: { includePii: boolean }) => {
    if (users.length === 0) {
      setResult({ tone: 'error', text: 'Список пуст: выгружать нечего.' });
      return;
    }
    const dataToExport = users.map((u) => ({
      ID: u.id,
      Имя: u.name,
      Email: u.email,
      Роль: u.role,
      Школа: u.organizationName || 'Индивидуально',
      Статус: u.status,
      Телефон: options.includePii ? u.phone || '' : '[Скрыто]',
      ЦелевойБалл: u.targetEntScore || '',
    }));

    const blob = new Blob(
      [
        format === 'csv'
          ? Object.keys(dataToExport[0]).join(',') +
            '\n' +
            dataToExport.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')).join('\n')
          : JSON.stringify(dataToExport, null, 2),
      ],
      { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qazmind_users_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Управление пользователями</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Реестр учетных записей платформы, проверка статусов и управление доступом к тестированию.
          </p>
        </div>

        <button
          onClick={() => setExportOpen(true)}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[#78716C]" /> Экспорт реестра
        </button>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {/* Main Data Table */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Поиск по имени, email или школе..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(u) => onNavigate(`/admin/users/${u.id}`)}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.open}
        title={
          confirmDialog.action === 'suspend'
            ? `Блокировка аккаунта: ${confirmDialog.user?.name}`
            : `Активация аккаунта: ${confirmDialog.user?.name}`
        }
        message={
          confirmDialog.action === 'suspend'
            ? 'Пользователь временно потеряет возможность проходить тестирование ЕНТ и сдавать задания преподавателя. Действие обратимо.'
            : 'Пользователь получит полный доступ к образовательному порталу и сдаче экзаменов.'
        }
        variant={confirmDialog.action === 'suspend' ? 'danger' : 'primary'}
        confirmLabel={confirmDialog.action === 'suspend' ? 'Заблокировать доступ' : 'Активировать'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false })}
      />

      {/* Export Modal */}
      <ExportDialog
        isOpen={exportOpen}
        title="Экспорт списка пользователей"
        itemCount={users.length}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};
