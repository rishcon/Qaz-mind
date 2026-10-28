import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ApiSchoolApplication, OrganizationType, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface SchoolApplyPageProps {
  signedIn: boolean;
  onLogin: () => void;
  onOpenCabinet: () => void;
  onBack: () => void;
}

const TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'school', label: 'Школа' },
  { value: 'lyceum', label: 'Лицей' },
  { value: 'gymnasium', label: 'Гимназия' },
  { value: 'college', label: 'Колледж' },
  { value: 'tutoring_center', label: 'Учебный центр' },
  { value: 'other', label: 'Другое' },
];

const STATUS_TEXT: Record<ApiSchoolApplication['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

const field =
  'w-full px-3 py-2.5 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';

/** School application form. The application is stored on the server and reviewed by platform staff. */
export const SchoolApplyPage: React.FC<SchoolApplyPageProps> = ({ signedIn, onLogin, onOpenCabinet, onBack }) => {
  const [applications, setApplications] = useState<ApiSchoolApplication[] | null>(null);
  const [form, setForm] = useState({
    school_name: '',
    type: 'school' as OrganizationType,
    city: '',
    contact_name: '',
    contact_position: '',
    contact_phone: '',
    approx_students: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!signedIn) return;
    schoolApi
      .myApplications()
      .then(setApplications)
      .catch(() => setApplications([]));
  }, [signedIn]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const pending = applications?.find((a) => a.status === 'pending');
  const approved = applications?.find((a) => a.status === 'approved');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const students = Number(form.approx_students);
    if (!Number.isInteger(students) || students < 1) {
      setError('Укажите примерное число учеников — целое число от 1.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await schoolApi.apply({ ...form, approx_students: students });
      setApplications((prev) => [created, ...(prev ?? [])]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <button type="button" onClick={onBack} className="text-xl font-extrabold tracking-tight font-mono cursor-pointer">
          qazmind<span className="text-[#FF5A36]">.</span>
        </button>
      </header>

      <main className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-[560px] space-y-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">Для школ</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Заявка на подключение школы</h1>
            <p className="text-sm text-[#74736F] mt-3 leading-relaxed">
              Заявку рассматривает команда QazMind. Пока она не одобрена, кабинет школы не открывается. Одобрение
              не происходит автоматически.
            </p>
          </div>

          {!signedIn ? (
            <div className="bg-white border border-[#E2DED5] p-6 rounded-sm space-y-4">
              <p className="text-sm">Чтобы подать заявку, войдите в аккаунт QazMind или создайте его.</p>
              <button
                type="button"
                onClick={onLogin}
                className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Войти</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {applications && applications.length > 0 && (
                <div className="bg-white border border-[#E2DED5] p-5 rounded-sm space-y-3">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#74736F]">Ваши заявки</h2>
                  {applications.map((a) => (
                    <div key={a.id} className="text-sm border-t border-[#EFECE4] pt-3 first:border-0 first:pt-0">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">{a.school_name}</span>
                        <span className="font-mono text-xs font-bold">{STATUS_TEXT[a.status]}</span>
                      </div>
                      <div className="text-xs text-[#74736F]">
                        {a.city} · {new Date(a.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      {a.status === 'rejected' && a.rejection_reason && (
                        <p className="text-xs text-red-700 mt-1">Причина: {a.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                  {approved && (
                    <button
                      type="button"
                      onClick={onOpenCabinet}
                      className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold cursor-pointer"
                    >
                      Открыть кабинет школы
                    </button>
                  )}
                </div>
              )}

              {pending ? (
                <p className="text-sm text-[#74736F]">Новая заявка станет доступна после решения по текущей.</p>
              ) : (
                <form onSubmit={submit} className="bg-white border border-[#E2DED5] p-6 rounded-sm space-y-4">
                  <label className="block text-xs font-bold space-y-1.5">
                    <span>Название школы</span>
                    <input className={field} value={form.school_name} onChange={set('school_name')} required minLength={3} maxLength={200} />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Тип учреждения</span>
                      <select className={field} value={form.type} onChange={set('type')}>
                        {TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Город</span>
                      <input className={field} value={form.city} onChange={set('city')} required minLength={2} maxLength={120} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Контактное лицо</span>
                      <input className={field} value={form.contact_name} onChange={set('contact_name')} required minLength={2} maxLength={120} />
                    </label>
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Должность</span>
                      <input className={field} value={form.contact_position} onChange={set('contact_position')} maxLength={120} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Телефон</span>
                      <input className={field} value={form.contact_phone} onChange={set('contact_phone')} required minLength={6} maxLength={40} inputMode="tel" />
                    </label>
                    <label className="block text-xs font-bold space-y-1.5">
                      <span>Примерно учеников</span>
                      <input className={field} value={form.approx_students} onChange={set('approx_students')} required inputMode="numeric" />
                    </label>
                  </div>
                  {error && (
                    <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-50 text-white font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{busy ? 'Отправляем…' : 'Отправить заявку'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
