import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, ForbiddenBlock, LoadingBlock, fmtDate } from '../components/ui/PageState';

interface SchoolDetailPageProps {
  schoolId: string;
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
const ASSIGNMENT_LABELS: Record<string, string> = { draft: 'черновики', published: 'идут', closed: 'закрыты', archived: 'в архиве' };

const card = 'bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3';
const h2 = 'text-xs font-bold uppercase tracking-wider text-[#78716C]';

/** One school for platform staff: who runs it, its classes, seats and what the platform may do with it. */
export const SchoolDetailPage: React.FC<SchoolDetailPageProps> = ({ schoolId, onNavigate }) => {
  const { can } = useStaff();
  const detail = useAdminData(() => adminApi.organization(schoolId), [schoolId]);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [target, setTarget] = useState<'suspended' | 'archived' | 'active' | null>(null);
  const [reason, setReason] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!can('schools.read')) return <ForbiddenBlock />;
  if (detail.error) return <ErrorBlock text={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return <LoadingBlock />;

  const { organization: org, people, classes, licenses, assignments, application } = detail.data;
  const admins = people.filter((p) => p.role === 'SCHOOL_ADMIN' && p.status === 'active');
  const teachers = people.filter((p) => p.role === 'TEACHER' && p.status === 'active');
  const students = classes.reduce((sum, c) => sum + c.student_count, 0);
  const current = licenses.find((l) => l.current);

  const changeStatus = async () => {
    if (!target) return;
    setBusy(true);
    const ok = await runAction(
      () => adminApi.setOrganizationStatus(org.id, target, reason.trim()),
      target === 'active' ? 'Школа снова активна.' : 'Статус школы изменён. Изменения в школе теперь недоступны.',
      setResult,
    );
    setBusy(false);
    setTarget(null);
    setReason('');
    if (ok) detail.reload();
  };

  const cancelLicense = async () => {
    if (!cancelId) return;
    setBusy(true);
    const ok = await runAction(() => adminApi.cancelLicense(org.id, cancelId), 'Лицензия отменена.', setResult);
    setBusy(false);
    setCancelId(null);
    if (ok) detail.reload();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <button onClick={() => onNavigate('/admin/schools')} className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#171717] cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Все школы
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717] flex items-center gap-2.5">
            {org.name} <StatusBadge status={org.status} />
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            {TYPE_LABELS[org.type] ?? org.type} · {org.city} · подключена {fmtDate(org.created_at)}
          </p>
        </div>
        {can('schools.approve') && (
          <div className="flex gap-2">
            {org.status === 'active' ? (
              <>
                <button onClick={() => setTarget('suspended')} className="px-3 py-1.5 text-xs text-[#9A6715] bg-white border border-[#E8C98A] rounded hover:bg-[#FEF7EA] cursor-pointer">
                  Приостановить
                </button>
                <button onClick={() => setTarget('archived')} className="px-3 py-1.5 text-xs text-[#C94A43] bg-white border border-[#FCA5A5] rounded hover:bg-[#FFF1F2] cursor-pointer">
                  В архив
                </button>
              </>
            ) : (
              <button onClick={() => setTarget('active')} className="px-3 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded cursor-pointer">
                Вернуть в работу
              </button>
            )}
          </div>
        )}
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      {org.status !== 'active' && (
        <div role="status" className="px-4 py-2.5 rounded-lg border border-[#D89B35]/40 bg-[#FFF8EC] text-xs text-[#7A5410]">
          Школа не активна: её администратор не может создавать классы, приглашать и назначать задания.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Администраторов', admins.length],
          ['Учителей', teachers.length],
          ['Классов', classes.filter((c) => c.status === 'active').length],
          ['Учеников', students],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-xl border border-[#E2DED5] p-4">
            <div className="text-2xl font-bold text-[#171717]">{value}</div>
            <div className="text-[11px] text-[#78716C]">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className={h2}>Лицензия и места</h2>
          {licenses.length === 0 ? (
            <p className="text-xs text-[#78716C]">
              Лицензии нет, поэтому ученики не могут вступать в классы. Выдайте её на вкладке «Организации» списка школ{can('finance.manage') ? '' : ' (нужно право finance.manage)'}.
            </p>
          ) : (
            <ul className="space-y-2">
              {licenses.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    <b>{l.plan}</b> · {l.seats_used} / {l.seat_limit} мест · {fmtDate(l.starts_at)} — {fmtDate(l.expires_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    {l.current ? <StatusBadge status="active" label="действует" /> : <StatusBadge status={l.status === 'cancelled' ? 'archived' : 'expired'} label={l.status === 'cancelled' ? 'отменена' : 'не действует'} />}
                    {l.status === 'active' && can('finance.manage') && (
                      <button onClick={() => setCancelId(l.id)} className="text-[#C94A43] underline cursor-pointer">
                        отменить
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {current && current.seats_used >= current.seat_limit && <p className="text-xs text-[#9A6715]">Места закончились: новые ученики вступить не смогут.</p>}
        </section>

        <section className={card}>
          <h2 className={h2}>Заявка школы</h2>
          {application ? (
            <dl className="text-xs space-y-1">
              <div>
                <dt className="inline text-[#78716C]">Контакт: </dt>
                <dd className="inline">
                  {application.contact_name}
                  {application.contact_position ? `, ${application.contact_position}` : ''}
                </dd>
              </div>
              <div>
                <dt className="inline text-[#78716C]">Телефон: </dt>
                <dd className="inline">{application.contact_phone}</dd>
              </div>
              <div>
                <dt className="inline text-[#78716C]">Учеников со слов: </dt>
                <dd className="inline">{application.approx_students}</dd>
              </div>
              <div>
                <dt className="inline text-[#78716C]">Подана: </dt>
                <dd className="inline">{fmtDate(application.created_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-[#78716C]">Заявки нет.</p>
          )}
          <h2 className={`${h2} pt-2`}>Школьные задания</h2>
          {Object.keys(assignments).length === 0 ? (
            <p className="text-xs text-[#78716C]">Заданий пока нет.</p>
          ) : (
            <p className="text-xs">
              {Object.entries(assignments)
                .map(([status, n]) => `${ASSIGNMENT_LABELS[status] ?? status}: ${n}`)
                .join(' · ')}
            </p>
          )}
        </section>

        <section className={card}>
          <h2 className={h2}>Администраторы и учителя</h2>
          {people.length === 0 ? (
            <p className="text-xs text-[#78716C]">Никого нет.</p>
          ) : (
            <ul className="space-y-1.5">
              {people.map((p) => (
                <li key={p.user_id} className={`flex flex-wrap items-center justify-between gap-2 text-xs ${p.status === 'revoked' ? 'opacity-50' : ''}`}>
                  <span>
                    <b>{p.name}</b> <span className="text-[#78716C]">{p.email}</span>
                  </span>
                  <span className="text-[#5C574F]">
                    {p.role === 'SCHOOL_ADMIN' ? 'администратор' : 'учитель'}
                    {p.status === 'revoked' ? ' · отключён' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className={h2}>Классы</h2>
          {classes.length === 0 ? (
            <p className="text-xs text-[#78716C]">Классов пока нет.</p>
          ) : (
            <ul className="space-y-1.5">
              {classes.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    <b>{c.name}</b> <span className="text-[#78716C]">{c.academic_year}</span>
                    {c.status !== 'active' ? ' · в архиве' : ''}
                  </span>
                  <span className="text-[#5C574F]">
                    учеников {c.student_count} · учителей {c.teacher_count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmationDialog
        isOpen={!!target}
        title={target === 'active' ? 'Вернуть школу в работу?' : target === 'archived' ? 'Отправить школу в архив?' : 'Приостановить школу?'}
        message={
          target === 'active'
            ? 'Администратор снова сможет работать в кабинете школы.'
            : 'Данные сохранятся, но создавать классы, приглашать и назначать задания будет нельзя. Причина попадёт в журнал действий.'
        }
        variant={target === 'active' ? 'primary' : 'danger'}
        confirmLabel={busy ? 'Сохраняем…' : 'Подтвердить'}
        confirmDisabled={busy || (target !== 'active' && reason.trim().length < 5)}
        onConfirm={changeStatus}
        onCancel={() => {
          setTarget(null);
          setReason('');
        }}
      >
        {target !== 'active' && (
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Причина (не короче 5 символов)"
            className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]"
          />
        )}
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={!!cancelId}
        title="Отменить лицензию?"
        message="Новые ученики не смогут вступать в классы. Уже вступившие ученики и их личный прогресс не удаляются."
        variant="danger"
        confirmLabel={busy ? 'Отменяем…' : 'Отменить лицензию'}
        confirmDisabled={busy}
        onConfirm={cancelLicense}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
};
