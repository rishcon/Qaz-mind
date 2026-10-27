import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  FileText,
  HelpCircle,
  FileCheck2,
  Award,
  CalendarCheck,
  BarChart3,
  Activity,
  History,
  CreditCard,
  MessageSquare,
  AlertOctagon,
  Cpu,
  Bell,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { RoleType } from '../../types';
import { mockDb } from '../../repositories/mockDatabase';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenRoleSwitcher?: () => void;
  onSwitchWorkspace?: (workspace: 'student' | 'teacher' | 'school' | 'landing') => void;
}

interface NavGroup {
  title: string;
  items: Array<{
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    requiredPermission?: string;
  }>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenRoleSwitcher,
  onSwitchWorkspace,
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Compute live unread / pending badge counts
  const pendingSchools = mockDb.schools.filter((s) => s.approvalStatus === 'pending_verification').length;
  const inReviewQuestions = mockDb.questions.filter((q) => q.status === 'in_review').length;
  const pendingReports = mockDb.contentReports.filter((r) => r.status === 'pending').length;
  const openTickets = mockDb.supportTickets.filter((t) => t.status === 'new').length;
  const unreadNotifs = mockDb.notifications.filter((n) => !n.isRead).length;

  const navGroups: NavGroup[] = [
    {
      title: 'ОСНОВНОЕ',
      items: [
        { title: 'Обзор', path: '/admin', icon: LayoutDashboard },
        { title: 'Пользователи', path: '/admin/users', icon: Users },
        {
          title: 'Школы',
          path: '/admin/schools',
          icon: Building2,
          badge: pendingSchools > 0 ? pendingSchools : undefined,
        },
        { title: 'Учителя', path: '/admin/teachers', icon: GraduationCap },
      ],
    },
    {
      title: 'ОБУЧЕНИЕ',
      items: [
        { title: 'Предметы', path: '/admin/content/subjects', icon: BookOpen },
        { title: 'Уроки', path: '/admin/content/lessons', icon: FileText },
        { title: 'Банк вопросов', path: '/admin/content/questions', icon: HelpCircle },
        {
          title: 'Модерация',
          path: '/admin/content/review',
          icon: FileCheck2,
          badge: inReviewQuestions > 0 ? inReviewQuestions : undefined,
        },
        { title: 'Экзамены', path: '/admin/exams', icon: Award },
        { title: 'Задания', path: '/admin/assignments', icon: CalendarCheck },
      ],
    },
    {
      title: 'АНАЛИТИКА',
      items: [
        { title: 'Аналитика', path: '/admin/analytics', icon: BarChart3 },
        { title: 'Активность', path: '/admin/activity', icon: Activity },
        { title: 'История действий', path: '/admin/audit', icon: History },
      ],
    },
    {
      title: 'УПРАВЛЕНИЕ',
      items: [
        { title: 'Подписки', path: '/admin/finance', icon: CreditCard },
        {
          title: 'Обращения',
          path: '/admin/support',
          icon: MessageSquare,
          badge: openTickets > 0 ? openTickets : undefined,
        },
        {
          title: 'Жалобы',
          path: '/admin/reports',
          icon: AlertOctagon,
          badge: pendingReports > 0 ? pendingReports : undefined,
        },
        { title: 'Мониторинг', path: '/admin/monitoring', icon: Cpu },
        {
          title: 'Уведомления',
          path: '/admin/notifications',
          icon: Bell,
          badge: unreadNotifs > 0 ? unreadNotifs : undefined,
        },
      ],
    },
    {
      title: 'СИСТЕМА',
      items: [
        { title: 'Администраторы', path: '/admin/roles', icon: ShieldCheck },
        { title: 'Настройки', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const roleNameMap: Record<RoleType, string> = {
    OWNER: 'Владелец платформы',
    PLATFORM_ADMIN: 'Администратор',
    CONTENT_MANAGER: 'Контент-менеджер',
    CONTENT_REVIEWER: 'Рецензент ЕНТ',
    SUPPORT_AGENT: 'Служба поддержки',
    FINANCE_MANAGER: 'Финансовый менеджер',
    ANALYST: 'Аналитик данных',
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-[#E2DED5] flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-[#E2DED5] flex items-center justify-between px-4 shrink-0 bg-[#FCFBF9]">
        {!collapsed && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-[#171717]">
              qazmind<span className="text-[#FF5A36]">.</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#F0EEE8] text-[#5C574F] border border-[#E2DED5]">
              ADMIN
            </span>
          </div>
        )}

        {collapsed && (
          <span className="mx-auto text-base font-bold text-[#FF5A36]">
            Q<span className="text-[#171717]">.</span>
          </span>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] transition-colors cursor-pointer"
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-[#A8A29E] uppercase">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? currentPath === '/admin'
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  title={collapsed ? item.title : undefined}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF7F5] text-[#FF5A36] font-semibold border-l-2 border-[#FF5A36]'
                      : 'text-[#5C574F] hover:bg-[#F5F3EE] hover:text-[#171717]'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF5A36]' : 'text-[#78716C]'}`} />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#FF5A36] text-white'
                          : 'bg-[#F0EEE8] text-[#5C574F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Profile & Role Bar */}
      <div className="border-t border-[#E2DED5] p-3 bg-[#FCFBF9] shrink-0">
        {!collapsed ? (
          <div>
            <div
              onClick={onOpenRoleSwitcher}
              className="p-2 rounded-lg bg-white border border-[#E2DED5] hover:border-[#FF5A36]/40 transition-all cursor-pointer group"
              title="Нажмите, чтобы переключить роль для тестирования доступа"
            >
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#171717] truncate">{mockDb.currentAdminName}</p>
                  <p className="text-[10px] text-[#258568] font-medium truncate flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#258568]" />
                    {roleNameMap[mockDb.currentAdminRole]}
                  </p>
                </div>
                <span className="text-[10px] text-[#A8A29E] group-hover:text-[#FF5A36] font-mono">
                  Сменить
                </span>
              </div>
            </div>

            {/* Platform Ecosystem Quick Switch */}
            <div className="relative mt-2">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] text-[#78716C] bg-[#F5F3EE] hover:bg-[#EBE8E0] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ExternalLink className="w-3 h-3 text-[#A8A29E]" />
                  <span>Перейти в кабинет...</span>
                </span>
                <ChevronDown className="w-3 h-3 text-[#A8A29E]" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-[#E2DED5] p-1 text-xs space-y-0.5 z-50 animate-in fade-in">
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      onSwitchWorkspace && onSwitchWorkspace('student');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F5F3EE] text-[#171717] cursor-pointer"
                  >
                    🎓 Кабинет ученика ЕНТ
                  </button>
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      onSwitchWorkspace && onSwitchWorkspace('teacher');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F5F3EE] text-[#171717] cursor-pointer"
                  >
                    👩‍🏫 Кабинет преподавателя
                  </button>
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      onSwitchWorkspace && onSwitchWorkspace('school');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F5F3EE] text-[#171717] cursor-pointer"
                  >
                    🏫 Управление школой
                  </button>
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      onSwitchWorkspace && onSwitchWorkspace('landing');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F5F3EE] text-[#171717] cursor-pointer"
                  >
                    🌐 Главная страница QazMind
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenRoleSwitcher}
              className="w-8 h-8 rounded-full bg-[#F0EEE8] flex items-center justify-center text-xs font-bold text-[#FF5A36] border border-[#E2DED5] cursor-pointer"
              title={`${mockDb.currentAdminName} (${mockDb.currentAdminRole})`}
            >
              АС
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
