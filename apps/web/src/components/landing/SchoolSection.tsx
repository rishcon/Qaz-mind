import React from 'react';
import { ArrowRight, Users, CheckCircle2, FileText, BarChart3, Building } from 'lucide-react';
import { Language } from '../../types';

interface SchoolSectionProps {
  currentLang: Language;
  onOpenSchools: () => void;
}

export const SchoolSection: React.FC<SchoolSectionProps> = ({ currentLang, onOpenSchools }) => {
  return (
    <section className="py-24 bg-[#EAE7DF] border-t border-[#D9D5CB] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#D9D5CB] rounded text-[11px] font-mono font-bold uppercase tracking-wider text-[#171717] mb-4">
            <Building className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>{currentLang === 'ru' ? 'ДЛЯ ШКОЛ И УЧИТЕЛЕЙ' : 'МЕКТЕПТЕР ЖӘНЕ МҰҒАЛІМДЕР ҮШІН'}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#171717] leading-tight">
            {currentLang === 'ru' ? 'Готовьте к ЕНТ целые классы.' : 'Бүкіл сыныпты ҰБТ-ға бірге дайындаңыз.'}
          </h2>

          <p className="mt-4 text-base md:text-lg text-[#171717]/70 font-sans leading-relaxed">
            {currentLang === 'ru'
              ? 'Подключайте учеников, назначайте проверочные работы и отслеживайте подготовку в единой образовательной среде.'
              : 'Оқушыларды қосып, тестілер тағайындап, дайындық нәтижелерін бірыңғай кеңістікте бақылаңыз.'}
          </p>
        </div>

        {/* High-Fidelity UI Preview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Workspace Preview */}
          <div className="lg:col-span-8 bg-white border border-[#D9D5CB] rounded shadow-xs overflow-hidden">
            {/* Top Bar of School Preview */}
            <div className="bg-[#F0EEE8] px-5 py-3 border-b border-[#D9D5CB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#171717]" />
                <span className="text-xs font-bold text-[#171717] tracking-tight">
                  Лицей №28 им. К. Сатпаева · Кабинет школы
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white border border-[#D9D5CB] px-2 py-0.5 rounded text-[#74736F]">
                2026–2027 уч. год
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 border-b border-[#D9D5CB] divide-x divide-[#D9D5CB] bg-[#FAF9F5] text-center py-3">
              <div>
                <div className="text-[10px] font-mono text-[#74736F] uppercase">Активных классов</div>
                <div className="text-base font-bold text-[#171717] mt-0.5">3 класса</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#74736F] uppercase">Учеников в системе</div>
                <div className="text-base font-bold text-[#171717] mt-0.5">28 учащихся</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#74736F] uppercase">Выполнение заданий</div>
                <div className="text-base font-bold text-[#258568] mt-0.5">84% сдали в срок</div>
              </div>
            </div>

            {/* Simulated Classes Table */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase text-[#74736F]">
                  Классы и текущие задания
                </span>
                <span className="text-xs text-[#FF5A36] font-semibold">Все классы →</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-white border border-[#D9D5CB] flex items-center justify-center font-bold text-xs text-[#171717]">
                      11 А
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#171717]">История Казахстана · Казахское ханство</div>
                      <div className="text-[11px] text-[#74736F]">Назначил: Даулет Бауржанович · Дедлайн: 5 ноября</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-[#258568]/10 text-[#258568] text-[11px] font-mono font-bold rounded">
                      24 из 28 сдали
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F5F3EE] border border-[#E2DED5] rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-white border border-[#D9D5CB] flex items-center justify-center font-bold text-xs text-[#171717]">
                      11 Б
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#171717]">Биология · Основы цитологии и генетики</div>
                      <div className="text-[11px] text-[#74736F]">Назначил: Даулет Бауржанович · Дедлайн: 8 ноября</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-[#FF5A36]/10 text-[#FF5A36] text-[11px] font-mono font-bold rounded">
                      В процессе (18/25)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props & CTA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171717]">Быстрое подключение</h4>
                  <p className="text-xs text-[#171717]/70 mt-1">
                    Ученики присоединяются по 6-значному коду класса за 1 минуту без потери личной истории.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171717]">Честная аналитика</h4>
                  <p className="text-xs text-[#171717]/70 mt-1">
                    Учитель сразу видит проблемные темы и вопросы, где класс чаще всего допускает ошибки.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171717]">Фокус-режим для тестов</h4>
                  <p className="text-xs text-[#171717]/70 mt-1">
                    Школьные задания открываются в строгом полноэкранном симуляторе экзамена без отвлекающих элементов.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenSchools}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5A36] text-white font-bold text-sm tracking-wide rounded hover:bg-[#e04825] transition-colors cursor-pointer shadow-xs"
              >
                <span>{currentLang === 'ru' ? 'QazMind для школ' : 'Мектептерге арналған QazMind'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
