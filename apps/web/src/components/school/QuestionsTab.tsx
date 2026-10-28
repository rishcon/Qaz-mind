import React, { useCallback, useEffect, useState } from 'react';
import { ApiSchoolQuestion, ApiSchoolQuestionInput, ApiSubject, OptionLabel, learningApi, schoolQuestionApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface QuestionsTabProps {
  orgId: string;
  writable: boolean;
  /** Bumped by the cabinet after a change elsewhere (e.g. an assignment that used a question). */
  version: number;
  onChanged: () => void;
}

const LABELS: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const button =
  'px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm';
const link = 'text-xs font-mono font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40';
const DIFFICULTY = { easy: 'лёгкий', medium: 'средний', hard: 'сложный' } as const;

interface Draft {
  subject_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text_ru: string;
  text_kz: string;
  options: { text_ru: string; text_kz: string }[];
  correct: OptionLabel;
  explanation_ru: string;
  explanation_kz: string;
}

const blank = (subject: string): Draft => ({
  subject_id: subject,
  difficulty: 'medium',
  text_ru: '',
  text_kz: '',
  options: [0, 1, 2, 3].map(() => ({ text_ru: '', text_kz: '' })),
  correct: 'A',
  explanation_ru: '',
  explanation_kz: '',
});

const EXAMPLE = `[
  {
    "subject_id": "history_kz",
    "difficulty": "easy",
    "text_ru": "Текст вопроса",
    "options": [
      { "label": "A", "text_ru": "Вариант 1" },
      { "label": "B", "text_ru": "Вариант 2" },
      { "label": "C", "text_ru": "Вариант 3" },
      { "label": "D", "text_ru": "Вариант 4" }
    ],
    "correct_label": "B",
    "explanation_ru": "Пояснение"
  }
]`;

/**
 * The school's own question bank. These questions are visible only to the teachers and administrators of this school and can
 * be used only in its assignments, next to the platform's reviewed questions. Nobody on the platform reviews them.
 */
export const QuestionsTab: React.FC<QuestionsTabProps> = ({ orgId, writable, version, onChanged }) => {
  const [items, setItems] = useState<ApiSchoolQuestion[] | null>(null);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [showKz, setShowKz] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.title_ru ?? id;

  const load = useCallback(async () => {
    try {
      const r = await schoolQuestionApi.list(orgId, { subject_id: subjectFilter || undefined, status: archived ? 'archived' : 'active', search: search.trim() || undefined });
      setItems(r.items);
    } catch (err) {
      setError(errorText(err));
      setItems([]);
    }
  }, [orgId, subjectFilter, archived, search]);

  useEffect(() => {
    learningApi.listSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load, version]);

  const run = async (action: () => Promise<unknown>, success = '') => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await action();
      if (success) setNote(success);
      await load();
      onChanged();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toBody = (d: Draft): ApiSchoolQuestionInput => {
    const options = d.options.map((o, i) => ({ label: LABELS[i], text_ru: o.text_ru.trim(), text_kz: o.text_kz.trim() })).filter((o) => o.text_ru);
    return {
      subject_id: d.subject_id,
      difficulty: d.difficulty,
      text_ru: d.text_ru.trim(),
      text_kz: d.text_kz.trim(),
      options,
      correct_label: d.correct,
      explanation_ru: d.explanation_ru.trim(),
      explanation_kz: d.explanation_kz.trim(),
    };
  };

  const startNew = () => {
    setEditing({ id: null, draft: blank(subjectFilter || subjects[0]?.id || '') });
    setImportOpen(false);
  };

  const startEdit = (q: ApiSchoolQuestion) => {
    const options = LABELS.map((l) => q.options.find((o) => o.label === l)).filter(Boolean).map((o) => ({ text_ru: o!.text_ru, text_kz: o!.text_kz ?? '' }));
    while (options.length < 4) options.push({ text_ru: '', text_kz: '' });
    setEditing({
      id: q.id,
      draft: {
        subject_id: q.subject_id,
        difficulty: q.difficulty,
        text_ru: q.text_ru,
        text_kz: q.text_kz ?? '',
        options,
        correct: q.correct_label,
        explanation_ru: q.explanation_ru ?? '',
        explanation_kz: q.explanation_kz ?? '',
      },
    });
    setImportOpen(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body = toBody(editing.draft);
    if (body.options.length < 2) return setError('Нужно минимум два варианта ответа.');
    if (!body.options.some((o) => o.label === body.correct_label)) return setError('Отметьте правильный ответ среди заполненных вариантов.');
    const ok = await run(() => (editing.id ? schoolQuestionApi.update(orgId, editing.id, body) : schoolQuestionApi.create(orgId, body)), editing.id ? 'Вопрос сохранён.' : 'Вопрос добавлен.');
    if (ok) setEditing(null);
  };

  const doImport = async () => {
    let rows: ApiSchoolQuestionInput[];
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error('not an array');
      rows = parsed;
    } catch {
      setError('Не удалось прочитать JSON. Нужен список вопросов в квадратных скобках, пример ниже.');
      return;
    }
    const ok = await run(async () => {
      const r = await schoolQuestionApi.importRows(orgId, rows);
      setNote(`Добавлено вопросов: ${r.created}.`);
    });
    if (ok) {
      setImportText('');
      setImportOpen(false);
    }
  };

  const set = (patch: Partial<Draft>) => setEditing((cur) => (cur ? { ...cur, draft: { ...cur.draft, ...patch } } : cur));
  const d = editing?.draft;

  return (
    <section className="space-y-4">
      <p className="text-sm text-[#5C574F] leading-relaxed">
        Здесь хранятся вопросы вашей школы. Их видят только администраторы и учителя школы, и использовать их можно только в заданиях школы, рядом с проверенными вопросами
        платформы. Платформа свои вопросы не проверяет: за правильность отвечает школа.
      </p>

      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {note && <div className="text-xs text-[#258568] font-medium">{note}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <select className={field} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">Все предметы</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title_ru}
            </option>
          ))}
        </select>
        <input className={`${field} flex-1 min-w-[180px]`} placeholder="Поиск по тексту" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          в архиве
        </label>
        {writable && (
          <>
            <button type="button" className={button} onClick={startNew}>
              Добавить вопрос
            </button>
            <button type="button" className={link} onClick={() => { setImportOpen(!importOpen); setEditing(null); }}>
              Импорт из JSON
            </button>
          </>
        )}
      </div>

      {importOpen && (
        <div className="bg-white border border-[#E2DED5] p-4 rounded-sm space-y-3">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Импорт списка вопросов</h3>
          <textarea className={`${field} w-full font-mono text-xs`} rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={EXAMPLE} />
          <p className="text-[11px] text-[#74736F]">
            Формат — список объектов, как в примере. Добавляются все вопросы или ни одного: при ошибке вы увидите номер строки. До 200 вопросов за раз.
          </p>
          <button type="button" disabled={busy || !importText.trim()} className={button} onClick={doImport}>
            Импортировать
          </button>
        </div>
      )}

      {editing && d && (
        <form onSubmit={save} className="bg-white border border-[#E2DED5] p-4 rounded-sm space-y-3">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">{editing.id ? 'Изменить вопрос' : 'Новый вопрос'}</h3>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-bold space-y-1">
              <span className="block">Предмет</span>
              <select className={field} value={d.subject_id} onChange={(e) => set({ subject_id: e.target.value })} required>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title_ru}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold space-y-1">
              <span className="block">Сложность</span>
              <select className={field} value={d.difficulty} onChange={(e) => set({ difficulty: e.target.value as Draft['difficulty'] })}>
                <option value="easy">лёгкий</option>
                <option value="medium">средний</option>
                <option value="hard">сложный</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-bold space-y-1">
            <span className="block">Текст вопроса</span>
            <textarea className={`${field} w-full`} rows={3} value={d.text_ru} onChange={(e) => set({ text_ru: e.target.value })} required minLength={3} />
          </label>
          <div className="space-y-2">
            <span className="block text-xs font-bold">Варианты ответа (отметьте правильный)</span>
            {d.options.map((o, i) => (
              <div key={LABELS[i]} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={d.correct === LABELS[i]} onChange={() => set({ correct: LABELS[i] })} aria-label={`Правильный ответ ${LABELS[i]}`} />
                <span className="font-mono text-xs font-bold w-4">{LABELS[i]}</span>
                <input
                  className={`${field} flex-1`}
                  value={o.text_ru}
                  onChange={(e) => set({ options: d.options.map((x, j) => (j === i ? { ...x, text_ru: e.target.value } : x)) })}
                  placeholder={i < 2 ? 'обязательно' : 'необязательно'}
                  required={i < 2}
                />
              </div>
            ))}
            {d.options.length < 5 && (
              <button type="button" className={`${link} text-[#74736F]`} onClick={() => set({ options: [...d.options, { text_ru: '', text_kz: '' }] })}>
                + вариант E
              </button>
            )}
          </div>
          <label className="block text-xs font-bold space-y-1">
            <span className="block">Пояснение (показывается ученику после сдачи)</span>
            <textarea className={`${field} w-full`} rows={2} value={d.explanation_ru} onChange={(e) => set({ explanation_ru: e.target.value })} />
          </label>
          <button type="button" className={`${link} text-[#74736F]`} onClick={() => setShowKz(!showKz)}>
            {showKz ? 'Скрыть казахский перевод' : 'Добавить перевод на казахский'}
          </button>
          {showKz && (
            <div className="space-y-2">
              <textarea className={`${field} w-full`} rows={2} value={d.text_kz} onChange={(e) => set({ text_kz: e.target.value })} placeholder="Сұрақ мәтіні" />
              {d.options.map((o, i) => (
                <input
                  key={LABELS[i]}
                  className={`${field} w-full`}
                  value={o.text_kz}
                  onChange={(e) => set({ options: d.options.map((x, j) => (j === i ? { ...x, text_kz: e.target.value } : x)) })}
                  placeholder={`Вариант ${LABELS[i]} по-казахски`}
                />
              ))}
              <textarea className={`${field} w-full`} rows={2} value={d.explanation_kz} onChange={(e) => set({ explanation_kz: e.target.value })} placeholder="Түсініктеме" />
              <p className="text-[11px] text-[#74736F]">Ученик с казахским языком экзамена увидит перевод. Если его нет, вопрос показывается по-русски.</p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={button}>
              Сохранить
            </button>
            <button type="button" className={link} onClick={() => setEditing(null)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {items === null ? (
        <p className="text-sm text-[#74736F]">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#74736F]">{archived ? 'В архиве ничего нет.' : 'Своих вопросов пока нет. Добавьте первый или импортируйте список.'}</p>
      ) : (
        <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
          {items.map((q) => (
            <div key={q.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{q.text_ru}</div>
                <div className="text-xs text-[#74736F] mt-1">
                  {subjectName(q.subject_id)} · {DIFFICULTY[q.difficulty]} · автор: {q.author}
                  {q.used_in_assignments > 0 && ` · в заданиях: ${q.used_in_assignments}`} · правильный ответ: {q.correct_label}
                </div>
              </div>
              {writable && q.can_manage && (
                <div className="flex gap-4 shrink-0">
                  {q.used_in_assignments === 0 && q.status === 'active' && (
                    <button type="button" className={link} disabled={busy} onClick={() => startEdit(q)}>
                      Изменить
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${link} text-[#74736F]`}
                    disabled={busy}
                    onClick={() => run(() => (q.status === 'active' ? schoolQuestionApi.archive(orgId, q.id) : schoolQuestionApi.restore(orgId, q.id)))}
                  >
                    {q.status === 'active' ? 'В архив' : 'Вернуть'}
                  </button>
                  {q.used_in_assignments === 0 && (
                    <button
                      type="button"
                      className={`${link} text-red-700`}
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Удалить вопрос безвозвратно?')) void run(() => schoolQuestionApi.remove(orgId, q.id));
                      }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
