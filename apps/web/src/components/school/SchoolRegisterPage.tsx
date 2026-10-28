import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { OrganizationType } from '../../api/endpoints';
import { errorText } from '../../api/client';

export interface SchoolRegistrationForm {
  name: string;
  email: string;
  password: string;
  school_name: string;
  type: OrganizationType;
  city: string;
  contact_position: string;
  contact_phone: string;
  approx_students: number;
}

interface SchoolRegisterPageProps {
  onRegister: (form: SchoolRegistrationForm) => Promise<void>;
  onLogin: () => void;
  onStudentRegister: () => void;
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

const field = 'w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#FF5A36] focus:bg-white';
const label = 'block text-xs font-bold uppercase tracking-wider mb-1.5';

/**
 * Registration of a school. The person signs up as a school (not as a student): the account of the representative and the
 * application are created together. Platform staff review the application; until then the school workspace is closed.
 */
export const SchoolRegisterPage: React.FC<SchoolRegisterPageProps> = ({ onRegister, onLogin, onStudentRegister, onBack }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    school_name: '',
    type: 'school' as OrganizationType,
    city: '',
    contact_position: '',
    contact_phone: '',
    approx_students: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const students = Number(form.approx_students);
    if (!Number.isInteger(students) || students < 1) {
      setError('Укажите примерное число учеников — целое число от 1.');
      return;
    }
    if (form.password.length < 8) {
      setError('Пароль не короче 8 символов.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onRegister({ ...form, email: form.email.trim().toLowerCase(), approx_students: students });
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
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#74736F]">Уже зарегистрированы?</span>
          <button type="button" onClick={onLogin} className="font-bold underline underline-offset-4 hover:text-[#FF5A36] cursor-pointer">
            Войти
          </button>
        </div>
      </header>

      <main className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-[600px] space-y-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">Для школ</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Регистрация школы</h1>
            <p className="text-sm text-[#74736F] mt-3 leading-relaxed">
              Вы регистрируетесь как школа, а не как ученик. После проверки заявки командой QazMind вы получите кабинет школы: там вы создаёте классы, а также
              логины и пароли для учителей и учеников вашей школы.
            </p>
          </div>

          <form onSubmit={submit} className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm space-y-6">
            <fieldset className="space-y-4">
              <legend className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-1">Школа</legend>
              <div>
                <label className={label}>Название школы</label>
                <input className={field} value={form.school_name} onChange={set('school_name')} required minLength={3} maxLength={200} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Тип учреждения</label>
                  <select className={field} value={form.type} onChange={set('type')}>
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Город</label>
                  <input className={field} value={form.city} onChange={set('city')} required minLength={2} maxLength={120} />
                </div>
              </div>
              <div>
                <label className={label}>Примерно учеников</label>
                <input className={field} value={form.approx_students} onChange={set('approx_students')} required inputMode="numeric" />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-1">Представитель школы (администратор кабинета)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Ваше имя</label>
                  <input className={field} value={form.name} onChange={set('name')} required minLength={2} maxLength={80} autoComplete="name" />
                </div>
                <div>
                  <label className={label}>Должность</label>
                  <input className={field} value={form.contact_position} onChange={set('contact_position')} maxLength={120} placeholder="Завуч, директор…" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Телефон</label>
                  <input className={field} value={form.contact_phone} onChange={set('contact_phone')} required minLength={6} maxLength={40} inputMode="tel" autoComplete="tel" />
                </div>
                <div>
                  <label className={label}>Email (для входа)</label>
                  <input className={field} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
                </div>
              </div>
              <div>
                <label className={label}>Пароль</label>
                <div className="relative">
                  <input
                    className={`${field} pr-10`}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74736F] cursor-pointer"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#74736F] mt-1">Не короче 8 символов. На email придёт письмо для подтверждения адреса.</p>
              </div>
            </fieldset>

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
              <span>{busy ? 'Отправляем…' : 'Зарегистрировать школу'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-[#74736F] text-center">
            Вы ученик и готовитесь к ЕНТ самостоятельно?{' '}
            <button type="button" onClick={onStudentRegister} className="font-bold text-[#171717] underline hover:text-[#FF5A36] cursor-pointer">
              Регистрация для учеников
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
