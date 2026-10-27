import React, { useState } from 'react';
import { Language } from '../../types';
import { DashboardView } from '../../types/dashboard';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';

interface LessonReaderViewProps {
  currentLang: Language;
  onBackToSubjects: () => void;
  onNavigateToPractice: () => void;
}

export const LessonReaderView: React.FC<LessonReaderViewProps> = ({
  currentLang,
  onBackToSubjects,
  onNavigateToPractice,
}) => {
  const [activeStep, setActiveStep] = useState<number>(3); // Step 3: Откочевка
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [assistantAnswer, setAssistantAnswer] = useState<string>('');

  const steps = [
    { id: 1, titleRu: '1. Исторический фон середины XV века', titleKz: '1. XV ғ. ортасындағы тарихи жағдай' },
    { id: 2, titleRu: '2. Кризис в Ханстве Абулхаира', titleKz: '2. Әбілқайыр хандығындағы дағдарыс' },
    { id: 3, titleRu: '3. Откочевка султанов Керея и Жанибека', titleKz: '3. Керей мен Жәнібек сұлтандардың көшуі' },
    { id: 4, titleRu: '4. Урочище Козыбаши и союз с Могулистаном', titleKz: '4. Қозыбасы өңірі және Моғолстанмен одақ' },
    { id: 5, titleRu: '5. Провозглашение ханства в 1465 году', titleKz: '5. 1465 жылы хандықтың жариялануы' },
    { id: 6, titleRu: '6. Контрольный вопрос по теме', titleKz: '6. Тақырып бойынша бақылау сұрағы' },
  ];

  const handleAssistantQuery = (queryType: string) => {
    setAssistantPrompt(queryType);
    if (queryType === 'hint') {
      setAssistantAnswer(
        currentLang === 'ru'
          ? 'Подсказка: султаны происходили из ветви Урус-хана (чингизиды) и объединили роды, недовольные жесткой фискальной политикой хана Абулхаира.'
          : 'Кеңес: сұлтандар Орыс хан әулетінен (шыңғыс тұқымы) шыққан және Әбілқайыр ханның салық саясатына наразы руларды біріктірді.'
      );
    } else if (queryType === 'simple') {
      setAssistantAnswer(
        currentLang === 'ru'
          ? 'Проще говоря: люди устали от войн Абулхаира. Керей и Жанибек увели сторонников на восток (в Жетысу), где их принял хан Есен-буга. Там в 1465 году возникло Казахское ханство.'
          : 'Қарапайым тілмен: халық соғыстардан шаршады. Керей мен Жәнібек қолдаушыларын Жетісуға бастап барды, оларды Есенбұға қабылдады. Сөйтіп 1465 ж. Қазақ хандығы құрылды.'
      );
    } else if (queryType === 'example') {
      setAssistantAnswer(
        currentLang === 'ru'
          ? 'Пример из базы ЕНТ: «В каком году султаны Керей и Жанибек откочевали в Могулистан?» Ответ: в 1459–1460 гг. Провозглашение ханства — 1465 г.'
          : 'ҰБТ мысалы: «Керей мен Жәнібек Моғолстанға қай жылдары көшті?» Жауабы: 1459–1460 жж. Хандықтың құрылуы — 1465 ж.'
      );
    } else if (queryType === 'similar') {
      setAssistantAnswer(
        currentLang === 'ru'
          ? 'Похожий вопрос ЕНТ: «Какой хан Могулистана предоставил земли в долине Чу для откочевавших казахов?» Ответ: Хан Есен-буга.'
          : 'Ұқсас ҰБТ сұрағы: «Көшіп келген қазақтарға Шу алқабынан жер бөлген Моғолстан ханы кім?» Жауабы: Есенбұға хан.'
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DED5]">
        <button
          type="button"
          onClick={onBackToSubjects}
          className="flex items-center gap-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'ru' ? 'Назад к программе' : 'Бағдарламаға қайту'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAssistantOpen(!assistantOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold border rounded transition-colors cursor-pointer ${
              assistantOpen
                ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                : 'bg-white text-[#171717] border-[#E2DED5] hover:border-[#171717]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentLang === 'ru' ? 'Объяснить' : 'Түсіндіру'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Lesson Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lesson Navigation (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E2DED5] p-4 rounded-md">
          <span className="font-mono text-[11px] font-bold text-[#74736F] uppercase tracking-wider block mb-3 px-2">
            {currentLang === 'ru' ? 'СОДЕРЖАНИЕ УРОКА' : 'САБАҚ МАЗМҰНЫ'}
          </span>

          <nav className="space-y-1">
            {steps.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStep(st.id)}
                className={`w-full text-left p-2.5 text-xs rounded transition-colors cursor-pointer flex items-center justify-between ${
                  st.id === activeStep
                    ? 'bg-[#171717] text-white font-bold'
                    : st.id < activeStep
                    ? 'text-[#74736F] hover:bg-[#F5F3EE]'
                    : 'text-[#74736F]/70 hover:bg-[#F5F3EE]'
                }`}
              >
                <span className="leading-snug">{currentLang === 'ru' ? st.titleRu : st.titleKz}</span>
                {st.id < activeStep && <CheckCircle2 className="w-3.5 h-3.5 text-[#258568] shrink-0" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Center Column: Digital Textbook (Main Reader 6-7 cols, 680-760px equivalent) */}
        <div className="lg:col-span-6 bg-white border border-[#171717] p-8 md:p-12 shadow-[4px_4px_0px_#171717] rounded-md">
          {/* Chapter & Lesson Kicker */}
          <div className="mb-6">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block">
              ИСТОРИЯ КАЗАХСТАНА · ТЕМА 4.1
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-[#171717] mt-1 tracking-tight">
              {currentLang === 'ru' ? 'Образование Казахского ханства' : 'Қазақ хандығының құрылуы'}
            </h2>
          </div>

          {/* Central Learning Content Text */}
          <div className="space-y-6 text-[#171717]/90 text-base leading-relaxed font-normal">
            <p>
              {currentLang === 'ru'
                ? 'В середине XV века на обширных просторах Дешт-и-Кыпчака усилился внутренний кризис в Государстве кочевых узбеков (Ханстве Абулхаира). Постоянные междоусобицы и поражение Абулхаира в войне с ойратами в 1457 году вызвали массовое недовольство кочевых родов.'
                : 'XV ғасырдың ортасында Дешті Қыпшақ даласында Көшпелі өзбек мемлекетінде (Әбілқайыр хандығында) ішкі саяси дағдарыс күшейді. Тұрақты тартыстар мен 1457 жылғы ойраттардан жеңілуі көшпелі рулардың наразылығын тудырды.'}
            </p>

            {/* Key Fact Highlight Box */}
            <div className="p-4 bg-[#F5F3EE] border-l-3 border-[#FF5A36] my-6">
              <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-1">
                {currentLang === 'ru' ? 'КЛЮЧЕВАЯ ХРОНОЛОГИЯ ЕНТ' : 'ҰБТ-НЫҢ БАСТЫ ХРОНОЛОГИЯСЫ'}
              </span>
              <p className="text-sm font-semibold text-[#171717]">
                {currentLang === 'ru'
                  ? '1459–1460 гг. — откочевка султанов Керея и Жанибека в Западный Могулистан.'
                  : '1459–1460 жж. — Керей мен Жәнібек сұлтандардың Батыс Моғолстанға көшуі.'}
              </p>
              <p className="text-sm font-semibold text-[#171717] mt-1">
                {currentLang === 'ru'
                  ? '1465 г. — создание Казахского ханства в урочище Козыбаши (долина реки Чу).'
                  : '1465 ж. — Қозыбасы өңірінде (Шу алқабы) Қазақ хандығының жариялануы.'}
              </p>
            </div>

            <p>
              {currentLang === 'ru'
                ? 'Хан Могулистана Есен-буга радушно принял султанов и выделил им земли в урочище Козыбаши в Западном Жетысу. Его расчет строился на создании надежного буфера против ойратской угрозы и хана Абулхаира.'
                : 'Моғолстан ханы Есенбұға сұлтандарды құшақ жая қарсы алып, Батыс Жетісудағы Қозыбасы өңірін бөлді. Оның мақсаты — ойраттар мен Әбілқайыр ханға қарсы қорғаныс қалқанын жасау еді.'}
            </p>

            <p>
              {currentLang === 'ru'
                ? 'К Керею и Жанибеку постепенно примкнуло более 200 тысяч человек из различных кыпчакских, аргынских, дулатских, найманских и керейских родов. Это движение получило название «откочевки», заложив фундамент единой казахской народности.'
                : 'Керей мен Жәнібекке қыпшақ, арғын, дулат, найман және керей руларынан 200 мыңнан астам адам қосылды. Бұл көш біртұтас қазақ халқының құрылуына берік негіз болды.'}
            </p>

            {/* Knowledge Check Multiple-Choice Question */}
            <div className="mt-8 pt-8 border-t border-[#E2DED5]">
              <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">
                {currentLang === 'ru' ? 'КОНТРОЛЬНЫЙ ВОПРОС ПО ТЕМЕ' : 'ТАҚЫРЫП БОЙЫНША БАҚЫЛАУ СҰРАҒЫ'}
              </span>
              <h4 className="font-display font-bold text-lg text-[#171717] mb-4">
                {currentLang === 'ru'
                  ? 'Кто считается основателями Казахского ханства?'
                  : 'Қазақ хандығының негізін қалаушылар кімдер?'}
              </h4>

              <div className="space-y-2 mb-4">
                {[
                  { id: '1', textRu: 'Абылай хан и Кенесары хан', textKz: 'Абылай хан және Кенесары хан' },
                  { id: '2', textRu: 'Керей и Жанибек', textKz: 'Керей және Жәнібек', isCorrect: true },
                  { id: '3', textRu: 'Касым хан и Тауке хан', textKz: 'Қасым хан және Тәуке хан' },
                ].map((opt) => {
                  const isPicked = selectedAnswer === opt.id;
                  const isCorrect = opt.isCorrect;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedAnswer(opt.id)}
                      className={`w-full text-left p-3.5 border rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                        isPicked
                          ? isCorrect
                            ? 'bg-[#258568]/10 border-[#258568] text-[#171717] font-semibold'
                            : 'bg-[#C94A43]/10 border-[#C94A43] text-[#171717]'
                          : 'bg-[#FAFAF8] border-[#E2DED5] hover:bg-white'
                      }`}
                    >
                      <span>{currentLang === 'ru' ? opt.textRu : opt.textKz}</span>
                      {isPicked && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-[#258568] shrink-0" />
                      )}
                      {isPicked && !isCorrect && (
                        <AlertCircle className="w-4 h-4 text-[#C94A43] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Feedback */}
              {selectedAnswer && (
                <div
                  className={`p-4 rounded-md text-xs leading-relaxed ${
                    selectedAnswer === '2'
                      ? 'bg-[#258568]/10 border border-[#258568]/40 text-[#171717]'
                      : 'bg-[#C94A43]/10 border border-[#C94A43]/40 text-[#171717]'
                  }`}
                >
                  <div className="font-bold font-display mb-1 flex items-center gap-1.5">
                    {selectedAnswer === '2' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#258568]" />
                        <span className="text-[#258568]">
                          {currentLang === 'ru' ? 'Правильно!' : 'Дұрыс!'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[#C94A43]" />
                        <span className="text-[#C94A43]">
                          {currentLang === 'ru' ? 'Неверно' : 'Қате'}
                        </span>
                      </>
                    )}
                  </div>
                  <p>
                    {selectedAnswer === '2'
                      ? (currentLang === 'ru'
                          ? 'Именно султаны Керей и Жанибек возглавили откочевку в 1459–1460 гг. и основали ханство в 1465 г. Первым ханом был поднят Керей.'
                          : '1459–1460 жж. көшті Керей мен Жәнібек сұлтандар бастады, ал 1465 ж. хандық құрылды. Алғашқы хан болып Керей сайланды.')
                      : (currentLang === 'ru'
                          ? 'Абылай, Кенесары, Касым и Тауке правили гораздо позже (XVI–XIX века).'
                          : 'Абылай, Кенесары, Қасым мен Тәуке кейінгі ғасырларда (XVI–XIX ғғ.) билік жүргізді.')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Previous / Next Lesson Footer */}
          <div className="mt-10 pt-6 border-t border-[#E2DED5] flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToSubjects}
              className="flex items-center gap-2 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Предыдущий урок</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToPractice}
              className="px-6 py-3 bg-[#FF5A36] hover:bg-[#E54825] text-white text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-md shadow-xs"
            >
              <span>Закрепить на практике</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Contextual Assistant Panel (3 cols) */}
        <div className="lg:col-span-3">
          {assistantOpen ? (
            <div className="bg-white border border-[#E2DED5] p-5 rounded-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DED5]">
                <div className="flex items-center gap-1.5 font-display font-bold text-xs text-[#171717]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>{currentLang === 'ru' ? 'Ассистент урока' : 'Сабақ ассистенті'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAssistantOpen(false)}
                  className="text-[#74736F] hover:text-[#171717] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'hint', labelRu: 'Дай подсказку', labelKz: 'Кеңес бер' },
                  { id: 'simple', labelRu: 'Объясни проще', labelKz: 'Қарапайым түсіндір' },
                  { id: 'example', labelRu: 'Покажи пример ЕНТ', labelKz: 'ҰБТ мысалын көрсет' },
                  { id: 'similar', labelRu: 'Задай похожий вопрос', labelKz: 'Ұқсас сұрақ қой' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAssistantQuery(item.id)}
                    className="w-full text-left p-2 bg-[#F5F3EE] hover:bg-[#EAE7DF] text-xs font-medium text-[#171717] rounded transition-colors cursor-pointer"
                  >
                    → {currentLang === 'ru' ? item.labelRu : item.labelKz}
                  </button>
                ))}
              </div>

              {assistantAnswer && (
                <div className="p-3 bg-[#FAFAF8] border border-[#E2DED5] rounded text-xs text-[#171717]/90 leading-relaxed font-normal">
                  {assistantAnswer}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-white border border-[#E2DED5] rounded-md text-xs text-[#74736F] space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-[#171717]">
                <HelpCircle className="w-4 h-4 text-[#FF5A36]" />
                <span>{currentLang === 'ru' ? 'Справка по теме' : 'Тақырыптық көмек'}</span>
              </div>
              <p className="leading-relaxed">
                {currentLang === 'ru'
                  ? 'Нажми кнопку «Объяснить» вверху, если формулировка покажется сложной или потребуется дополнительный пример.'
                  : 'Егер мәтін күрделі көрінсе, жоғарыдағы «Түсіндіру» батырмасын басып жеңілдетілген түсініктеме алыңыз.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
