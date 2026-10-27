import React, { useState } from 'react';
import { Language } from '../../types';
import {
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  BookOpen,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface SchoolLandingPageProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateHome: () => void;
  onOpenApply: () => void;
  onOpenLogin: () => void;
}

export const SchoolLandingPage: React.FC<SchoolLandingPageProps> = ({
  currentLang,
  onLanguageChange,
  onNavigateHome,
  onOpenApply,
  onOpenLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'assignments' | 'analytics'>('classes');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: currentLang === 'ru' ? 'Как подключить школу к QazMind?' : 'Мектепті QazMind жүйесіне қалай қосамыз?',
      a:
        currentLang === 'ru'
          ? 'Заполните заявку представителя на странице /schools/apply. Наша команда проверит данные школы и активирует доступ администратора в течение одного рабочего дня.'
          : 'Өкіл өтінішін толтырыңыз. Біздің команда мектеп мәліметтерін тексеріп, бір жұмыс күні ішінде әкімшілік рұқсатты қосады.',
    },
    {
      q: currentLang === 'ru' ? 'Как пригласить учеников в класс?' : 'Оқушыларды сыныпқа қалай шақырамыз?',
      a:
        currentLang === 'ru'
          ? 'Для каждого класса генерируется уникальный 6-значный код (например, QM-28A1). Ученик вводит его в своем личном кабинете и мгновенно присоединяется к классу.'
          : 'Әр сынып үшін 6 таңбалы бірегей код генерацияланады. Оқушы оны өз кабинетіне енгізіп, сыныпқа бірден қосылады.',
    },
    {
      q:
        currentLang === 'ru'
          ? 'Нужны ли ученикам отдельные аккаунты для школы?'
          : 'Оқушыларға мектеп үшін бөлек аккаунт қажет пе?',
      a:
        currentLang === 'ru'
          ? 'Нет. Ученик использует свой единый аккаунт QazMind. Все его личные достижения, выбранная пара профильных предметов и история подготовки сохраняются в полном объеме.'
          : 'Жоқ. Оқушы өз бірыңғай аккаунтын пайдаланады. Барлық жеке нәтижелері мен таңдаған бейіндік пәндері толық сақталады.',
    },
    {
      q: currentLang === 'ru' ? 'Что видит учитель в своем кабинете?' : 'Мұғалім өз кабинетінде нені көреді?',
      a:
        currentLang === 'ru'
          ? 'Учитель видит только закрепленные за ним классы: список учеников, статус сдачи назначенных заданий, процент правильных ответов и конкретные темы, вызвавшие затруднения.'
          : 'Мұғалім тек өзіне бекітілген сыныптарды көреді: оқушылар тізімі, тапсырмалардың орындалуы, орташа балл және қиындық тудырған тақырыптар.',
    },
    {
      q: currentLang === 'ru' ? 'Как защищены персональные данные учащихся?' : 'Оқушылардың жеке деректері қалай қорғалған?',
      a:
        currentLang === 'ru'
          ? 'Мы соблюдаем требования законодательства РК о защите персональных данных. Доступ строго разграничен ролями: школа видит только учебные результаты в рамках своих классов.'
          : 'Біз ҚР дербес деректерді қорғау заңнамасын қатаң сақтаймыз. Мектеп тек оқу нәтижелерін өз сыныптары шеңберінде ғана көре алады.',
    },
    {
      q: currentLang === 'ru' ? 'Сколько стоит подключение для школы?' : 'Мектеп үшін қосылу бағасы қандай?',
      a:
        currentLang === 'ru'
          ? 'Стоимость лицензии рассчитывается индивидуально в зависимости от количества подключаемых учеников и классов. Свяжитесь с нами для подбора программы.'
          : 'Лицензия құны қосылатын оқушылар мен сыныптар санына байланысты жеке есептеледі.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#D9D5CB] py-3.5">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1 text-2xl font-black font-mono tracking-tight text-[#171717] cursor-pointer"
            >
              <span>qazmind</span>
              <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block" />
            </button>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#74736F] bg-[#EAE7DF] px-2 py-0.5 rounded border border-[#D9D5CB]">
              SCHOOLS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#171717]/80">
            <a href="#showcase" className="hover:text-[#171717] transition-colors">
              {currentLang === 'ru' ? 'Возможности' : 'Мүмкіндіктер'}
            </a>
            <a href="#steps" className="hover:text-[#171717] transition-colors">
              {currentLang === 'ru' ? 'Как это работает' : 'Жұмыс барысы'}
            </a>
            <a href="#pricing" className="hover:text-[#171717] transition-colors">
              {currentLang === 'ru' ? 'Условия' : 'Шарттар'}
            </a>
            <a href="#faq" className="hover:text-[#171717] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Lang switch */}
            <div className="flex items-center text-xs font-mono font-bold text-[#74736F]">
              <button
                type="button"
                onClick={() => onLanguageChange('ru')}
                className={`px-1.5 py-0.5 cursor-pointer ${
                  currentLang === 'ru' ? 'text-[#171717] border-b-2 border-[#FF5A36]' : 'hover:text-[#171717]'
                }`}
              >
                RU
              </button>
              <span className="text-[#D9D5CB] px-0.5">/</span>
              <button
                type="button"
                onClick={() => onLanguageChange('kz')}
                className={`px-1.5 py-0.5 cursor-pointer ${
                  currentLang === 'kz' ? 'text-[#171717] border-b-2 border-[#FF5A36]' : 'hover:text-[#171717]'
                }`}
              >
                KZ
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenLogin}
              className="text-xs font-bold text-[#171717] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              {currentLang === 'ru' ? 'Войти' : 'Кіру'}
            </button>

            <button
              type="button"
              onClick={onOpenApply}
              className="px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded hover:bg-[#e04825] transition-colors cursor-pointer shadow-xs"
            >
              {currentLang === 'ru' ? 'Подключить школу' : 'Мектепті қосу'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-[#D9D5CB] bg-[#F5F3EE]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#D9D5CB] rounded text-[11px] font-mono font-bold uppercase tracking-wider text-[#171717] mb-6">
              <Building2 className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>QAZMIND FOR SCHOOLS</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#171717] leading-[1.08]">
              {currentLang === 'ru' ? 'Подготовка к ЕНТ под контролем школы.' : 'ҰБТ-ға дайындық мектеп бақылауында.'}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-[#171717]/75 font-sans leading-relaxed max-w-2xl">
              {currentLang === 'ru'
                ? 'Объедините учеников и учителей в единой цифровой платформе. Назначайте проверочные тесты, отслеживайте динамику и находите темы, требующие повторения.'
                : 'Оқушылар мен ұстаздарды ортақ платформада біріктіріңіз. Тестілер тағайындап, нәтижелерді қадағалаңыз және қайталауды қажет ететін тақырыптарды анықтаңыз.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenApply}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF5A36] text-white font-bold text-sm rounded hover:bg-[#e04825] transition-colors cursor-pointer shadow-xs"
              >
                <span>{currentLang === 'ru' ? 'Подключить школу' : 'Мектепті қосу'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#showcase"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#D9D5CB] text-[#171717] font-bold text-sm rounded hover:bg-[#FAF9F5] transition-colors"
              >
                <span>{currentLang === 'ru' ? 'Посмотреть возможности' : 'Мүмкіндіктерді қарау'}</span>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-[#74736F] font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#258568]" />
                <span>Официальный формат ЕНТ 2026/2027</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#258568]" />
                <span>Быстрое подключение по коду класса</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Interactive Section */}
      <section id="showcase" className="py-20 bg-[#EAE7DF] border-b border-[#D9D5CB]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">
                ИНТЕРФЕЙС ШКОЛЫ
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-[#171717] tracking-tight">
                Инструменты для директора, завуча и учителя.
              </h2>
            </div>

            {/* Showcase Tabs */}
            <div className="flex items-center bg-white border border-[#D9D5CB] p-1 rounded">
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'classes' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
                }`}
              >
                Классы и коды
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'assignments' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
                }`}
              >
                Назначение заданий
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'analytics' ? 'bg-[#171717] text-white' : 'text-[#74736F] hover:text-[#171717]'
                }`}
              >
                Аналитика пробелов
              </button>
            </div>
          </div>

          {/* Interactive Showcase Canvas */}
          <div className="bg-white border border-[#D9D5CB] rounded shadow-xs overflow-hidden">
            {/* Window Bar */}
            <div className="bg-[#F0EEE8] px-6 py-3 border-b border-[#D9D5CB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#D9D5CB]" />
                <span className="w-3 h-3 rounded-full bg-[#D9D5CB]" />
                <span className="w-3 h-3 rounded-full bg-[#D9D5CB]" />
                <span className="ml-2 text-xs font-mono text-[#74736F]">
                  qazmind.kz/school · Лицей №28 им. К. Сатпаева
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#258568] bg-[#258568]/10 px-2 py-0.5 rounded">
                Активная лицензия: 28/60 мест
              </span>
            </div>

            {/* Tab 1 Content: Classes & Join Codes */}
            {activeTab === 'classes' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
                  <div>
                    <h3 className="font-bold text-lg text-[#171717]">Классы выпуска 2026/2027</h3>
                    <p className="text-xs text-[#74736F] mt-0.5">
                      Ученики подключаются через 6-значный код класса без необходимости ручного создания аккаунтов.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F3EE] border border-[#E2DED5] rounded text-xs font-mono">
                    <span className="text-[#74736F]">Код для 11 «А»:</span>
                    <span className="font-bold text-[#FF5A36] text-sm">QM-28A1</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F3EE] border border-[#E2DED5] rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded bg-white border border-[#D9D5CB] flex items-center justify-center font-bold text-sm">
                          11 А
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#171717]">11 «А» физико-математический</div>
                          <div className="text-[11px] text-[#74736F]">Куратор: Даулет Бауржанович</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#171717]">16 учеников</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2DED5] flex items-center justify-between text-xs">
                      <span className="text-[#74736F]">Активное задание:</span>
                      <span className="font-semibold text-[#171717]">История Казахстана (24/28)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F3EE] border border-[#E2DED5] rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded bg-white border border-[#D9D5CB] flex items-center justify-center font-bold text-sm">
                          11 Б
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#171717]">11 «Б» естественно-научный</div>
                          <div className="text-[11px] text-[#74736F]">Куратор: Айнур Сериковна</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#171717]">12 учеников</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2DED5] flex items-center justify-between text-xs">
                      <span className="text-[#74736F]">Активное задание:</span>
                      <span className="font-semibold text-[#171717]">Биология (18/25)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 Content: Assignments */}
            {activeTab === 'assignments' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2DED5]">
                  <div>
                    <h3 className="font-bold text-lg text-[#171717]">Назначенные работы</h3>
                    <p className="text-xs text-[#74736F] mt-0.5">
                      Учитель выбирает темы из официальной программы ЕНТ и задает дедлайн.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#258568] bg-[#258568]/10 px-2.5 py-1 rounded font-bold">
                    3 активных работы
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF5A36]">История Казахстана</span>
                        <span className="text-xs text-[#74736F]">·</span>
                        <span className="text-xs font-bold text-[#171717]">Казахское ханство — базовая практика</span>
                      </div>
                      <div className="text-[11px] text-[#74736F] mt-1">
                        Класс: 11 «А» · 5 вопросов · Дедлайн: 5 ноября
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#258568]">24 из 28 сдали</div>
                      <div className="text-[11px] font-mono text-[#74736F]">Ср. балл: 4.2 / 5</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF5A36]">Биология</span>
                        <span className="text-xs text-[#74736F]">·</span>
                        <span className="text-xs font-bold text-[#171717]">Основы цитологии и молекулярной генетики</span>
                      </div>
                      <div className="text-[11px] text-[#74736F] mt-1">
                        Классы: 11 «А», 11 «Б» · 5 вопросов · Дедлайн: 8 ноября
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#FF5A36]">18 из 25 сдали</div>
                      <div className="text-[11px] font-mono text-[#74736F]">В процессе</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3 Content: Analytics */}
            {activeTab === 'analytics' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2DED5]">
                  <div>
                    <h3 className="font-bold text-lg text-[#171717]">Темы, требующие повторения</h3>
                    <p className="text-xs text-[#74736F] mt-0.5">
                      Автоматическое выявление вопросов, где учащиеся допускают более 40% ошибок.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#171717] bg-[#EAE7DF] px-2.5 py-1 rounded font-bold">
                    Сводка за октябрь 2026
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#171717]">
                        История Казахстана: Хан Кенесары и восстание 1837–1847 гг.
                      </span>
                      <div className="text-[11px] text-[#74736F]">Ошиблись 42% учащихся в классе 11 «А»</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#C94A43] bg-[#C94A43]/10 px-2 py-0.5 rounded">
                      Внимание
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#171717]">
                        Математическая грамотность: Задачи на концентрацию и сплавы
                      </span>
                      <div className="text-[11px] text-[#74736F]">Ошиблись 38% учащихся в классе 11 «Б»</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2 py-0.5 rounded">
                      Повторить
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 Key Benefits Section */}
      <section className="py-20 border-b border-[#D9D5CB]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-2xl mb-14">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">
              ПРЕИМУЩЕСТВА
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#171717] tracking-tight">
              Три столпа школьной подготовки в QazMind.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border border-[#D9D5CB] rounded flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#FF5A36]">01</span>
                <h3 className="text-lg font-bold text-[#171717] mt-3">Подключайте учеников за минуту</h3>
                <p className="text-xs text-[#74736F] mt-2 leading-relaxed">
                  Генерируйте код класса или отправляйте приглашения по email. Ученики не создают дублирующие аккаунты:
                  их личная история обучения, цель в 140 баллов и прогресс остаются нетронутыми.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E2DED5] text-xs font-mono text-[#171717]">
                ✓ Единый аккаунт ученика
              </div>
            </div>

            <div className="p-6 bg-white border border-[#D9D5CB] rounded flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#FF5A36]">02</span>
                <h3 className="text-lg font-bold text-[#171717] mt-3">Управляйте подготовкой</h3>
                <p className="text-xs text-[#74736F] mt-2 leading-relaxed">
                  Учителя создают задания из реального банка вопросов по обязательным и профильным предметам: от изучения
                  теории до проверочной практики и полноэкранного симулятора ЕНТ.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E2DED5] text-xs font-mono text-[#171717]">
                ✓ Полноэкранный фокус-режим
              </div>
            </div>

            <div className="p-6 bg-white border border-[#D9D5CB] rounded flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#FF5A36]">03</span>
                <h3 className="text-lg font-bold text-[#171717] mt-3">Честная аналитика результатов</h3>
                <p className="text-xs text-[#74736F] mt-2 leading-relaxed">
                  Никаких искусственных прогнозов или фальшивых метрик. Прозрачный процент сдачи заданий, объективное
                  распределение баллов и автоматическое выявление тем риска.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E2DED5] text-xs font-mono text-[#171717]">
                ✓ Без фальшивых формул
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Process Section */}
      <section id="steps" className="py-20 bg-[#FAF9F5] border-b border-[#D9D5CB]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">
              ЭТАПЫ ВНЕДРЕНИЯ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#171717] tracking-tight">
              Как школа начинает работу.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white border border-[#D9D5CB] rounded">
              <span className="font-mono text-xs font-bold text-[#FF5A36] block">ШАГ 1</span>
              <h4 className="text-sm font-bold text-[#171717] mt-2">Отправьте заявку</h4>
              <p className="text-xs text-[#74736F] mt-1">
                Укажите данные школы и ориентировочное число учащихся.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#D9D5CB] rounded">
              <span className="font-mono text-xs font-bold text-[#FF5A36] block">ШАГ 2</span>
              <h4 className="text-sm font-bold text-[#171717] mt-2">Подтверждение</h4>
              <p className="text-xs text-[#74736F] mt-1">
                Верификация куратора и активация школьного пространства.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#D9D5CB] rounded">
              <span className="font-mono text-xs font-bold text-[#FF5A36] block">ШАГ 3</span>
              <h4 className="text-sm font-bold text-[#171717] mt-2">Создайте классы</h4>
              <p className="text-xs text-[#74736F] mt-1">
                Добавьте 11 «А», 11 «Б» и закрепите профильных учителей.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#D9D5CB] rounded">
              <span className="font-mono text-xs font-bold text-[#FF5A36] block">ШАГ 4</span>
              <h4 className="text-sm font-bold text-[#171717] mt-2">Коды ученикам</h4>
              <p className="text-xs text-[#74736F] mt-1">
                Раздайте код класса — ученики присоединяются за пару кликов.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#D9D5CB] rounded">
              <span className="font-mono text-xs font-bold text-[#258568] block">ШАГ 5</span>
              <h4 className="text-sm font-bold text-[#171717] mt-2">Начните учебу</h4>
              <p className="text-xs text-[#74736F] mt-1">
                Назначайте проверочные тесты и следите за прогрессом.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Inquiry Section */}
      <section id="pricing" className="py-20 border-b border-[#D9D5CB]">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <div className="p-8 md:p-12 bg-white border border-[#D9D5CB] rounded shadow-xs text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F3EE] border border-[#D9D5CB] rounded text-xs font-mono font-bold text-[#171717]">
              <span>QAZMIND SCHOOLS TARIFF</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-[#171717] tracking-tight">
              {currentLang === 'ru' ? 'Стоимость зависит от количества учеников.' : 'Құны оқушылар санына байланысты.'}
            </h2>

            <p className="text-sm md:text-base text-[#74736F] max-w-xl mx-auto leading-relaxed">
              {currentLang === 'ru'
                ? 'Пакет включает доступ ко всем предметам ЕНТ, банку тестовых заданий, кабинетам учителей, полноэкранному симулятору экзамена и институциональной аналитике.'
                : 'Пакетке ҰБТ-ның барлық пәндері, тестілер базасы, мұғалімдер кабинеті, емтихан симуляторы және мектеп аналитикасы кіреді.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenApply}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF5A36] text-white font-bold text-sm rounded hover:bg-[#e04825] transition-colors cursor-pointer shadow-xs"
              >
                <span>{currentLang === 'ru' ? 'Обсудить подключение школы' : 'Мектепті қосуды талқылау'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#F5F3EE] border-b border-[#D9D5CB]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">
              ВОПРОСЫ И ОТВЕТЫ
            </span>
            <h2 className="text-3xl font-black text-[#171717] tracking-tight">Часто задаваемые вопросы</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#171717] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#74736F] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#74736F] leading-relaxed border-t border-[#E2DED5]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 bg-[#EAE7DF] text-xs text-[#74736F]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#171717]">qazmind schools</span>
            <span>·</span>
            <span>ЕНТ / ҰБТ для школ Казахстана</span>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#171717] font-semibold transition-colors cursor-pointer"
          >
            ← Личное обучение для учеников
          </button>
        </div>
      </footer>
    </div>
  );
};
