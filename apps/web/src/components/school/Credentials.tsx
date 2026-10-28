import React from 'react';
import { ApiCreatedAccount } from '../../api/endpoints';

interface CredentialsProps {
  title: string;
  items: Pick<ApiCreatedAccount, 'name' | 'username' | 'password'>[];
  onClose: () => void;
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/**
 * Logins and temporary passwords of accounts that were just created or reset. The server keeps only a hash of the
 * password, so this is the only moment it can be read: the administrator copies, prints or downloads it.
 */
export const Credentials: React.FC<CredentialsProps> = ({ title, items, onClose }) => {
  const text = items.map((i) => `${i.name}\t${i.username}\t${i.password}`).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // copying is a convenience; the table can still be selected by hand
    }
  };

  const download = () => {
    const rows = ['Имя,Логин,Пароль', ...items.map((i) => [i.name, i.username, i.password].map(csvCell).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qazmind-logins.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const action = 'text-xs font-mono font-bold underline underline-offset-4 cursor-pointer';

  return (
    <div className="border border-[#BFE3D4] bg-[#F4FAF7] rounded-sm p-4 space-y-3 print:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-sm">{title}</h3>
        <div className="flex gap-4 print:hidden">
          <button type="button" className={action} onClick={copy}>
            Копировать
          </button>
          <button type="button" className={action} onClick={download}>
            Скачать CSV
          </button>
          <button type="button" className={action} onClick={() => window.print()}>
            Печать
          </button>
          <button type="button" className={`${action} text-[#74736F]`} onClick={onClose}>
            Скрыть
          </button>
        </div>
      </div>
      <p className="text-xs text-[#5C574F]">
        Передайте логин и пароль человеку. Пароль временный: при первом входе его нужно заменить своим. Позже увидеть пароль нельзя — только выдать новый.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-mono uppercase text-[#74736F]">
            <tr>
              <th className="py-1 pr-4">Имя</th>
              <th className="pr-4">Логин</th>
              <th>Пароль</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.username} className="border-t border-[#D7EBE2]">
                <td className="py-1.5 pr-4">{i.name}</td>
                <td className="pr-4 font-mono font-bold">{i.username}</td>
                <td className="font-mono font-bold">{i.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
