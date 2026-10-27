import React from 'react';
import { Bell, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { adminService } from '../services/adminService';
import { mockDb } from '../repositories/mockDatabase';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const notifications = adminService.getNotifications();

  const handleMarkAllRead = () => {
    mockDb.notifications.forEach((n) => (n.isRead = true));
    mockDb.notify();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Центр административных уведомлений</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Оперативные оповещения о новых заявках школ, жалобах на вопросы и запросах модерации.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Check className="w-3.5 h-3.5 text-[#258568]" /> Отметить все прочитанными
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] divide-y divide-[#E2DED5] overflow-hidden shadow-xs">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              adminService.markNotificationAsRead(n.id);
              onNavigate(n.linkUrl);
            }}
            className={`p-4 hover:bg-[#FAF9F6] transition-colors cursor-pointer flex items-start justify-between gap-4 text-xs ${
              !n.isRead ? 'bg-[#FFF7F5]' : ''
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />}
                <span className="font-bold text-[#171717] text-sm">{n.title}</span>
                <span className="text-[10px] text-[#A8A29E] font-mono">
                  {new Date(n.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <p className="text-[#5C574F] leading-relaxed">{n.message}</p>
            </div>

            <div className="flex items-center gap-1 text-[#FF5A36] font-semibold shrink-0 pt-1">
              <span>Перейти</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
