import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Language } from '../../types';
import { errorText } from '../../api/client';

interface ResetPasswordPageProps {
  token: string | null;
  currentLang: Language;
  onReset: (token: string, password: string) => Promise<void>;
  onNavigateLogin: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token,
  currentLang,
  onReset,
  onNavigateLogin,
  onNavigateForgotPassword,
  onNavigateHome,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        currentLang === 'kz'
          ? `Құпиясөз кемінде ${MIN_PASSWORD_LENGTH} таңбадан тұруы керек`
          : `Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`
      );
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onReset(token, password);
      setIsDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between selection:bg-[#FF5A36] selection:text-white">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm">
          {isDone ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-[#171717]">
                {currentLang === 'kz' ? 'Құпиясөз жаңартылды' : 'Пароль обновлён'}
              </h2>
              <p className="text-sm text-[#74736F] mt-2 leading-relaxed">
                Все прежние сессии завершены. Войдите с новым паролем.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="mt-6 w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors cursor-pointer"
              >
                Войти
              </button>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <h2 className="text-xl font-extrabold text-[#171717]">Ссылка недействительна</h2>
              <p className="text-sm text-[#74736F] mt-2 leading-relaxed">
                Ссылка для сброса пароля неполная или уже использована. Запросите новую.
              </p>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="mt-6 w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors cursor-pointer"
              >
                Запросить новую ссылку
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  Восстановление
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                  {currentLang === 'kz' ? 'Жаңа құпиясөз' : 'Новый пароль'}
                </h1>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    {currentLang === 'kz' ? 'Жаңа құпиясөз' : 'Новый пароль'}
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF8F5] border ${
                        error ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Сохранение...</span>
                    ) : (
                      <>
                        <span>{currentLang === 'kz' ? 'Сақтау' : 'Сохранить пароль'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-[#74736F] font-mono border-t border-[#E2DED5]">
        © 2026 QAZMIND. Образовательная платформа ЕНТ / ҰБТ.
      </footer>
    </div>
  );
};
