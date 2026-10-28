import React from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';

interface FooterProps {
  currentLang: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  const t = locales[currentLang];

  return (
    <footer className="bg-[#EAE7DF] text-[#171717] py-12 border-t border-[#D9D5CB]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <div className="flex items-center gap-1 text-2xl font-black tracking-tight select-none font-display">
            <span>qazmind</span>
            <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block" />
          </div>
          <p className="mt-3 text-sm text-[#171717]/70">{t.footer.tagline}</p>
        </div>

        <nav className="flex items-center gap-8 text-sm font-medium">
          <a href="#subjects" className="hover:text-[#FF5A36] transition-colors">
            {t.nav.subjects}
          </a>
          <a href="#how-it-works" className="hover:text-[#FF5A36] transition-colors">
            {t.nav.howItWorks}
          </a>
        </nav>

        <div className="font-mono text-xs text-[#171717]/60">{t.footer.copyright}</div>
      </div>
    </footer>
  );
};
