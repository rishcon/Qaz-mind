import React, { useState } from 'react';
import { Language } from '../../types';
import { UserAccount } from '../../types/auth';
import { OrganizationType } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import { Building, CheckCircle2, ArrowRight, ShieldCheck, Clock, User, Mail, MapPin } from 'lucide-react';

interface SchoolApplyPageProps {
  currentLang: Language;
  currentUser: UserAccount | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onNavigatePlatformAdmin: () => void;
  onNavigateSchoolAdmin: () => void;
}

export const SchoolApplyPage: React.FC<SchoolApplyPageProps> = ({
  currentLang,
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  onNavigatePlatformAdmin,
  onNavigateSchoolAdmin,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(currentUser ? 2 : 1);

  // Step 1: Representative credentials
  const [repName, setRepName] = useState(currentUser?.name || '');
  const [repEmail, setRepEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');

  // Step 2: School info
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('lyceum');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPerson, setContactPerson] = useState(currentUser?.name || '');
  const [studentCountApprox, setStudentCountApprox] = useState<number>(45);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string>('');

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim()) {
      setErrorMsg('Укажите ваше имя и фамилию.');
      return;
    }
    if (!repEmail.trim() || !repEmail.includes('@')) {
      setErrorMsg('Укажите корректный рабочий email.');
      return;
    }
    // Accounts are created only through /register on the server; this page never creates one.
    if (!currentUser) {
      setErrorMsg('Войдите в аккаунт представителя школы, чтобы подать заявку.');
      return;
    }

    setErrorMsg('');
    setContactPerson(repName.trim());
    setContactEmail(repEmail.trim().toLowerCase());
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setErrorMsg('Укажите официальное название школы или учебного заведения.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Укажите город или населенный пункт.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('Укажите контактный email школы.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const app = schoolService.submitApplication({
        userId: currentUser?.id || `usr_rep_${Date.now()}`,
        representativeName: repName || currentUser?.name || 'Представитель школы',
        representativeEmail: repEmail || currentUser?.email || 'rep@school.kz',
        schoolName: schoolName.trim(),
        city: city.trim(),
        orgType,
        contactEmail: contactEmail.trim(),
        contactPerson: contactPerson.trim() || repName.trim(),
        studentCountApprox: Number(studentCountApprox) || 30,
      });
      setCreatedAppId(app.id);
      setStep(3);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between antialiased">
      {/* Top Bar */}
      <header className="border-b border-[#D9D5CB] px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xl font-black font-mono tracking-tight text-[#171717] hover:text-[#FF5A36] transition-colors cursor-pointer"
          >
            qazmind<span className="text-[#FF5A36]">.</span>
          </button>
          <span className="text-[10px] font-mono uppercase bg-[#EAE7DF] border border-[#D9D5CB] px-2 py-0.5 rounded text-[#74736F]">
            ПОДКЛЮЧЕНИЕ ШКОЛЫ
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="text-xs font-mono text-[#74736F] hover:text-[#171717] cursor-pointer"
        >
          ← На главную
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[560px] bg-white border border-[#D9D5CB] p-8 md:p-10 shadow-xs rounded">
          {/* Step Indicator */}
          {step < 3 && (
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E2DED5]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    step === 1 ? 'bg-[#FF5A36] text-white' : 'bg-[#258568] text-white'
                  }`}
                >
                  {step > 1 ? '✓' : '1'}
                </span>
                <span className="text-xs font-bold text-[#171717]">Представитель</span>
              </div>
              <div className="w-12 h-0.5 bg-[#E2DED5]" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    step === 2 ? 'bg-[#FF5A36] text-white' : 'bg-[#EAE7DF] text-[#74736F]'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-bold text-[#171717]">Данные школы</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Representative Account */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block">
                  ШАГ 1 ИЗ 2
                </span>
                <h1 className="text-2xl font-black text-[#171717] tracking-tight mt-1">
                  Аккаунт представителя школы
                </h1>
                <p className="text-xs text-[#74736F] mt-1.5">
                  Укажите ваши контактные данные как ответственного куратора или директора.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    ФИО представителя
                  </label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="Например, Ахметов Серик Болатович"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Рабочий Email
                  </label>
                  <input
                    type="email"
                    value={repEmail}
                    onChange={(e) => setRepEmail(e.target.value)}
                    placeholder="director@school.edu.kz"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                  />
                </div>

                {!currentUser && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Пароль для входа
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm tracking-wide rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Продолжить к данным школы</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-[#E2DED5] text-center">
                <span className="text-xs text-[#74736F]">Уже зарегистрированы? </span>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-xs font-bold text-[#171717] hover:text-[#FF5A36] underline cursor-pointer"
                >
                  Войти в существующий аккаунт
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: School Information */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block">
                  ШАГ 2 ИЗ 2
                </span>
                <h1 className="text-2xl font-black text-[#171717] tracking-tight mt-1">
                  Информация об организации
                </h1>
                <p className="text-xs text-[#74736F] mt-1.5">
                  Данные необходимы для верификации и настройки лицензии учреждения.
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Официальное название школы
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Например, Лицей №28 им. К. Сатпаева"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Город / Регион
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Алматы / Астана / Шымкент..."
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Тип заведения
                    </label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                      className="w-full px-3 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded"
                    >
                      <option value="lyceum">Лицей</option>
                      <option value="gymnasium">Гимназия</option>
                      <option value="secondary_school">Общеобразовательная школа</option>
                      <option value="nis">НИШ</option>
                      <option value="bil">БИЛ</option>
                      <option value="private">Частная школа</option>
                      <option value="prep_center">Образовательный центр</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Официальный Email школы
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@school.edu.kz"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Примерно учеников
                    </label>
                    <select
                      value={studentCountApprox}
                      onChange={(e) => setStudentCountApprox(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-sm bg-[#FAF9F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white rounded"
                    >
                      <option value={30}>До 30 (1 класс)</option>
                      <option value={60}>30–60 (2 класса)</option>
                      <option value={100}>60–100 (3–4 класса)</option>
                      <option value={200}>Более 100 учащихся</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-3 bg-[#EAE7DF] text-[#171717] font-bold text-xs rounded hover:bg-[#D9D5CB] transition-colors cursor-pointer"
                  >
                    Назад
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm tracking-wide rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span>Отправить заявку</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Submitted & Pending Verification */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6">
              <div className="w-14 h-14 rounded-full bg-[#FAF9F5] border border-[#D9D5CB] flex items-center justify-center mx-auto text-[#FF5A36]">
                <Clock className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  СТАТУС: НА ПРОВЕРКЕ
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-[#171717] tracking-tight mt-1">
                  Заявка отправлена
                </h1>
                <p className="text-sm text-[#74736F] mt-2 max-w-md mx-auto leading-relaxed">
                  Заявка для организации <strong className="text-[#171717]">{schoolName}</strong> успешно
                  зарегистрирована. Модератор QazMind проверит данные школы в течение одного рабочего дня.
                </p>
              </div>

              {/* Verified School Policy Reminder */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded text-left text-xs text-[#74736F] space-y-2">
                <div className="flex items-center gap-2 text-[#171717] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#258568]" />
                  <span>Политика безопасности институционального доступа</span>
                </div>
                <p>
                  Административный доступ открывается только после верификации заявки, чтобы исключить
                  несанкционированное создание школ и защитить данные учащихся.
                </p>
              </div>

              {/* Developer Prototype Fast-Track Helper */}
              <div className="p-4 bg-[#F5F3EE] border border-dashed border-[#D9D5CB] rounded text-left space-y-3">
                <div className="text-[11px] font-mono font-bold text-[#171717] uppercase">
                  ДЕМО-ТЕСТИРОВАНИЕ В СИМУЛЯТОРЕ
                </div>
                <p className="text-xs text-[#74736F]">
                  В среде прототипа вы можете сразу открыть консоль модератора платформы и одобрить вашу заявку в 1 клик, либо перейти в готовый кабинет проверенного лицея:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={onNavigatePlatformAdmin}
                    className="px-3.5 py-2 bg-[#171717] text-white text-xs font-bold rounded hover:bg-black transition-colors cursor-pointer text-center"
                  >
                    Модерация заявок (/admin/schools) →
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateSchoolAdmin}
                    className="px-3.5 py-2 bg-white border border-[#D9D5CB] text-[#171717] text-xs font-bold rounded hover:bg-[#FAF9F5] transition-colors cursor-pointer text-center"
                  >
                    Демо-лицей №28 (/school)
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full py-3 bg-[#EAE7DF] hover:bg-[#D9D5CB] text-[#171717] font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  Вернуться на главную
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#D9D5CB] py-4 px-6 text-center text-xs font-mono text-[#74736F] bg-white/40">
        QAZMIND SCHOOLS · ПОДКЛЮЧЕНИЕ ОБРАЗОВАТЕЛЬНЫХ ОРГАНИЗАЦИЙ РК
      </footer>
    </div>
  );
};
