import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  ChevronDown,
  Shield,
  CheckCircle,
  FileQuestion,
  Award,
  FileText,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

interface AdminTopbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  currentPath,
  onNavigate,
  onOpenCommandPalette,
  onToggleMobileSidebar,
}) => {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const notifications = adminService.getNotifications();
  const unreadCount = adminService.getCounters().unreadNotifications ?? 0;

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: 'QazMind Admin', path: '/admin' }];

    const pathTitleMap: Record<string, string> = {
      users: 'Пользователи',
      schools: 'Школы',
      teachers: 'Учителя',
      content: 'Обучение',
      subjects: 'Предметы',
      lessons: 'Уроки',
      questions: 'Банк вопросов',
      new: 'Создание',
      import: 'Импорт',
      review: 'Модерация',
      exams: 'Экзамены',
      assignments: 'Задания',
      analytics: 'Аналитика',
      activity: 'Активность',
      audit: 'История действий',
      finance: 'Подписки и лицензии',
      support: 'Обращения',
      reports: 'Жалобы',
      monitoring: 'Мониторинг',
      notifications: 'Уведомления',
      roles: 'Администраторы',
      settings: 'Настройки',
    };

    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const seg = parts[i];
        const isLast = i === parts.length - 1;
        const mapped = pathTitleMap[seg] || seg;
        crumbs.push({
          label: mapped,
          path: '/' + parts.slice(0, i + 1).join('/'),
        });
      }
    }
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="h-14 bg-white border-b border-[#E2DED5] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded text-[#78716C] hover:bg-[#F5F3EE] cursor-pointer"
            aria-label="Открыть навигацию"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <nav className="flex items-center gap-1.5 text-xs text-[#78716C]">
          {crumbs.map((c, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <React.Fragment key={c.path}>
                {index > 0 && <span className="text-[#C5BFB5]">/</span>}
                {isLast ? (
                  <span className="font-semibold text-[#171717]">{c.label}</span>
                ) : (
                  <button
                    onClick={() => onNavigate(c.path)}
                    className="hover:text-[#171717] transition-colors cursor-pointer"
                  >
                    {c.label}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Quick Actions, Notifications, Badges */}
      <div className="flex items-center gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#F5F3EE] border border-[#E2DED5] text-xs text-[#78716C] hover:border-[#C5BFB5] transition-all cursor-pointer"
          title="Открыть глобальный поиск"
        >
          <Search className="w-3.5 h-3.5 text-[#A8A29E]" />
          <span>Поиск по платформе...</span>
          <kbd className="px-1.5 py-0.2 rounded bg-white text-[10px] font-mono border border-[#E2DED5] text-[#78716C]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FF5A36] text-white text-xs font-medium hover:bg-[#E84D2B] shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Создать</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {quickMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E2DED5] p-1 text-xs space-y-0.5 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  setQuickMenuOpen(false);
                  onNavigate('/admin/content/questions/new');
                }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-[#F5F3EE] flex items-center gap-2 text-[#171717] cursor-pointer"
              >
                <FileQuestion className="w-4 h-4 text-[#FF5A36]" />
                <span>Добавить вопрос ЕНТ</span>
              </button>
              <button
                onClick={() => {
                  setQuickMenuOpen(false);
                  onNavigate('/admin/exams');
                }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-[#F5F3EE] flex items-center gap-2 text-[#171717] cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#D89B35]" />
                <span>Собрать пробный экзамен</span>
              </button>
              <button
                onClick={() => {
                  setQuickMenuOpen(false);
                  onNavigate('/admin/content/lessons');
                }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-[#F5F3EE] flex items-center gap-2 text-[#171717] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#3B82F6]" />
                <span>Создать урок</span>
              </button>
              <button
                onClick={() => {
                  setQuickMenuOpen(false);
                  onNavigate('/admin/content/questions/import');
                }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-[#F5F3EE] flex items-center gap-2 text-[#171717] cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-[#258568]" />
                <span>Импорт вопросов (CSV)</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-1.5 rounded-md text-[#78716C] hover:bg-[#F5F3EE] hover:text-[#171717] relative cursor-pointer"
            aria-label="Уведомления"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5A36] ring-2 ring-white" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-[#E2DED5] overflow-hidden z-50 animate-in fade-in">
              <div className="p-3 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
                <span className="text-xs font-semibold text-[#171717]">Уведомления платформы</span>
                <span className="text-[10px] text-[#A8A29E]">{unreadCount > 0 ? `${unreadCount} новых` : ''}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2DED5]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#78716C]">Нет уведомлений</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setNotifMenuOpen(false);
                        onNavigate(notif.linkUrl);
                      }}
                      className={`p-3 text-xs hover:bg-[#F9F8F5] cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-[#FFF7F5]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-[#171717] leading-snug">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-[#E2DED5] bg-[#FCFBF9] text-center">
                <button
                  onClick={() => {
                    setNotifMenuOpen(false);
                    onNavigate('/admin/notifications');
                  }}
                  className="text-xs text-[#FF5A36] hover:underline font-medium cursor-pointer"
                >
                  Все уведомления
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
