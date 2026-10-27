import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, CheckCircle2, User, Building } from 'lucide-react';
import { validateRegistration } from '../../utils/authValidation';
import { Language } from '../../types';
import { errorText } from '../../api/client';

interface RegisterPageProps {
  currentLang: Language;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
  onNavigateSchoolApply: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  currentLang,
  onRegister,
  onNavigateLogin,
  onNavigateHome,
  onNavigateSchoolApply,
}) => {
  // Step: 'role_select' | 'student_form'
  const [roleStep, setRoleStep] = useState<'role_select' | 'student_form'>('role_select');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorField, setErrorField] = useState<'name' | 'email' | 'password' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegistration({ name, email, password });

    if (!validation.isValid) {
      setErrorField(validation.errorField || null);
      setErrorMessage(currentLang === 'kz' ? (validation.messageKz || '') : (validation.messageRu || ''));
      return;
    }

    setErrorField(null);
    setErrorMessage('');
    setIsLoading(true);
    try {
      await onRegister(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      setErrorField(null);
      setErrorMessage(errorText(err));
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
          <span className="text-[#74736F]">Уже есть аккаунт?</span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-bold text-[#171717] hover:text-[#FF5A36] underline underline-offset-4 cursor-pointer"
          >
            Войти
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {roleStep === 'role_select' ? (
          /* Role Selection Step */
          <div className="w-full max-w-[520px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded">
            <div className="mb-8">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                РЕГИСТРАЦИЯ
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-[#171717]">
                {currentLang === 'kz' ? 'QazMind-ті қалай қолданасыз?' : 'Как будешь использовать QazMind?'}
              </h1>
              <p className="text-sm text-[#74736F] mt-1.5">
                {currentLang === 'kz'
                  ? 'Өзіңізге сәйкес келетін форматты таңдаңыз.'
                  : 'Выбери подходящий формат обучения.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Student */}
              <button
                type="button"
                onClick={() => setRoleStep('student_form')}
                className="w-full p-5 bg-[#FAF9F5] border border-[#E2DED5] hover:border-[#FF5A36] text-left rounded transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-[#D9D5CB] group-hover:border-[#FF5A36] flex items-center justify-center shrink-0 text-[#171717] group-hover:text-[#FF5A36]">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#171717]">
                      {currentLang === 'kz' ? 'Мен оқушымын' : 'Я ученик'}
                    </h3>
                    <span className="text-xs font-mono text-[#FF5A36] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <p className="text-xs text-[#74736F] mt-1">
                    {currentLang === 'kz'
                      ? 'ҰБТ-ға өз бетімше дайындалғым келеді. Барлық 5 пән, жаттығулар мен симулятор.'
                      : 'Хочу готовиться к ЕНТ самостоятельно. Личный план, теория, практика и симулятор экзамена.'}
                  </p>
                </div>
              </button>

              {/* Option 2: School */}
              <button
                type="button"
                onClick={onNavigateSchoolApply}
                className="w-full p-5 bg-[#FAF9F5] border border-[#E2DED5] hover:border-[#171717] text-left rounded transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-[#D9D5CB] group-hover:border-[#171717] flex items-center justify-center shrink-0 text-[#171717]">
                  <Building className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#171717]">
                      {currentLang === 'kz' ? 'Мен мектеп өкілімін' : 'Я представляю школу'}
                    </h3>
                    <span className="text-xs font-mono text-[#171717] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <p className="text-xs text-[#74736F] mt-1">
                    {currentLang === 'kz'
                      ? 'Оқушылар мен мұғалімдерді қосқым келеді. Сыныптар, тапсырмалар және аналитика.'
                      : 'Хочу подключить учеников и учителей. Управление классами, назначение тестов и школьная аналитика.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Student Registration Form */
          <div className="w-full max-w-[440px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm">
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRoleStep('role_select')}
                className="text-xs font-mono text-[#74736F] hover:text-[#171717] cursor-pointer"
              >
                ← Выбрать другую роль
              </button>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                УЧЕНИК
              </span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#171717]">
                {currentLang === 'kz' ? 'Тіркелу' : 'Создай аккаунт'}
              </h1>
              <p className="text-sm text-[#74736F] mt-1.5">
                {currentLang === 'kz' ? 'ҰБТ-ға жүйелі дайындықты баста.' : 'Начни подготовку к ЕНТ.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                >
                  {currentLang === 'kz' ? 'Атыңыз' : 'Имя'}
                </label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorField === 'name') setErrorMessage('');
                  }}
                  placeholder={currentLang === 'kz' ? 'Аты-жөніңіз' : 'Имя и фамилия'}
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border ${
                    errorField === 'name' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                  } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors`}
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorField === 'email') setErrorMessage('');
                  }}
                  placeholder="student@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border ${
                    errorField === 'email' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                  } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors`}
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                >
                  {currentLang === 'kz' ? 'Құпия сөз' : 'Пароль'}
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorField === 'password') setErrorMessage('');
                    }}
                    placeholder="Минимум 6 символов"
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border ${
                      errorField === 'password' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED5]'
                    } focus:outline-none focus:border-[#FF5A36] focus:bg-white transition-colors pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74736F] hover:text-[#171717] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm tracking-wide rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>{currentLang === 'kz' ? 'Тіркелу' : 'Зарегистрироваться'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E2DED5] text-center">
              <span className="text-xs text-[#74736F]">
                Регистрируясь, ты принимаешь{' '}
                <a href="#" className="underline hover:text-[#171717]">
                  условия оферты
                </a>{' '}
                и{' '}
                <a href="#" className="underline hover:text-[#171717]">
                  политику конфиденциальности
                </a>
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="w-full border-t border-[#E2DED5] py-4 px-6 text-center text-xs font-mono text-[#74736F] bg-white/40">
        QAZMIND · ОСОЗНАННАЯ ПОДГОТОВКА К ЕНТ / ҰБТ
      </footer>
    </div>
  );
};
