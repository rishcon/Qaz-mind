import React, { useState } from 'react';
import { Language } from '../../types';
import { Organization, SchoolClass, SchoolAssignment, OrganizationMember } from '../../types/school';
import { WorkspaceSwitcher, WorkspaceOption } from '../common/WorkspaceSwitcher';
import {
  Building,
  Layers,
  GraduationCap,
  FileText,
  BarChart3,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

export type SchoolAdminView =
  | 'overview'
  | 'classes'
  | 'teachers'
  | 'assignments'
  | 'analytics'
  | 'access';

interface SchoolAdminShellProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  organization: Organization;
  currentView: SchoolAdminView;
  onViewChange: (view: SchoolAdminView) => void;
  onSelectWorkspace: (option: WorkspaceOption) => void;
  onLogout: () => void;
  onBackToLanding: () => void;
  children: React.ReactNode;
}

export const SchoolAdminShell: React.FC<SchoolAdminShellProps> = ({
  currentLang,
  onLanguageChange,
  organization,
  currentView,
  onViewChange,
  onSelectWorkspace,
  onLogout,
  onBackToLanding,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: SchoolAdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Обзор школы', icon: <Building className="w-4 h-4" /> },
    { id: 'classes', label: 'Классы и коды', icon: <Layers className="w-4 h-4" /> },
    { id: 'teachers', label: 'Учителя', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'assignments', label: 'Задания', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', label: 'Аналитика пробелов', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'access', label: 'Доступы и места', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col md:flex-row antialiased">
      {/* Desktop Left Sidebar (250px) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#F0EEE8] border-r border-[#E2DED5] flex-col justify-between h-screen sticky top-0 z-30 select-none">
        <div>
          {/* Logo & School Name */}
          <div className="p-5 border-b border-[#E2DED5]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-2xl font-black font-mono tracking-tight text-[#171717]">
                <span>qazmind</span>
                <span className="w-2 h-2 rounded-full bg-[#FF5A36] mb-1 inline-block" />
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#171717] text-white px-2 py-0.5 rounded font-bold">
                ШКОЛА
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E2DED5]">
              <div className="text-xs font-bold text-[#171717] truncate">{organization.name}</div>
              <div className="text-[10px] font-mono text-[#74736F] truncate">
                г. {organization.city} · Администратор
              </div>
            </div>
          </div>

          {/* Nav Section Label */}
          <div className="px-5 pt-5 pb-2">
            <span className="font-mono text-[11px] font-bold text-[#74736F] uppercase tracking-wider block">
              УПРАВЛЕНИЕ
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#171717] shadow-xs font-bold border-l-3 border-[#FF5A36]'
                      : 'text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717]'
                  }`}
                >
                  <span className={isActive ? 'text-[#FF5A36]' : 'text-[#74736F]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E2DED5] space-y-1">
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-[#74736F] hover:bg-[#EAE7DF] hover:text-[#171717] rounded transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#74736F]" />
            <span>На главную</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#F5F3EE]/95 backdrop-blur-md border-b border-[#E2DED5] px-6 md:px-10 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#74736F] uppercase tracking-wider hidden sm:inline">
              QAZMIND SCHOOLS /
            </span>
            <span className="font-bold text-sm md:text-base text-[#171717]">
              {navItems.find((n) => n.id === currentView)?.label || 'Управление школой'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Switcher */}
            <WorkspaceSwitcher
              currentWorkspace="school"
              currentSchoolName={organization.name}
              onSelectWorkspace={onSelectWorkspace}
            />

            {/* Language Switcher */}
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
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-6 md:px-10 py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
