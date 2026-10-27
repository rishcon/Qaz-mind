import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const ADMIN_URL = (import.meta.env?.VITE_ADMIN_URL ?? '').trim() || 'http://localhost:5174';

interface AdminEntryProps {
  onNavigateHome: () => void;
}

/**
 * Entry point to QazMind Admin. It exists only in demo mode: there is no server-side check of platform roles yet,
 * so this page must not be shown to ordinary users. The real check happens in QazMind Admin and on the server.
 */
export const AdminEntry: React.FC<AdminEntryProps> = ({ onNavigateHome }) => (
  <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col justify-between">
    <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
      <button type="button" onClick={onNavigateHome} className="text-xl font-extrabold tracking-tight font-mono cursor-pointer">
        qazmind<span className="text-[#FF5A36]">.</span>
      </button>
      <span className="text-xs font-mono px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold">
        Демо-режим
      </span>
    </header>

    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px] bg-white border border-[#E2DED5] p-8 md:p-10 shadow-sm rounded-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold">Администрирование платформы</h1>
        <p className="text-sm text-[#74736F] leading-relaxed">
          Заявки школ, пользователи, банк вопросов и аналитика находятся в отдельном приложении QazMind Admin.
          Проверка полномочий пока не подключена к серверу: в демо-режиме вход открыт только для разработки.
        </p>
        <a
          href={ADMIN_URL}
          className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-sm font-bold tracking-wide transition-colors"
        >
          <span>Открыть QazMind Admin</span>
          <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-[11px] font-mono text-[#74736F]">{ADMIN_URL}</p>
      </div>
    </main>
  </div>
);
