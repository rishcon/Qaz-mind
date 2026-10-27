import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { WEB_URL } from '../../../config';

/** Shown instead of the whole panel when demo mode is off. No section, no data is rendered behind it. */
export const AccessGate: React.FC = () => (
  <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white border border-[#E2DED5] rounded-xl p-8 text-center space-y-4 shadow-xs">
      <div className="mx-auto w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E2DED5] flex items-center justify-center text-[#FF5A36]">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold">QazMind Admin</h1>
      <p className="text-sm text-[#78716C] leading-relaxed">
        Панель доступна только сотрудникам платформы. Вход по аккаунту и проверка прав подключаются вместе с серверной
        частью, поэтому сейчас раздел закрыт.
      </p>
      <a href={WEB_URL} className="inline-block text-xs font-semibold text-[#171717] underline underline-offset-4">
        Перейти на QazMind Web
      </a>
    </div>
  </div>
);
