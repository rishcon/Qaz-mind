import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  Building2,
  BookOpen,
  FileQuestion,
  FileText,
  Award,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { mockDb } from '../../repositories/mockDatabase';

interface SearchItem {
  id: string;
  type: 'user' | 'school' | 'subject' | 'question' | 'exam' | 'assignment';
  title: string;
  subtitle: string;
  url: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled externally or we can toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search local database
  const results: SearchItem[] = [];

  if (q.length > 0) {
    // Users
    mockDb.users.forEach((u) => {
      if (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.organizationName?.toLowerCase().includes(q)
      ) {
        results.push({
          id: u.id,
          type: 'user',
          title: u.name,
          subtitle: `${u.role === 'student' ? 'Ученик' : u.role === 'teacher' ? 'Преподаватель' : 'Администратор'} • ${u.email}`,
          url: `/admin/users/${u.id}`,
        });
      }
    });

    // Schools
    mockDb.schools.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)) {
        results.push({
          id: s.id,
          type: 'school',
          title: s.name,
          subtitle: `${s.city} • ${s.totalStudents} учащихся`,
          url: `/admin/schools/${s.id}`,
        });
      }
    });

    // Subjects
    mockDb.subjects.forEach((sub) => {
      if (sub.nameRu.toLowerCase().includes(q) || sub.nameKz.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q)) {
        results.push({
          id: sub.id,
          type: 'subject',
          title: sub.nameRu,
          subtitle: `${sub.nameKz} • ${sub.type === 'mandatory' ? 'Обязательный' : 'Профильный'}`,
          url: `/admin/content/subjects`,
        });
      }
    });

    // Questions
    mockDb.questions.forEach((qst) => {
      if (qst.textRu.toLowerCase().includes(q) || qst.id.toLowerCase().includes(q) || qst.tags.some((t) => t.toLowerCase().includes(q))) {
        results.push({
          id: qst.id,
          type: 'question',
          title: qst.textRu.slice(0, 60) + '...',
          subtitle: `ID: ${qst.id} • ${qst.type} • Статус: ${qst.status}`,
          url: `/admin/content/questions/${qst.id}`,
        });
      }
    });

    // Exams
    mockDb.exams.forEach((ex) => {
      if (ex.titleRu.toLowerCase().includes(q) || ex.titleKz.toLowerCase().includes(q)) {
        results.push({
          id: ex.id,
          type: 'exam',
          title: ex.titleRu,
          subtitle: `${ex.questionCount} вопр. • ${ex.maxScore} баллов • ${ex.durationMinutes} мин`,
          url: `/admin/exams/${ex.id}`,
        });
      }
    });
  }

  const getIcon = (type: SearchItem['type']) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-[#3B82F6]" />;
      case 'school':
        return <Building2 className="w-4 h-4 text-[#258568]" />;
      case 'subject':
        return <BookOpen className="w-4 h-4 text-[#FF5A36]" />;
      case 'question':
        return <FileQuestion className="w-4 h-4 text-[#8B5CF6]" />;
      case 'exam':
        return <Award className="w-4 h-4 text-[#D89B35]" />;
      case 'assignment':
        return <Calendar className="w-4 h-4 text-[#10B981]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#E2DED5] overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-100">
        {/* Search header */}
        <div className="p-3.5 border-b border-[#E2DED5] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#A8A29E]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по пользователям, школам, предметам, вопросам, тестам..."
            className="flex-1 text-sm bg-transparent outline-none text-[#171717] placeholder-[#A8A29E]"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[#78716C] hover:bg-[#F5F3EE] cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="py-10 text-center text-xs text-[#78716C]">
              <p className="font-medium text-[#171717]">Глобальный поиск QazMind Admin</p>
              <p className="mt-1 text-[#A8A29E]">
                Введите фамилию ученика, название школы, предмет ЕНТ или фрагмент вопроса
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#F0EEE8] font-mono text-[10px] text-[#5C574F]">
                  Например: Кенесары
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F0EEE8] font-mono text-[10px] text-[#5C574F]">
                  или: Астана
                </span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#78716C]">
              По запросу «<span className="font-semibold text-[#171717]">{query}</span>» ничего не найдено.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#F0EEE8] flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#171717] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#78716C] truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A8A29E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-[#E2DED5] bg-[#F7F6F2] flex items-center justify-between text-[11px] text-[#78716C]">
          <span>Показано результатов: {results.length}</span>
          <div className="flex items-center gap-2">
            <span>Esc для закрытия</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E2DED5] font-mono text-[10px]">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
