import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { errorText } from '../../api/client';

interface ChangePasswordPageProps {
  name: string;
  login: string;
  onChange: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => void;
}

const field = 'w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E2DED5] focus:outline-none focus:border-[#FF5A36] focus:bg-white';

/** First sign-in with a password given by the school: the person must choose their own before anything else. */
export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ name, login, onChange, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError('Новый пароль не короче 8 символов.');
    if (next !== repeat) return setError('Пароли не совпадают.');
    setBusy(true);
    setError('');
    try {
      await onChange(current, next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col selection:bg-[#FF5A36] selection:text-white">
      <header className="w-full border-b border-[#E2DED5] px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <span className="text-xl font-extrabold tracking-tight font-mono">
          qazmind<span className="text-[#FF5A36]">.</span>
        </span>
        <button type="button" onClick={onLogout} className="text-xs font-mono font-bold underline underline-offset-4 cursor-pointer">
          Выйти
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-[440px] bg-white border border-[#E2DED5] p-8 rounded-sm space-y-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold">Первый вход</span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Придумайте свой пароль</h1>
            <p className="text-sm text-[#74736F] mt-2 leading-relaxed">
              {name}, ваш логин <b className="text-[#171717]">{login}</b>. Пароль, который выдала школа, временный: замените его своим. Его не будет знать никто, кроме вас.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Пароль от школы</label>
            <input className={field} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Новый пароль</label>
            <input className={field} type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Повторите новый пароль</label>
            <input className={field} type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          {error && (
            <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-50 text-white font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{busy ? 'Сохраняем…' : 'Сохранить пароль'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
};
