import React from 'react';
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
} from 'lucide-react';
import { adminService } from '../../services/adminService';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavGroup {
  title: string;
  items: Array<{
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
    requiredPermission?: string;
  }>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPath, onNavigate, collapsed, onToggleCollapse }) => {
  // Badges come from the server. A null counter means "not loaded", so no badge is drawn for it.
  const counters = adminService.getCounters();
  const badge = (value: number | null) => (value !== null && value > 0 ? value : undefined);

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
          badge: badge(counters.pendingSchools),
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
          badge: badge(counters.inReviewQuestions),
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
          badge: badge(counters.openTickets),
        },
        {
          title: 'Жалобы',
          path: '/admin/reports',
          icon: AlertOctagon,
          badge: badge(counters.pendingReports),
        },
        { title: 'Мониторинг', path: '/admin/monitoring', icon: Cpu },
        {
          title: 'Уведомления',
          path: '/admin/notifications',
          icon: Bell,
          badge: badge(counters.unreadNotifications),
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

      {/* Current administrator. Sign-in is not implemented yet, so no identity is shown. */}
      <div className="border-t border-[#E2DED5] p-3 bg-[#FCFBF9] shrink-0">
        {!collapsed ? (
          <div className="p-2 rounded-lg bg-white border border-[#E2DED5]">
            <p className="text-xs font-semibold text-[#171717]">Вход не выполнен</p>
            <p className="text-[10px] text-[#78716C] mt-0.5">Вход администраторов не подключён</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-8 h-8 rounded-full bg-[#F0EEE8] flex items-center justify-center text-[10px] font-bold text-[#78716C] border border-[#E2DED5]" title="Вход не выполнен">
              —
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
