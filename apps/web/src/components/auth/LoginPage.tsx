import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Language } from '../../types';
import { errorText } from '../../api/client';

interface LoginPageProps {
  currentLang: Language;
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateRegister: () => void;
  onNavigateSchoolApply?: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentLang,
  onLogin,
  onNavigateRegister,
  onNavigateSchoolApply,
  onNavigateForgotPassword,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorField, setErrorField] = useState<'email' | 'password' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The field takes an e-mail address or the login that a school created for the person.
    if (email.trim().length < 2) {
      setErrorField('email');
      setErrorMessage(currentLang === 'kz' ? 'Email немесе логинді енгізіңіз' : 'Введите email или логин');
      return;
    }
    if (!password) {
      setErrorField('password');
      setErrorMessage(currentLang === 'kz' ? 'Құпия сөзді енгізіңіз' : 'Введите пароль');
      return;
    }

    setErrorField(null);
    setErrorMessage('');
    setIsLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), password);
    } catch (err) {
      // Wrong password and unknown email get the same text on purpose, so no field is highlighted.
      setErrorField(null);
      setErrorMessage(errorText(err));
      setPassword('');
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
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#74736F]">Нет аккаунта?</span>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="font-bold text-[#171717] hover:text-[#FF5A36] underline underline-offset-4 cursor-pointer"
          >
            Создать аккаунт
          </button>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm">
          <div className="mb-8">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
              Личный кабинет
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
              {currentLang === 'kz' ? 'Қайта оралуыңызбен' : 'С возвращением'}
            </h1>
            <p className="text-sm text-[#74736F] mt-1.5">
              {currentLang === 'kz'
                ? 'Оқу процесін жалғастыру үшін кіріңіз.'
                : 'Войдите, чтобы продолжить подготовку.'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
              >
                Email или логин
              </label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorField === 'email') setErrorMessage('');
                }}
                placeholder="email или логин от школы"
                className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border ${
                  errorField === 'email' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors`}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#171717]"
                >
                  {currentLang === 'kz' ? 'Құпиясөз' : 'Пароль'}
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-[11px] text-[#74736F] hover:text-[#FF5A36] underline cursor-pointer"
                >
                  {currentLang === 'kz' ? 'Құпиясөзді ұмыттыңыз ба?' : 'Забыли пароль?'}
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorField === 'password') setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF8F5] border ${
                    errorField === 'password' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                  } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74736F] hover:text-[#171717] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Вход...</span>
                ) : (
                  <>
                    <span>{currentLang === 'kz' ? 'Кіру' : 'Войти'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Note for visitors without an account */}
          <div className="mt-6 pt-5 border-t border-[#E2DED5] text-center">
            <p className="text-xs text-[#74736F]">
              Впервые на QazMind?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-[#171717] font-bold hover:text-[#FF5A36] underline cursor-pointer"
              >
                Зарегистрируйтесь бесплатно
              </button>
            </p>
            {onNavigateSchoolApply && (
              <p className="text-xs text-[#74736F] mt-2">
                Представляете школу?{' '}
                <button
                  type="button"
                  onClick={onNavigateSchoolApply}
                  className="text-[#171717] font-bold hover:text-[#FF5A36] underline cursor-pointer"
                >
                  Подайте заявку на подключение
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
