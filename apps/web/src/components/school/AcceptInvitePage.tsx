import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface AcceptInvitePageProps {
  token: string;
  signedIn: boolean;
  email: string;
  onLogin: () => void;
  onRegister: () => void;
  onDone: (role: string) => void;
}

/**
 * Accepting a school invitation. The invitation is tied to an e-mail address: the server accepts it only in the
 * account with that address, so the person signs in (or registers) first and then confirms here.
 */
export const AcceptInvitePage: React.FC<AcceptInvitePageProps> = ({ token, signedIn, email, onLogin, onRegister, onDone }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await schoolApi.acceptInvitation(token);
      setRole(result.role);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const primary =
    'w-full py-3 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-50 text-white font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer';

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 bg-white/70 backdrop-blur-sm">
        <span className="text-xl font-extrabold tracking-tight font-mono">
          qazmind<span className="text-[#FF5A36]">.</span>
        </span>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px] bg-white border border-[#E2DED5] p-8 rounded-sm space-y-5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">Приглашение</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Приглашение в школу</h1>

          {role ? (
            <>
              <p className="text-sm text-[#74736F]">
                {role === 'TEACHER'
                  ? 'Готово: вы добавлены в школу как учитель.'
                  : 'Готово: вы добавлены в класс. Личный прогресс остаётся при вас.'}
              </p>
              <button type="button" onClick={() => onDone(role)} className={primary}>
                <span>{role === 'TEACHER' ? 'Открыть кабинет школы' : 'К моему кабинету'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : !token ? (
            <p className="text-sm text-red-700">В ссылке нет приглашения. Откройте ссылку из письма целиком.</p>
          ) : !signedIn ? (
            <>
              <p className="text-sm text-[#74736F] leading-relaxed">
                Войдите в аккаунт с тем адресом почты, на который пришло приглашение, или создайте аккаунт с этим адресом.
                После входа вы вернётесь сюда.
              </p>
              <button type="button" onClick={onLogin} className={primary}>
                <span>Войти</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="w-full py-2.5 text-xs font-mono font-bold text-[#74736F] hover:text-[#171717] cursor-pointer underline underline-offset-4"
              >
                Создать аккаунт
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#74736F] leading-relaxed">
                Вы вошли как <b className="text-[#171717]">{email}</b>. Приглашение сработает, только если оно отправлено
                именно на этот адрес.
              </p>
              {error && (
                <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
                  {error}
                </div>
              )}
              <button type="button" onClick={accept} disabled={busy} className={primary}>
                <span>{busy ? 'Принимаем…' : 'Принять приглашение'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
