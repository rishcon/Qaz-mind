import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { adminApi, OrganizationRow, SchoolApplication } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, ForbiddenBlock, fmtDate } from '../components/ui/PageState';

interface SchoolsPageProps {
  onNavigate: (path: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  school: 'Школа',
  lyceum: 'Лицей',
  gymnasium: 'Гимназия',
  college: 'Колледж',
  tutoring_center: 'Учебный центр',
  other: 'Другое',
};

type View = 'applications' | 'organizations';

export const SchoolsPage: React.FC<SchoolsPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const [view, setView] = useState<View>('applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const [selected, setSelected] = useState<SchoolApplication | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [licenseFor, setLicenseFor] = useState<OrganizationRow | null>(null);
  const [plan, setPlan] = useState('pilot');
  const [seats, setSeats] = useState('');
  const [months, setMonths] = useState('12');
  const [result, setResult] = useState<ActionResult | null>(null);

  const allowed = can('schools.read');
  const canDecide = can('schools.approve');
  const applications = useAdminData(() => (allowed ? adminApi.schoolApplications() : Promise.resolve({ items: [] })), [allowed], 30000);
  const organizations = useAdminData(() => (allowed ? adminApi.organizations() : Promise.resolve({ items: [] })), [allowed], 30000);

  if (!allowed) return <ForbiddenBlock />;

  const needle = search.trim().toLowerCase();
  const matches = (...parts: string[]) => !needle || parts.some((p) => p.toLowerCase().includes(needle));
  const allApplications = applications.data?.items ?? [];
  const pendingCount = allApplications.filter((a) => a.status === 'pending').length;
  const shownApplications = allApplications.filter(
    (a) =>
      (statusFilter === 'all' || a.status === statusFilter) &&
      matches(a.school_name, a.city, a.applicant.email, a.applicant.name),
  );
  const orgItems = organizations.data?.items ?? [];
  const shownOrganizations = orgItems.filter((o) => matches(o.name, o.city));

  const closeDialogs = () => {
    setApproveOpen(false);
    setRejectOpen(false);
    setSelected(null);
    setReason('');
  };

  const decide = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    const ok = await runAction(action, success, setResult);
    setBusy(false);
    if (ok) {
      closeDialogs();
      applications.reload();
      organizations.reload();
    } else {
      closeDialogs();
    }
  };

  const applicationColumns: ColumnDef<SchoolApplication>[] = [
    {
      key: 'school_name',
      header: 'Заявка',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#171717]">{a.school_name}</div>
            <div className="text-[11px] text-[#78716C]">
              {TYPE_LABELS[a.type] ?? a.type} · {a.city}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: 'Заявитель',
      cell: (a) => (
        <div>
          <div className="text-xs font-medium text-[#171717]">{a.contact_name}{a.contact_position ? `, ${a.contact_position}` : ''}</div>
          <div className="text-[11px] text-[#78716C]">
            {a.applicant.email} · {a.contact_phone}
          </div>
        </div>
      ),
    },
    {
      key: 'approx_students',
      header: 'Учащихся (со слов)',
      cell: (a) => <span className="text-xs font-semibold text-[#171717]">{a.approx_students}</span>,
    },
    { key: 'created_at', header: 'Подана', cell: (a) => <span className="text-xs text-[#5C574F]">{fmtDate(a.created_at)}</span> },
    {
      key: 'status',
      header: 'Статус',
      cell: (a) => (
        <div className="space-y-1">
          <StatusBadge status={a.status} />
          {a.status === 'rejected' && a.rejection_reason && (
            <div className="text-[11px] text-[#78716C] max-w-[220px]">{a.rejection_reason}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Действия',
      className: 'text-right',
      headerClassName: 'text-right',
      cell: (a) =>
        a.status === 'pending' && canDecide ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setSelected(a);
                setApproveOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded cursor-pointer shadow-2xs"
            >
              Одобрить
            </button>
            <button
              onClick={() => {
                setSelected(a);
                setRejectOpen(true);
              }}
              className="px-2 py-1 text-xs text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FFF1F2] cursor-pointer"
            >
              Отклонить
            </button>
          </div>
        ) : null,
    },
  ];

  const organizationColumns: ColumnDef<OrganizationRow>[] = [
    {
      key: 'name',
      header: 'Организация',
      cell: (o) => (
        <div>
          <div className="font-semibold text-xs text-[#171717] hover:text-[#FF5A36]">{o.name}</div>
          <div className="text-[11px] text-[#78716C]">
            {TYPE_LABELS[o.type] ?? o.type} · {o.city}
          </div>
        </div>
      ),
    },
    { key: 'class_count', header: 'Классов', cell: (o) => <span className="text-xs font-semibold">{o.class_count}</span> },
    { key: 'teacher_count', header: 'Учителей', cell: (o) => <span className="text-xs font-semibold">{o.teacher_count}</span> },
    { key: 'student_count', header: 'Учеников', cell: (o) => <span className="text-xs font-semibold">{o.student_count}</span> },
    {
      key: 'license',
      header: 'Лицензия',
      cell: (o) =>
        o.license ? (
          <div className="text-xs">
            <div className="font-semibold">
              {o.license.seats_used} / {o.license.seat_limit} мест
            </div>
            <div className="text-[11px] text-[#78716C]">
              {o.license.plan} · до {fmtDate(o.license.expires_at)}
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#A8A29E]">нет</span>
        ),
    },
    { key: 'created_at', header: 'Подключена', cell: (o) => <span className="text-xs text-[#5C574F]">{fmtDate(o.created_at)}</span> },
    { key: 'status', header: 'Статус', cell: (o) => <StatusBadge status={o.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (o) =>
        can('finance.manage') ? (
          <button
            onClick={(e) => { e.stopPropagation(); setLicenseFor(o); }}
            className="px-2.5 py-1 text-xs text-[#171717] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE] cursor-pointer"
          >
            Выдать лицензию
          </button>
        ) : null,
    },
  ];

  const seatsNumber = Number(seats);
  const monthsNumber = Number(months);
  const licenseValid = Number.isInteger(seatsNumber) && seatsNumber >= 1 && Number.isInteger(monthsNumber) && monthsNumber >= 1 && monthsNumber <= 60 && plan.trim().length >= 2;
  const issueLicense = async () => {
    if (!licenseFor || !licenseValid) return;
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + monthsNumber);
    setBusy(true);
    const ok = await runAction(
      () => adminApi.createLicense(licenseFor.id, { plan: plan.trim(), seat_limit: seatsNumber, starts_at: start.toISOString(), expires_at: end.toISOString() }),
      `Лицензия записана для «${licenseFor.name}». Оплата не списывается: платежи не подключены.`,
      setResult,
    );
    setBusy(false);
    setLicenseFor(null);
    setSeats('');
    if (ok) organizations.reload();
  };

  const statusFilters: TableFilter[] = [
    {
      key: 'status',
      label: 'Статус',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Все статусы', value: 'all' },
        { label: 'На проверке', value: 'pending' },
        { label: 'Одобренные', value: 'approved' },
        { label: 'Отклонённые', value: 'rejected' },
      ],
    },
  ];

  const tab = (id: View, text: string, badge?: number) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer ${
        view === id ? 'bg-[#171717] text-white shadow-xs' : 'text-[#78716C] hover:text-[#171717]'
      }`}
    >
      <span>{text}</span>
      {!!badge && <span className="px-1.5 rounded-full text-[10px] font-bold bg-[#FF5A36] text-white">{badge}</span>}
    </button>
  );

  const error = view === 'applications' ? applications.error : organizations.error;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Школы и учебные заведения</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Заявки на подключение и подключённые организации. Одобрение создаёт организацию и назначает заявителя её администратором.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2DED5] text-xs">
          {tab('applications', 'Заявки', pendingCount)}
          {tab('organizations', `Организации${organizations.data ? ` (${orgItems.length})` : ''}`)}
        </div>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      {error && <ErrorBlock text={error} onRetry={view === 'applications' ? applications.reload : organizations.reload} />}

      {view === 'applications' ? (
        <DataTable
          data={shownApplications}
          columns={applicationColumns}
          keyExtractor={(a) => a.id}
          searchPlaceholder="Поиск по школе, городу или email заявителя..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={statusFilters}
          emptyMessage={applications.loading ? 'Загрузка…' : 'Заявок нет'}
          onRowClick={(a) => a.organization_id && onNavigate(`/admin/schools/${a.organization_id}`)}
        />
      ) : (
        <DataTable
          data={shownOrganizations}
          columns={organizationColumns}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Поиск по названию или городу..."
          searchValue={search}
          onSearchChange={setSearch}
          emptyMessage={organizations.loading ? 'Загрузка…' : 'Организаций пока нет'}
          onRowClick={(o) => onNavigate(`/admin/schools/${o.id}`)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!licenseFor}
        title={`Лицензия: ${licenseFor?.name ?? ''}`}
        message="Места нужны ученикам при вступлении в класс. Срок отсчитывается с сегодняшнего дня. Это учёт мест, а не платёж."
        variant="primary"
        confirmLabel={busy ? 'Записываем…' : 'Записать лицензию'}
        confirmDisabled={busy || !licenseValid}
        onConfirm={issueLicense}
        onCancel={() => setLicenseFor(null)}
      >
        <div className="grid grid-cols-3 gap-2">
          <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="План" className="text-xs p-2 bg-white border border-[#E2DED5] rounded-md" />
          <input value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="Мест" inputMode="numeric" className="text-xs p-2 bg-white border border-[#E2DED5] rounded-md" />
          <input value={months} onChange={(e) => setMonths(e.target.value)} placeholder="Месяцев" inputMode="numeric" className="text-xs p-2 bg-white border border-[#E2DED5] rounded-md" />
        </div>
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={approveOpen}
        title={`Одобрить заявку: ${selected?.school_name ?? ''}`}
        message={`Будет создана организация, а ${selected?.applicant.email ?? 'заявитель'} станет её администратором. Данные заявки не проверены автоматически: убедитесь, что учреждение настоящее.`}
        variant="primary"
        confirmLabel={busy ? 'Одобряем…' : 'Одобрить подключение'}
        confirmDisabled={busy}
        onConfirm={() => selected && decide(() => adminApi.approveSchoolApplication(selected.id), 'Заявка одобрена, организация создана.')}
        onCancel={closeDialogs}
      />

      <ConfirmationDialog
        isOpen={rejectOpen}
        title={`Отклонить заявку: ${selected?.school_name ?? ''}`}
        message="Причина сохранится и будет видна заявителю."
        variant="danger"
        confirmLabel={busy ? 'Отклоняем…' : 'Отклонить заявку'}
        confirmDisabled={busy || reason.trim().length < 5}
        onConfirm={() => selected && decide(() => adminApi.rejectSchoolApplication(selected.id, reason.trim()), 'Заявка отклонена.')}
        onCancel={closeDialogs}
      >
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина отклонения (не короче 5 символов)"
          className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
        />
      </ConfirmationDialog>
    </div>
  );
};
