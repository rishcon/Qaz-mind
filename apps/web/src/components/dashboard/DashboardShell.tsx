import React from 'react';
import { Language } from '../../types';
import { DashboardView, StudentProfile } from '../../types/dashboard';
import {
  Calendar,
  Compass,
  BookOpen,
  PenTool,
  Award,
  AlertCircle,
  BarChart2,
  Settings,
  LogOut,
  User,
  Building2,
} from 'lucide-react';

interface DashboardShellProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  profile: StudentProfile;
  mistakesCount?: number;
  onLogout: () => void;
  /** Set only when the person has a school membership: opens the school workspace. */
  onOpenSchool?: () => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentView,
  onViewChange,
  currentLang,
  onLanguageChange,
  profile,
  mistakesCount = 0,
  onLogout,
  onOpenSchool,
  children,
}) => {
  const navItems = [
    {
      id: 'today' as DashboardView,
      labelRu: 'Сегодня',
      labelKz: 'Бүгін',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'route' as DashboardView,
      labelRu: 'Мой маршрут',
      labelKz: 'Менің маршрутым',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'subjects' as DashboardView,
      labelRu: 'Предметы',
      labelKz: 'Пәндер',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'practice' as DashboardView,
      labelRu: 'Практика',
      labelKz: 'Практика',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'mock_exam' as DashboardView,
      labelRu: 'Пробное ЕНТ',
      labelKz: 'Байқау ҰБТ-сы',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'mistakes' as DashboardView,
      labelRu: 'Мои ошибки',
      labelKz: 'Менің қателерім',
      icon: <AlertCircle className="w-4 h-4" />,
      badge: mistakesCount > 0 ? String(mistakesCount) : undefined,
    },
    {
      id: 'progress' as DashboardView,
      labelRu: 'Прогресс',
      labelKz: 'Прогресс',
      icon: <BarChart2 className="w-4 h-4" />,
    },
  ];

  const getViewTitle = () => {
    switch (currentView) {
      case 'today':
        return currentLang === 'ru' ? 'Сегодня' : 'Бүгін';
      case 'route':
        return currentLang === 'ru' ? 'Мой маршрут' : 'Менің маршрутым';
      case 'subjects':
        return currentLang === 'ru' ? 'Мои предметы' : 'Менің пәндерім';
      case 'practice':
        return currentLang === 'ru' ? 'Практика' : 'Практика';
      case 'mock_exam':
        return currentLang === 'ru' ? 'Пробное ЕНТ' : 'Байқау ҰБТ-сы';
      case 'mistakes':
        return currentLang === 'ru' ? 'Мои ошибки' : 'Менің қателерім';
      case 'progress':
        return currentLang === 'ru' ? 'Мой прогресс' : 'Менің прогресім';
      case 'settings':
        return currentLang === 'ru' ? 'Настройки' : 'Баптаулар';
      default:
        return 'QazMind';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col md:flex-row antialiased">
      {/* Desktop Left Sidebar (250px) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#F0EEE8] border-r border-[#E2DED5] flex-col justify-between h-screen sticky top-0 z-30 select-none">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[#E2DED5] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onViewChange('today')}
              className="flex items-center gap-1 text-2xl font-black font-mono tracking-tight text-[#171717] cursor-pointer"
            >
              <span>qazmind</span>
              <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block" />
            </button>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#74736F] bg-[#E5E2DA] px-2 py-0.5 rounded">
              КАБИНЕТ
            </span>
          </div>

          {/* Nav Section Label */}
          <div className="px-6 pt-6 pb-2">
            <span className="font-mono text-[11px] font-bold text-[#74736F] uppercase tracking-wider block">
              {currentLang === 'ru' ? 'МОЁ ОБУЧЕНИЕ' : 'МЕНІҢ ОҚУЫМ'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#171717] shadow-xs font-bold border-l-3 border-[#FF5A36]'
                      : 'text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#FF5A36]' : 'text-[#74736F]'}>
                      {item.icon}
                    </span>
                    <span>{currentLang === 'ru' ? item.labelRu : item.labelKz}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-[#FF5A36] text-white'
                          : 'bg-[#E2DED5] text-[#74736F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Settings, Help & Student Info */}
        <div className="p-3 border-t border-[#E2DED5] space-y-1">
          <button
            type="button"
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
              currentView === 'settings'
                ? 'bg-white text-[#171717] font-bold'
                : 'text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717]'
            }`}
          >
            <Settings className="w-4 h-4 text-[#74736F]" />
            <span>{currentLang === 'ru' ? 'Настройки' : 'Баптаулар'}</span>
          </button>

          {onOpenSchool && (
            <button
              type="button"
              onClick={onOpenSchool}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded transition-colors cursor-pointer text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717]"
            >
              <Building2 className="w-4 h-4 text-[#74736F]" />
              <span>{currentLang === 'ru' ? 'Кабинет школы' : 'Мектеп кабинеті'}</span>
            </button>
          )}

          {/* Student Profile Card */}
          <div
            onClick={() => onViewChange('settings')}
            className="mt-2 p-2.5 bg-white border border-[#E2DED5] rounded flex items-center justify-between cursor-pointer hover:border-[#171717]/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                {profile.name[0] || 'С'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#171717] leading-none line-clamp-1">
                  {profile.name}
                </div>
                <div className="text-[10px] font-mono text-[#74736F] mt-0.5">
                  Цель: {profile.targetScore}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Выйти из аккаунта"
              className="text-[#74736F] hover:text-red-600 p-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-6 md:px-10 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#74736F] uppercase tracking-wider hidden sm:inline">
              QAZMIND /
            </span>
            <h1 className="font-bold text-base md:text-lg text-[#171717]">
              {getViewTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* Language Switcher */}
            <div className="flex items-center text-xs font-mono font-bold text-[#74736F]">
              <button
                type="button"
                onClick={() => onLanguageChange('ru')}
                className={`px-1.5 py-0.5 cursor-pointer ${
                  currentLang === 'ru'
                    ? 'text-[#171717] border-b-2 border-[#FF5A36]'
                    : 'hover:text-[#171717]'
                }`}
              >
                RU
              </button>
              <span className="text-[#E2DED5] px-0.5">/</span>
              <button
                type="button"
                onClick={() => onLanguageChange('kz')}
                className={`px-1.5 py-0.5 cursor-pointer ${
                  currentLang === 'kz'
                    ? 'text-[#171717] border-b-2 border-[#FF5A36]'
                    : 'hover:text-[#171717]'
                }`}
              >
                KZ
              </button>
            </div>

            {/* Mobile Account Action */}
            <button
              type="button"
              onClick={onLogout}
              className="md:hidden text-xs font-mono text-[#74736F] hover:text-red-600 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible ONLY on mobile devices) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F0EEE8] border-t border-[#E2DED5] px-2 py-1.5 z-40 flex items-center justify-around shadow-sm">
        {navItems.slice(0, 5).map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${
                isActive ? 'text-[#FF5A36] font-bold' : 'text-[#74736F]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-mono leading-none">
                {currentLang === 'ru' ? item.labelRu : item.labelKz}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
