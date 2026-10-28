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
  LogOut,
} from 'lucide-react';
import { useAttention } from '../../api/AttentionProvider';
import { ROLE_TITLES, useStaff } from '../../auth/StaffAuth';

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
    /** The section has no server side yet. */
    soon?: boolean;
  }>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPath, onNavigate, collapsed, onToggleCollapse }) => {
  const { session, can, signOut } = useStaff();
  // Badges are counted by the server.
  const { items: attention } = useAttention();
  const count = (id: string) => attention.find((a) => a.id === id)?.count;

  const navGroups: NavGroup[] = [
    {
      title: 'ОСНОВНОЕ',
      items: [
        { title: 'Обзор', path: '/admin', icon: LayoutDashboard },
        { title: 'Пользователи', path: '/admin/users', icon: Users, requiredPermission: 'users.read' },
        { title: 'Школы', path: '/admin/schools', icon: Building2, requiredPermission: 'schools.read' },
        { title: 'Учителя', path: '/admin/teachers', icon: GraduationCap, requiredPermission: 'users.read', soon: true },
      ],
    },
    {
      title: 'ОБУЧЕНИЕ',
      items: [
        { title: 'Предметы', path: '/admin/content/subjects', icon: BookOpen },
        { title: 'Уроки', path: '/admin/content/lessons', icon: FileText, badge: count('lessons_in_review') },
        { title: 'Банк вопросов', path: '/admin/content/questions', icon: HelpCircle },
        {
          title: 'Модерация',
          path: '/admin/content/review',
          icon: FileCheck2,
          badge: count('questions_in_review'),
          requiredPermission: 'content.review',
        },
        { title: 'Экзамены', path: '/admin/exams', icon: Award, requiredPermission: 'exams.manage', soon: true },
        { title: 'Задания', path: '/admin/assignments', icon: CalendarCheck, requiredPermission: 'schools.read', soon: true },
      ],
    },
    {
      title: 'АНАЛИТИКА',
      items: [
        { title: 'Аналитика', path: '/admin/analytics', icon: BarChart3 },
        { title: 'Активность', path: '/admin/activity', icon: Activity, requiredPermission: 'users.read', soon: true },
        { title: 'История действий', path: '/admin/audit', icon: History, requiredPermission: 'audit.read' },
      ],
    },
    {
      title: 'УПРАВЛЕНИЕ',
      items: [
        { title: 'Подписки', path: '/admin/finance', icon: CreditCard, requiredPermission: 'finance.manage', soon: true },
        { title: 'Обращения', path: '/admin/support', icon: MessageSquare, requiredPermission: 'support.manage', soon: true },
        { title: 'Жалобы', path: '/admin/reports', icon: AlertOctagon, requiredPermission: 'reports.resolve', soon: true },
        { title: 'Мониторинг', path: '/admin/monitoring', icon: Cpu, requiredPermission: 'monitoring.read' },
        {
          title: 'Уведомления',
          path: '/admin/notifications',
          icon: Bell,
          badge: attention.reduce((sum, a) => sum + a.count, 0) || undefined,
        },
      ],
    },
    {
      title: 'СИСТЕМА',
      items: [
        { title: 'Администраторы', path: '/admin/roles', icon: ShieldCheck, requiredPermission: 'staff.manage' },
        { title: 'Настройки', path: '/admin/settings', icon: Settings, requiredPermission: 'settings.manage', soon: true },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      // Hiding a link is convenience only: the server refuses the request anyway.
      items: group.items.filter((item) => !item.requiredPermission || can(item.requiredPermission)),
    }))
    .filter((group) => group.items.length > 0);

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

                  {!collapsed && item.soon && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#F0EEE8] text-[#A8A29E]">
                      скоро
                    </span>
                  )}
                  {!collapsed && !item.soon && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
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

      {/* Signed-in staff member, as confirmed by the server */}
      <div className="border-t border-[#E2DED5] p-3 bg-[#FCFBF9] shrink-0">
        {!collapsed ? (
          <div className="p-2 rounded-lg bg-white border border-[#E2DED5] flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#171717] truncate">{session?.staff.name}</p>
              <p className="text-[10px] text-[#78716C] mt-0.5 truncate">
                {session?.staff.roles.map((r) => ROLE_TITLES[r] ?? r).join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              title="Выйти"
              className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#C94A43] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void signOut()}
              title="Выйти"
              className="w-8 h-8 rounded-full bg-[#F0EEE8] flex items-center justify-center text-[#78716C] border border-[#E2DED5] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
