import React, { useState } from 'react';
import { Language, LearningAppTab } from '../types';
import { locales } from '../content/locales';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  HelpCircle,
  Layers,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ProductExperienceSectionProps {
  currentLang: Language;
  onOpenSimulator: () => void;
}

export const ProductExperienceSection: React.FC<ProductExperienceSectionProps> = ({
  currentLang,
  onOpenSimulator,
}) => {
  const t = locales[currentLang];
  const [activeTab, setActiveTab] = useState<LearningAppTab>('today');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>('B');
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(true);
  const [activeLessonStep, setActiveLessonStep] = useState<number>(2);

  const tabs: { id: LearningAppTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'today', label: t.product.sidebarToday, icon: <Calendar className="w-4 h-4" /> },
    { id: 'subjects', label: t.product.sidebarSubjects, icon: <Layers className="w-4 h-4" /> },
    { id: 'practice', label: t.product.sidebarPractice, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'mock_ent', label: t.product.sidebarMock, icon: <ClipboardList className="w-4 h-4" />, badge: '140' },
    { id: 'mistakes', label: t.product.sidebarMistakes, icon: <RotateCcw className="w-4 h-4" />, badge: '12' },
    { id: 'progress', label: t.product.sidebarProgress, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const lessonOutline = [
    { id: 1, titleRu: '1. Исторические предпосылки и откочевка', titleKz: '1. Тарихи алғышарттар және көшу', status: 'done' },
    { id: 2, titleRu: '2. Свод законов «Қасым ханның қасқа жолы»', titleKz: '2. «Қасым ханның қасқа жолы» заңдар жинағы', status: 'active' },
    { id: 3, titleRu: '3. Территориальный рост и дипломатия', titleKz: '3. Аумақтық кеңею және дипломатия', status: 'pending' },
    { id: 4, titleRu: '4. Отношения с Ногайской Ордой и Шайбанидами', titleKz: '4. Ноғай Ордасы және Шайбанилермен қатынас', status: 'pending' },
    { id: 5, titleRu: '5. Итоговый тест блока ЕНТ', titleKz: '5. ҰБТ блогының қорытынды тесті', status: 'pending' },
  ];

  const handleSelectOption = (optId: string) => {
    setSelectedQuizOption(optId);
    setIsAnswerChecked(true);
  };

  return (
    <section id="platform" className="py-24 md:py-32 border-b border-[#D9D5CB] bg-[#F5F3EE]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FF5A36] uppercase">
            {t.product.tag}
          </span>
          <span className="w-12 h-[1px] bg-[#D9D5CB]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-8">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#171717] font-display whitespace-pre-line leading-[0.98]">
              {t.product.headline}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-base md:text-lg text-[#171717]/80 leading-relaxed font-normal">
              {t.product.subheadline}
            </p>
          </div>
        </div>

        {/* Realistic Application Interface Container */}
        <div className="border border-[#171717] bg-[#FAFAF8] shadow-[8px_8px_0px_#171717] overflow-hidden">
          {/* Top Bar of the Student Workspace */}
          <div className="bg-[#171717] text-[#F5F3EE] px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#171717]">
            <div className="flex items-center gap-4">
              <span className="font-display font-black tracking-tight text-sm text-white">
                qazmind.studio
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-[#F5F3EE]/50">
                / {currentLang === 'ru' ? 'ЛИЧНЫЙ КАБИНЕТ УЧЕНИКА' : 'ОҚУШЫНЫҢ ЖЕКЕ КАБИНЕТІ'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#FF5A36] bg-[#2A2A2A] px-2.5 py-1">
                <Flame className="w-3.5 h-3.5 fill-[#FF5A36]" />
                <span className="font-bold">14 {currentLang === 'ru' ? 'дней ударного темпа' : 'күн үздіксіз'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[#F5F3EE]/70">
                <span>{currentLang === 'ru' ? 'Цель: 135+ баллов' : 'Мақсат: 135+ балл'}</span>
              </div>
            </div>
          </div>

          {/* Three-Column Application Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            {/* Left Column: Functional Sidebar (3 cols on lg) */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#D9D5CB] bg-[#F5F3EE]/70 p-4 md:p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 text-[11px] font-mono tracking-wider uppercase text-[#171717]/50 font-semibold px-2">
                  {currentLang === 'ru' ? 'Навигация платформы' : 'Платформа навигациясы'}
                </div>

                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs md:text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#171717] text-white shadow-sm'
                            : 'text-[#171717]/80 hover:bg-[#EAE7DF] hover:text-[#171717]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {tab.icon}
                          <span className="font-display font-semibold">{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 ${
                              isActive
                                ? 'bg-[#FF5A36] text-white'
                                : 'bg-[#D9D5CB] text-[#171717]'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar bottom student card */}
              <div className="mt-8 pt-6 border-t border-[#D9D5CB] text-xs">
                <div className="font-mono text-[11px] text-[#171717]/50 mb-1">
                  {currentLang === 'ru' ? 'ТЕКУЩИЙ ПРЕДМЕТ' : 'АҒЫМДАҒЫ ПӘН'}
                </div>
                <div className="font-display font-bold text-[#171717]">
                  {currentLang === 'ru' ? 'История Казахстана' : 'Қазақстан тарихы'}
                </div>
                <div className="mt-2 w-full bg-[#D9D5CB] h-1.5 overflow-hidden">
                  <div className="bg-[#FF5A36] h-full w-[65%]" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-mono text-[#171717]/60">
                  <span>32/48 {currentLang === 'ru' ? 'тем' : 'тақырып'}</span>
                  <span>65%</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Main Focused Learning Workspace (6 cols on lg) */}
            <div className="lg:col-span-6 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D9D5CB] bg-white">
              <div>
                {/* Subject Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#171717]/60 mb-4 overflow-x-auto">
                  <span>{currentLang === 'ru' ? 'История Казахстана' : 'Қазақстан тарихы'}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#D9D5CB]" />
                  <span>XVI ғасыр</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#D9D5CB]" />
                  <span className="text-[#171717] font-semibold">
                    {currentLang === 'ru' ? 'Касым хан' : 'Қасым хан'}
                  </span>
                </div>

                {/* Lesson Title */}
                <h3 className="text-2xl md:text-3xl font-extrabold font-display text-[#171717] tracking-tight mb-4">
                  {currentLang === 'ru'
                    ? 'Свод законов «Қасым ханның қасқа жолы»'
                    : '«Қасым ханның қасқа жолы» заңдар жинағы'}
                </h3>

                {/* Focused learning text */}
                <p className="text-sm md:text-base text-[#171717]/85 leading-relaxed font-normal mb-6">
                  {currentLang === 'ru'
                    ? 'В начале XVI века при правлении хана Касыма (1511–1518) Казахское ханство достигло наивысшего политического и экономического могущества. Численность населения превысила один миллион человек, а войско могло выставить до 300 тысяч воинов.'
                    : 'XVI ғасырдың басында Қасым ханның билігі кезінде (1511–1518) Қазақ хандығы өзінің саяси және экономикалық өрлеу шегіне жетті. Халқының саны бір миллионнан асты, ал әскері 300 мың сарбазға дейін жетті.'}
                </p>

                {/* Highlighted Key Concept Box (Anti-Slop: clean hairline and neutral background, no garish glow) */}
                <div className="p-4 bg-[#F5F3EE] border border-[#D9D5CB] mb-6">
                  <span className="font-mono text-[11px] font-bold text-[#FF5A36] uppercase tracking-wider block mb-1">
                    {t.product.keyConceptTitle}
                  </span>
                  <p className="text-xs md:text-sm font-medium text-[#171717] leading-relaxed">
                    {currentLang === 'ru'
                      ? '«Қасым ханның қасқа жолы» состоял из 5 разделов: имущественное право, уголовное право, военное право, посольский обычай и общественные нормы. Опирался на адаты кочевой цивилизации.'
                      : '«Қасым ханның қасқа жолы» 5 бөлімнен тұрды: мүлік заңы, қылмыс заңы, әскери заң, елшілік жоралары және жұртшылық заңы. Көшпелі өркениеттің әдет-ғұрыптарына негізделді.'}
                  </p>
                </div>

                {/* Interactive Multiple-Choice Exercise */}
                <div className="border border-[#D9D5CB] p-4 bg-[#FAFAF8]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-[#171717]">
                      {t.product.interactiveExerciseTitle}
                    </span>
                    <span className="font-mono text-xs text-[#FF5A36] font-semibold">ЕНТ КОД: 14.2</span>
                  </div>

                  <p className="text-sm font-medium text-[#171717] mb-3 leading-snug">
                    {currentLang === 'ru'
                      ? 'Из скольких основных разделов состоял первый свод законов Казахского ханства при хане Касыме?'
                      : 'Қасым хан тұсындағы Қазақ хандығының алғашқы заңдар жинағы неше негізгі бөлімнен тұрды?'}
                  </p>

                  <div className="space-y-2 mb-3">
                    {[
                      { id: 'A', textRu: '3 раздела (Толе би, Казыбек би, Айтеке би)', textKz: '3 бөлім (Төле би, Қазыбек би, Әйтеке би)' },
                      { id: 'B', textRu: '5 разделов (Мүлік, Қылмыс, Әскери, Елшілік, Жұртшылық)', textKz: '5 бөлім (Мүлік, Қылмыс, Әскери, Елшілік, Жұртшылық)' },
                      { id: 'C', textRu: '7 разделов («Жеті Жарғы»)', textKz: '7 бөлім («Жеті Жарғы»)' },
                    ].map((opt) => {
                      const isSelected = selectedQuizOption === opt.id;
                      const isCorrect = opt.id === 'B';

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-2.5 text-xs font-medium border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? isCorrect
                                ? 'bg-white border-[#171717] font-semibold text-[#171717]'
                                : 'bg-[#FFF5F2] border-[#FF5A36] text-[#171717]'
                              : 'bg-white border-[#D9D5CB] hover:bg-[#F5F3EE]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 bg-[#EAE7DF]">
                              {opt.id}
                            </span>
                            <span>{currentLang === 'ru' ? opt.textRu : opt.textKz}</span>
                          </div>
                          {isSelected && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#FF5A36]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback */}
                  {selectedQuizOption && (
                    <div className="text-xs p-2.5 bg-[#F5F3EE] border-t border-[#D9D5CB] text-[#171717]/80">
                      {selectedQuizOption === 'B' ? (
                        <span className="text-[#171717] font-medium">
                          ✓ {currentLang === 'ru' ? 'Абсолютно верно! 5 разделов. 7 разделов — это более поздний «Жеті Жарғы» хана Тауке.' : 'Өте дұрыс! 5 бөлім. 7 бөлім — бұл Тәуке ханның кезіндегі «Жеті Жарғы».'}
                        </span>
                      ) : (
                        <span className="text-[#FF5A36]">
                          ✕ {currentLang === 'ru' ? 'Не путайте с «Жеті Жарғы» (7 разделов). У Касыма было ровно 5 разделов.' : '«Жеті Жарғымен» (7 бөлім) шатастырмаңыз. Қасымда 5 бөлім болған.'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 pt-4 border-t border-[#D9D5CB] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveLessonStep(prev => Math.min(5, prev + 1))}
                  className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t.product.nextLesson} →
                </button>

                <button
                  type="button"
                  onClick={onOpenSimulator}
                  className="text-xs font-semibold text-[#171717] hover:text-[#FF5A36] underline cursor-pointer"
                >
                  {currentLang === 'ru' ? 'Перейти в симулятор ЕНТ' : 'ҰБТ симуляторына өту'}
                </button>
              </div>
            </div>

            {/* Right Column: Lesson Navigator / Syllabus Strip (3 cols on lg) */}
            <div className="lg:col-span-3 p-4 md:p-6 bg-[#F5F3EE]/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D5CB]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#171717]/60 font-semibold">
                    {currentLang === 'ru' ? 'Карта урока' : 'Сабақ картасы'}
                  </span>
                  <span className="font-mono text-xs text-[#FF5A36] font-bold">2 / 5</span>
                </div>

                <div className="space-y-2">
                  {lessonOutline.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveLessonStep(item.id)}
                      className={`p-2.5 text-xs border transition-colors cursor-pointer ${
                        item.id === activeLessonStep
                          ? 'bg-white border-[#171717] font-semibold text-[#171717] shadow-sm'
                          : item.id < activeLessonStep
                          ? 'bg-[#EAE7DF]/60 border-[#D9D5CB] text-[#171717]/60'
                          : 'bg-transparent border-[#D9D5CB]/60 text-[#171717]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="leading-snug">
                          {currentLang === 'ru' ? item.titleRu : item.titleKz}
                        </span>
                        {item.id < activeLessonStep && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#171717]/60 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Teacher Note */}
              <div className="mt-8 p-3 bg-white border border-[#D9D5CB] text-xs">
                <div className="flex items-center gap-1.5 font-bold font-display text-[#171717] mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>{currentLang === 'ru' ? 'Подсказка эксперта' : 'Сарапшы кеңесі'}</span>
                </div>
                <p className="text-[11px] text-[#171717]/75 leading-relaxed font-normal">
                  {currentLang === 'ru'
                    ? 'Вопрос о количестве разделов законов Касым хана ежегодно встречается в 15% вариантов ЕНТ.'
                    : 'Қасым хан заңдарының бөлімдер саны туралы сұрақ жыл сайын ҰБТ нұсқаларының 15%-ында кездеседі.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
