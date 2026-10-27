import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { validateEmail } from '../../utils/authValidation';
import { Language } from '../../types';
import { errorText } from '../../api/client';

interface ForgotPasswordPageProps {
  currentLang: Language;
  onRequestReset: (email: string) => Promise<void>;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  currentLang,
  onRequestReset,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateEmail(email);
    if (!res.isValid) {
      setError(currentLang === 'kz' ? (res.errorKz || '') : (res.errorRu || ''));
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onRequestReset(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
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
        <button
          type="button"
          onClick={onNavigateLogin}
          className="text-xs font-mono font-bold text-[#171717] hover:text-[#FF5A36] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад ко входу</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm">
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Восстановление
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  {currentLang === 'kz' ? 'Құпиясөзді қалпына келтіру' : 'Восстановление пароля'}
                </h1>
                <p className="text-sm text-[#74736F] mt-1.5 leading-relaxed">
                  {currentLang === 'kz'
                    ? 'Тіркелген email мекенжайыңызды енгізіңіз. Сізге сілтеме жіберіледі.'
                    : 'Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="student@example.com"
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border ${
                      error ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                    } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors`}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Отправка...</span>
                    ) : (
                      <>
                        <span>{currentLang === 'kz' ? 'Сілтемені жіберу' : 'Отправить ссылку'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-[#171717]">
                {currentLang === 'kz' ? 'Хат жіберілді' : 'Инструкции отправлены'}
              </h2>
              <p className="text-sm text-[#74736F] mt-2 leading-relaxed">
                Если аккаунт с адресом <strong className="text-[#171717]">{email}</strong> существует, мы отправили письмо с инструкцией по сбросу пароля.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="mt-6 w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors cursor-pointer"
              >
                Вернуться ко входу
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
