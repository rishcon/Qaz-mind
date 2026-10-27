import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building, BookOpen, GraduationCap, ShieldCheck, Check } from 'lucide-react';
import { DEMO_MODE } from '../../config';

export interface WorkspaceOption {
  id: string;
  type: 'personal' | 'school_admin' | 'teacher' | 'platform_admin';
  title: string;
  subtitle: string;
  orgId?: string;
  route: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspace: 'personal' | 'school' | 'teacher' | 'platform_admin';
  currentSchoolName?: string;
  onSelectWorkspace: (option: WorkspaceOption) => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  currentSchoolName = 'Лицей №28 им. К. Сатпаева',
  onSelectWorkspace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allOptions: WorkspaceOption[] = [
    {
      id: 'ws_personal',
      type: 'personal',
      title: 'Личное обучение',
      subtitle: 'Подготовка ученика к ЕНТ',
      route: '/app',
    },
    {
      id: 'ws_school_admin',
      type: 'school_admin',
      title: currentSchoolName,
      subtitle: 'Администратор школы',
      orgId: 'school_lyceum28',
      route: '/school',
    },
    {
      id: 'ws_teacher',
      type: 'teacher',
      title: 'Кабинет учителя',
      subtitle: 'Даулет Бауржанович · 11 «А»',
      route: '/teacher',
    },
    {
      id: 'ws_platform_admin',
      type: 'platform_admin',
      title: 'Платформа QazMind',
      subtitle: 'Модерация заявок и лицензий',
      route: '/admin/schools',
    },
  ];

  // Outside demo mode only the personal workspace is real; school and admin spaces are hidden.
  const options = DEMO_MODE ? allOptions : allOptions.filter((o) => o.type === 'personal');

  const currentOption =
    options.find((o) => {
      if (currentWorkspace === 'personal') return o.type === 'personal';
      if (currentWorkspace === 'school') return o.type === 'school_admin';
      if (currentWorkspace === 'teacher') return o.type === 'teacher';
      if (currentWorkspace === 'platform_admin') return o.type === 'platform_admin';
      return false;
    }) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getIcon = (type: WorkspaceOption['type']) => {
    switch (type) {
      case 'personal':
        return <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" />;
      case 'school_admin':
        return <Building className="w-3.5 h-3.5 text-[#171717]" />;
      case 'teacher':
        return <GraduationCap className="w-3.5 h-3.5 text-[#258568]" />;
      case 'platform_admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#D9D5CB] hover:border-[#171717] rounded text-xs font-semibold text-[#171717] transition-colors cursor-pointer shadow-2xs"
        aria-expanded={isOpen}
      >
        <span className="p-0.5 rounded bg-[#F5F3EE]">{getIcon(currentOption.type)}</span>
        <span className="max-w-[140px] sm:max-w-[180px] truncate">{currentOption.title}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#74736F]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#D9D5CB] rounded shadow-md py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-[#E2DED5]">
            <span className="font-mono text-[10px] font-bold text-[#74736F] uppercase tracking-wider block">
              МОИ ПРОСТРАНСТВА
            </span>
          </div>

          <div className="py-1">
            {options.map((option) => {
              const isSelected = option.type === currentOption.type;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSelectWorkspace(option);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-[#FAF9F5] transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F5F3EE]' : ''
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{getIcon(option.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#171717] truncate">{option.title}</div>
                    <div className="text-[10px] text-[#74736F] truncate">{option.subtitle}</div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5A36] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
