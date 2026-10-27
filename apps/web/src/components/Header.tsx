import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { locales } from '../content/locales';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = locales[currentLang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#subjects', label: t.nav.subjects },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#D9D5CB] py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          : 'bg-transparent py-5 border-b border-[#D9D5CB]/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          className="group flex items-center gap-1 text-2xl font-black tracking-tight text-[#171717] select-none shrink-0"
        >
          <span className="font-display tracking-tighter">qazmind</span>
          <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block transition-transform duration-200 group-hover:scale-125" />
        </a>

        {/* Zone 2: Editorial Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#171717]/80">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 whitespace-nowrap shrink-0 hover:text-[#171717] transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#FF5A36] hover:after:w-full after:transition-all after:duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Controls (Language Switcher + Action CTA) */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          {/* Language toggle: clean unboxed typography */}
          <div className="flex items-center text-xs font-semibold tracking-wider text-[#171717]/60">
            <button
              type="button"
              onClick={() => onLanguageChange('ru')}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                currentLang === 'ru'
                  ? 'text-[#171717] font-bold border-b-2 border-[#FF5A36]'
                  : 'hover:text-[#171717]'
              }`}
            >
              RU
            </button>
            <span className="text-[#D9D5CB] px-0.5">/</span>
            <button
              type="button"
              onClick={() => onLanguageChange('kz')}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                currentLang === 'kz'
                  ? 'text-[#171717] font-bold border-b-2 border-[#FF5A36]'
                  : 'hover:text-[#171717]'
              }`}
            >
              KZ
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenLogin}
            className="text-sm font-medium text-[#171717] hover:text-[#FF5A36] transition-colors cursor-pointer"
          >
            {t.nav.login}
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF5A36] hover:bg-[#E54825] active:translate-y-0.5 transition-all duration-150 uppercase tracking-wider rounded-none cursor-pointer"
          >
            <span>{t.nav.startFree}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger button */}
        <div className="flex md:hidden items-center gap-3">
          <div className="flex items-center text-xs font-bold text-[#171717]">
            <button
              type="button"
              onClick={() => onLanguageChange('ru')}
              className={`px-1.5 py-1 ${currentLang === 'ru' ? 'text-[#FF5A36]' : 'text-[#171717]/60'}`}
            >
              RU
            </button>
            <span className="text-[#D9D5CB]">/</span>
            <button
              type="button"
              onClick={() => onLanguageChange('kz')}
              className={`px-1.5 py-1 ${currentLang === 'kz' ? 'text-[#FF5A36]' : 'text-[#171717]/60'}`}
            >
              KZ
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#171717] border border-[#D9D5CB] hover:bg-[#EAE7DF] transition-colors"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F5F3EE] border-b border-[#D9D5CB] px-6 py-8 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-5 text-lg font-display font-bold text-[#171717]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#D9D5CB]/40 hover:text-[#FF5A36] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full py-3 text-center text-sm font-bold border border-[#171717] text-[#171717] hover:bg-[#EAE7DF] transition-colors cursor-pointer"
            >
              {t.nav.login}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="w-full py-3.5 text-center text-sm font-bold text-white bg-[#FF5A36] hover:bg-[#E54825] uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t.nav.startFree}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
