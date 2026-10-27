import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';

interface FooterProps {
  currentLang: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  const t = locales[currentLang];

  return (
    <footer className="bg-[#EAE7DF] text-[#171717] pt-16 pb-12 border-t border-[#D9D5CB]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#D9D5CB]">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-1 text-2xl font-black tracking-tight text-[#171717] select-none font-display mb-3">
              <span>qazmind</span>
              <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block" />
            </div>
            <p className="text-sm text-[#171717]/80 max-w-sm leading-relaxed mb-4">
              {t.footer.tagline}
            </p>
            <p className="text-xs text-[#171717]/60 leading-relaxed font-mono">
              {t.footer.standardNote}
            </p>
          </div>

          {/* Navigation Links (3 cols) */}
          <div className="md:col-span-3 text-sm">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-4">
              {currentLang === 'ru' ? 'РАЗДЕЛЫ САЙТА' : 'САЙТ БӨЛІМДЕРІ'}
            </span>
            <ul className="space-y-2.5">
              <li>
                <a href="#platform" className="hover:text-[#FF5A36] transition-colors">
                  {t.nav.platform}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#FF5A36] transition-colors">
                  {t.nav.howItWorks}
                </a>
              </li>
              <li>
                <a href="#subjects" className="hover:text-[#FF5A36] transition-colors">
                  {t.nav.subjects}
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#FF5A36] transition-colors">
                  {t.nav.pricing}
                </a>
              </li>
            </ul>
          </div>

          {/* Subjects Quick Jump (4 cols) */}
          <div className="md:col-span-4 text-xs font-mono">
            <span className="font-mono text-xs font-bold text-[#FF5A36] uppercase tracking-wider block mb-4">
              {currentLang === 'ru' ? 'ЕНТ / ҰБТ ДИСЦИПЛИНЫ' : 'ҰБТ / ЕНТ ПӘНДЕРІ'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-[#171717]/80">
              <span>{currentLang === 'ru' ? 'История Казахстана' : 'Қазақстан тарихы'}</span>
              <span>{currentLang === 'ru' ? 'Матграмотность' : 'Матсауаттылық'}</span>
              <span>{currentLang === 'ru' ? 'Грамотность чтения' : 'Оқу сауаттылығы'}</span>
              <span>{currentLang === 'ru' ? 'Математика' : 'Математика'}</span>
              <span>{currentLang === 'ru' ? 'Физика' : 'Физика'}</span>
              <span>{currentLang === 'ru' ? 'Химия & Биология' : 'Химия & Биология'}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#171717]/60">
          <div>{t.footer.copyright}</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#171717] transition-colors">
              {t.footer.terms}
            </a>
            <a href="#" className="hover:text-[#171717] transition-colors">
              {t.footer.privacy}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
