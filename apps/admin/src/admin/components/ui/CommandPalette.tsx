import React, { useState, useEffect, useRef } from 'react';
import { Search, User, BookOpen, FileQuestion, X, ArrowRight, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/client';
import { useStaff } from '../../auth/StaffAuth';

interface SearchItem {
  id: string;
  type: 'user' | 'subject' | 'question';
  title: string;
  subtitle: string;
  url: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

/** Searches the database: students (with the right permission), questions and subjects. */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { can } = useStaff();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      const found: SearchItem[] = [];
      const [users, questions, subjects] = await Promise.allSettled([
        can('users.read') ? adminApi.users({ search: q, page_size: 8 }) : Promise.resolve(null),
        adminApi.questions({ search: q, page_size: 8 }),
        adminApi.subjects(),
      ]);
      if (users.status === 'fulfilled' && users.value) {
        users.value.items.forEach((u) =>
          found.push({ id: u.id, type: 'user', title: u.name, subtitle: u.email, url: `/admin/users/${u.id}` }),
        );
      }
      if (subjects.status === 'fulfilled') {
        subjects.value.items
          .filter((s) => `${s.title_ru} ${s.title_kz} ${s.id}`.toLowerCase().includes(q.toLowerCase()))
          .forEach((s) =>
            found.push({ id: s.id, type: 'subject', title: s.title_ru, subtitle: `${s.topics} тем · ${s.questions} вопросов`, url: '/admin/content/subjects' }),
          );
      }
      if (questions.status === 'fulfilled') {
        questions.value.items.forEach((qu) =>
          found.push({
            id: qu.id,
            type: 'question',
            title: qu.text_ru.length > 70 ? `${qu.text_ru.slice(0, 70)}…` : qu.text_ru,
            subtitle: qu.external_id ? `ID ${qu.external_id}` : qu.subject_id,
            url: `/admin/content/questions/${qu.id}`,
          }),
        );
      }
      if (!cancelled) {
        setResults(found);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (!isOpen) return null;

  const icon = (type: SearchItem['type']) =>
    type === 'user' ? <User className="w-4 h-4 text-[#3B82F6]" /> : type === 'subject' ? <BookOpen className="w-4 h-4 text-[#FF5A36]" /> : <FileQuestion className="w-4 h-4 text-[#8B5CF6]" />;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#E2DED5] overflow-hidden flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-3.5 border-b border-[#E2DED5] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#A8A29E]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ученикам, вопросам, предметам…"
            className="flex-1 text-sm bg-transparent outline-none text-[#171717] placeholder-[#A8A29E]"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-[#A8A29E]" />}
          <button onClick={onClose} className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] cursor-pointer" aria-label="Закрыть">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="py-10 text-center text-xs text-[#78716C]">Введите хотя бы 2 символа: имя или email ученика, текст вопроса, предмет.</p>
          ) : results.length === 0 && !searching ? (
            <p className="py-10 text-center text-xs text-[#78716C]">
              По запросу «<span className="font-semibold text-[#171717]">{query}</span>» ничего не найдено.
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#F0EEE8] flex items-center justify-center shrink-0">{icon(item.type)}</div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#171717] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#78716C] truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A8A29E] opacity-0 group-hover:opacity-100 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2.5 border-t border-[#E2DED5] bg-[#F7F6F2] flex items-center justify-between text-[11px] text-[#78716C]">
          <span>Найдено: {results.length}</span>
          <span>Esc — закрыть</span>
        </div>
      </div>
    </div>
  );
};
