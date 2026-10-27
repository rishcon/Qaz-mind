import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAttention } from '../api/AttentionProvider';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

/** What needs a staff action right now, counted by the server and refreshed every minute. */
export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { items, loaded, reload } = useAttention();

  return (
    <div className="space-y-5 animate-in fade-in duration-150 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Уведомления</h1>
          <p className="text-xs text-[#78716C] mt-0.5">Задачи, которые ждут действий сотрудников. Список строит сервер по данным базы.</p>
        </div>
        <button onClick={reload} className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Обновить
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] divide-y divide-[#E2DED5] overflow-hidden">
        {!loaded && <p className="p-6 text-xs text-[#78716C]">Загрузка…</p>}
        {loaded && items.length === 0 && <p className="p-6 text-xs text-[#78716C]">Сейчас ничего не ждёт действий.</p>}
        {items.map((n) => (
          <div key={n.id} onClick={() => onNavigate(n.action_url)} className="p-4 hover:bg-[#FAF9F6] cursor-pointer flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
              <span className="font-bold text-[#171717] text-sm">{n.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FEF7EA] text-[#9A6715] font-bold">{n.count}</span>
            </div>
            <div className="flex items-center gap-1 text-[#FF5A36] font-semibold">
              Перейти <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
