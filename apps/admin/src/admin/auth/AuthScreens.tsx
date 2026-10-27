import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, KeyRound, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { adminApi, errorText } from '../api/client';
import { ROLE_TITLES, useStaff } from './StaffAuth';

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-[#E2DED5] rounded-md text-[#171717] placeholder-[#A8A29E] focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36]/30';
const buttonClass =
  'w-full py-2.5 text-sm font-semibold text-white bg-[#171717] hover:bg-[#FF5A36] rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const Shell: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
  children,
}) => (
  <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-4">
    <div className="w-full max-w-sm">
      <div className="flex items-baseline gap-2 mb-6 justify-center">
        <span className="text-xl font-bold tracking-tight text-[#171717]">
          qazmind<span className="text-[#FF5A36]">.</span>
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#F0EEE8] text-[#5C574F] border border-[#E2DED5]">
          ADMIN
        </span>
      </div>
      <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFF7F5] border border-[#FF5A36]/30 flex items-center justify-center text-[#FF5A36] shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-base font-bold text-[#171717]">{title}</h1>
            <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
      <p className="text-[11px] text-[#A8A29E] text-center mt-4">
        Доступ только для сотрудников QazMind. Учётные записи создаёт владелец платформы.
      </p>
    </div>
  </div>
);

const ErrorLine: React.FC<{ text: string | null }> = ({ text }) =>
  text ? (
    <div role="alert" className="p-2.5 rounded-md bg-[#FFF1F2] border border-[#FCA5A5] text-xs text-[#9F2F28]">
      {text}
    </div>
  ) : null;

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center text-xs text-[#78716C] gap-2">
    <Loader2 className="w-4 h-4 animate-spin" /> Проверка сессии…
  </div>
);

export const SignInScreen: React.FC = () => {
  const { afterPassword } = useStaff();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { next } = await adminApi.login(email.trim(), password);
      setPassword('');
      afterPassword(next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Вход для сотрудников" subtitle="Email и пароль, затем код из приложения-генератора." icon={<KeyRound className="w-4 h-4" />}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorLine text={error} />
        <label className="block text-xs font-medium text-[#5C574F]">
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs font-medium text-[#5C574F]">
          Пароль
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Продолжить
        </button>
      </form>
    </Shell>
  );
};

export const MfaScreen: React.FC<{ enrol: boolean }> = ({ enrol }) => {
  const { afterMfa, signOut } = useStaff();
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enrol) return;
    adminApi
      .mfaSetup()
      .then(async ({ secret: value, otpauth_uri }) => {
        setSecret(value);
        setQr(await QRCode.toDataURL(otpauth_uri, { margin: 1, width: 200 }));
      })
      .catch((err) => setError(errorText(err)));
  }, [enrol]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      afterMfa(await adminApi.mfaVerify(code));
    } catch (err) {
      setError(errorText(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={enrol ? 'Настройка второго фактора' : 'Код подтверждения'}
      subtitle={
        enrol
          ? 'Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или другом приложении и введите 6 цифр.'
          : 'Введите 6 цифр из приложения-генератора кодов.'
      }
      icon={enrol ? <Smartphone className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
    >
      <form onSubmit={submit} className="space-y-3">
        <ErrorLine text={error} />
        {enrol && (
          <div className="flex flex-col items-center gap-2">
            {qr ? (
              <img src={qr} alt="QR-код для приложения-генератора" className="w-44 h-44 border border-[#E2DED5] rounded-md" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-[#78716C]">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {secret && (
              <p className="text-[11px] text-[#78716C] text-center">
                Ключ для ручного ввода:
                <br />
                <span className="font-mono text-xs text-[#171717] select-all break-all">{secret}</span>
              </p>
            )}
          </div>
        )}
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
        />
        <button type="submit" disabled={busy || code.length !== 6} className={buttonClass}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Подтвердить
        </button>
        <button type="button" onClick={() => void signOut()} className="w-full text-xs text-[#78716C] hover:text-[#171717] cursor-pointer">
          Выйти
        </button>
      </form>
    </Shell>
  );
};

export const AcceptInviteScreen: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const [invite, setInvite] = useState<{ email: string; name: string; roles: string[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .invitation(token)
      .then((data) => {
        setInvite(data);
        setName(data.name);
      })
      .catch((err) => setLoadError(errorText(err)));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== repeat) {
      setError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi.acceptInvitation(token, name.trim(), password);
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <Shell title="Приглашение недействительно" subtitle={loadError} icon={<KeyRound className="w-4 h-4" />}>
        <button type="button" onClick={onDone} className={buttonClass}>
          Ко входу
        </button>
      </Shell>
    );
  }
  if (!invite) return <LoadingScreen />;

  return (
    <Shell
      title="Приглашение в QazMind Admin"
      subtitle={`${invite.email} · ${invite.roles.map((r) => ROLE_TITLES[r] ?? r).join(', ')}`}
      icon={<KeyRound className="w-4 h-4" />}
    >
      <form onSubmit={submit} className="space-y-3">
        <ErrorLine text={error} />
        <label className="block text-xs font-medium text-[#5C574F]">
          Имя и фамилия
          <input required value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs font-medium text-[#5C574F]">
          Пароль (не менее 12 символов)
          <input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs font-medium text-[#5C574F]">
          Пароль ещё раз
          <input type="password" autoComplete="new-password" minLength={12} required value={repeat} onChange={(e) => setRepeat(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Задать пароль
        </button>
        <p className="text-[11px] text-[#78716C]">После этого войдите и настройте приложение-генератор кодов.</p>
      </form>
    </Shell>
  );
};
