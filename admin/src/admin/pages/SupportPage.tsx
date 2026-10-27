import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { SupportTicket } from '../types';
import { adminService } from '../services/adminService';
import { DataTable, ColumnDef, TableFilter } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockDb } from '../repositories/mockDatabase';

export const SupportPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const tickets = adminService.getSupportTickets({ status: statusFilter });

  const activeTicket = selectedTicket
    ? mockDb.supportTickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null;

  const handleSendMessage = () => {
    if (!activeTicket || !responseText.trim()) return;
    adminService.addSupportMessage(activeTicket.id, responseText, isInternalNote);
    setResponseText('');
    setIsInternalNote(false);
  };

  const handleChangeStatus = (newStatus: SupportTicket['status']) => {
    if (!activeTicket) return;
    adminService.updateTicketStatus(activeTicket.id, newStatus);
  };

  const columns: ColumnDef<SupportTicket>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      cell: (t) => <span className="font-mono text-xs font-bold text-[#FF5A36]">{t.id}</span>,
    },
    {
      key: 'subject',
      header: 'Тема обращения',
      cell: (t) => (
        <div>
          <div className="font-semibold text-xs text-[#171717] leading-snug">{t.subject}</div>
          <div className="text-[11px] text-[#78716C]">
            Категория: <span className="capitalize">{t.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Пользователь',
      cell: (t) => (
        <div>
          <div className="text-xs font-medium text-[#171717]">{t.userName}</div>
          <div className="text-[11px] text-[#78716C]">{t.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Приоритет',
      sortable: true,
      cell: (t) => {
        const pMap: Record<string, string> = {
          urgent: 'Срочный',
          high: 'Высокий',
          medium: 'Обычный',
          low: 'Низкий',
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              t.priority === 'urgent' || t.priority === 'high'
                ? 'bg-[#FFF1F2] text-[#BE123C]'
                : 'bg-[#F0EEE8] text-[#5C574F]'
            }`}
          >
            {pMap[t.priority] || t.priority}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Статус',
      sortable: true,
      cell: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'createdAt',
      header: 'Дата создания',
      sortable: true,
      cell: (t) => (
        <span className="text-[11px] font-mono text-[#78716C]">
          {new Date(t.createdAt).toLocaleDateString('ru-RU')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Служба поддержки и обращения</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Обработка вопросов учащихся, координаторов школ и разбор спорных ситуаций.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tickets Table */}
        <div className="lg:col-span-2 space-y-3">
          <DataTable
            data={tickets}
            columns={columns}
            keyExtractor={(t) => t.id}
            searchPlaceholder="Поиск по теме или email..."
            onRowClick={(t) => setSelectedTicket(t)}
          />
        </div>

        {/* Right Column: Ticket Conversation & Response Panel */}
        <div>
          {activeTicket ? (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs flex flex-col justify-between min-h-[500px]">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E2DED5] flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#FF5A36]">
                      #{activeTicket.id}
                    </span>
                    <h3 className="text-sm font-bold text-[#171717] mt-0.5">{activeTicket.subject}</h3>
                    <p className="text-[11px] text-[#78716C]">
                      {activeTicket.userName} ({activeTicket.userEmail})
                    </p>
                  </div>
                  <StatusBadge status={activeTicket.status} />
                </div>

                {/* Status Switcher Bar */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#78716C] text-[11px]">Статус:</span>
                  {(['new', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleChangeStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                        activeTicket.status === st
                          ? 'bg-[#171717] text-white border-[#171717]'
                          : 'bg-[#FAF9F6] text-[#78716C] border-[#E2DED5] hover:bg-[#F0EEE8]'
                      }`}
                    >
                      {st === 'new'
                        ? 'Новый'
                        : st === 'in_progress'
                        ? 'В работе'
                        : st === 'resolved'
                        ? 'Решен'
                        : 'Закрыт'}
                    </button>
                  ))}
                </div>

                {/* Messages Timeline */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        m.isInternalNote
                          ? 'bg-[#FEF7EA] border border-[#D89B35]/30 text-[#9A6715]'
                          : m.sender === 'agent'
                          ? 'bg-[#F4FAF7] border border-[#258568]/20 text-[#171717]'
                          : 'bg-[#FAF9F6] border border-[#E2DED5] text-[#171717]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-[11px]">
                        <span className="flex items-center gap-1">
                          {m.isInternalNote && <Lock className="w-3 h-3 text-[#D89B35]" />}
                          {m.senderName}
                        </span>
                        <span className="text-[10px] text-[#A8A29E] font-normal font-mono">
                          {new Date(m.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Composer */}
              <div className="pt-4 border-t border-[#E2DED5] mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-[11px] font-semibold text-[#171717]">Ваш ответ:</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#78716C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-[#D89B35] focus:ring-[#D89B35]"
                    />
                    <span>Внутренняя заметка (видна только сотрудникам)</span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Оставьте служебный комментарий по тикету...'
                      : 'Напишите официальный ответ пользователю...'
                  }
                  className={`w-full text-xs p-2.5 rounded-md border focus:outline-none ${
                    isInternalNote
                      ? 'bg-[#FFFDF7] border-[#D89B35]/50 focus:border-[#D89B35]'
                      : 'bg-white border-[#E2DED5] focus:border-[#FF5A36]'
                  }`}
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendMessage}
                    disabled={!responseText.trim()}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 ${
                      isInternalNote
                        ? 'bg-[#D89B35] text-white hover:bg-[#C2892C]'
                        : 'bg-[#FF5A36] text-white hover:bg-[#E84D2B]'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isInternalNote ? 'Сохранить заметку' : 'Отправить ответ'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-12 text-center text-xs text-[#78716C]">
              Выберите обращение в левой таблице для просмотра диалога и ответа.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
