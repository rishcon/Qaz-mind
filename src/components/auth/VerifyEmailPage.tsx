import React, { useEffect, useRef, useState } from 'react';
import { Mail, ArrowRight, RefreshCw, Edit3, CheckCircle, AlertCircle } from 'lucide-react';
import { Language } from '../../types';
import { errorText } from '../../api/client';

interface VerifyEmailPageProps {
  email: string;
  /** Token from the link in the email (?token=...). Null when the page is opened without a link. */
  token: string | null;
  currentLang: Language;
  onVerify: (token: string) => Promise<void>;
  onResend: (email: string) => Promise<void>;
  onChangeEmail: () => void;
  onNavigateHome: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  email,
  token,
  currentLang,
  onVerify,
  onResend,
  onChangeEmail,
  onNavigateHome,
}) => {
  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [error, setError] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const startedFor = useRef<string | null>(null);

  // Opening the link from the email confirms the address once; the second run is skipped.
  useEffect(() => {
    if (!token || startedFor.current === token) return;
    startedFor.current = token;
    setIsVerifying(true);
    onVerify(token).catch((err) => {
      setError(errorText(err));
      setIsVerifying(false);
    });
  }, [token, onVerify]);

  const handleResend = async () => {
    setError('');
    if (!email) {
      setError(currentLang === 'kz' ? 'Алдымен тіркелу деректерін енгізіңіз' : 'Сначала укажите адрес при регистрации');
      return;
    }
    try {
      await onResend(email);
      setResendStatus(currentLang === 'kz' ? 'Хат қайта жіберілді' : 'Письмо отправлено повторно');
      setTimeout(() => setResendStatus(null), 3500);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
      {/* Top Bar with brand logo */}
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <button
          type="button"
          onClick={onNavigateHome}
          className="text-xl font-extrabold tracking-tight font-mono hover:text-[#FF5A36] transition-colors cursor-pointer"
        >
          qazmind<span className="text-[#FF5A36]">.</span>
        </button>
        <span className="text-xs font-mono text-[#74736F]">Шаг 1 из 2</span>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm text-center">
          <div className="w-12 h-12 bg-[#FAF8F5] border border-[#E2DED5] rounded-full flex items-center justify-center mx-auto mb-5 text-[#FF5A36]">
            <Mail className="w-6 h-6" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
            Безопасность аккаунта
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
            {currentLang === 'kz' ? 'Поштаңызды растаңыз' : 'Подтверди почту'}
          </h1>

          {token ? (
            <p className="text-sm text-[#74736F] mt-3 leading-relaxed">
              {isVerifying
                ? currentLang === 'kz' ? 'Адрес расталып жатыр...' : 'Подтверждаем адрес...'
                : currentLang === 'kz' ? 'Ссылка жарамсыз немесе мерзімі өткен.' : 'Ссылка недействительна или срок её действия истёк.'}
            </p>
          ) : (
            <>
              <p className="text-sm text-[#74736F] mt-3 leading-relaxed">
                {currentLang === 'kz' ? 'Біз растау хатын мына мекенжайға жібердік:' : 'Мы отправили письмо на:'}
              </p>
              <p className="text-base font-mono font-bold text-[#171717] mt-1 bg-[#FAF8F5] py-2 px-3 border border-[#E2DED5] rounded inline-block break-all">
                {email || '—'}
              </p>
              <p className="text-xs text-[#74736F] mt-4 leading-relaxed">
                Откройте ссылку из письма, чтобы подтвердить адрес. Ссылка действует 24 часа.
              </p>
            </>
          )}

          {resendStatus && (
            <div className="mt-4 p-2.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{resendStatus}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-7 space-y-3">
            <div className="flex items-center justify-center gap-4 pt-2 text-xs font-mono">
              <button
                type="button"
                onClick={handleResend}
                disabled={isVerifying}
                className="text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer underline underline-offset-4 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Отправить повторно</span>
              </button>
              <span className="text-[#E2DED5]">|</span>
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-[#74736F] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Изменить почту</span>
              </button>
            </div>
            {!token && (
              <div className="pt-2 text-xs text-[#74736F]">
                <ArrowRight className="inline w-3 h-3 mr-1" />
                После подтверждения откроется настройка профиля.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
