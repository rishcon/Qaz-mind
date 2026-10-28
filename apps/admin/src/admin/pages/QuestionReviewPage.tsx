import React, { useState } from 'react';
import { BookOpen, Check, Eye } from 'lucide-react';
import { adminApi, Question, WorkflowAction } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useAttention } from '../api/AttentionProvider';
import { DIFFICULTY_LABELS, STATUS_LABELS } from '../api/labels';
import { useStaff } from '../auth/StaffAuth';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, fmtDate } from '../components/ui/PageState';

interface QuestionReviewPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Review queue. The author of a question cannot approve or publish it (the platform owner can); the server refuses
 * and the buttons say why. Questions can be ticked and approved, published or returned in one action.
 */
export const QuestionReviewPage: React.FC<QuestionReviewPageProps> = ({ onNavigate }) => {
  const { can, session } = useStaff();
  const attention = useAttention();
  const [queue, setQueue] = useState<'in_review' | 'approved'>('in_review');
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);
  const overview = useAdminData(() => adminApi.overview(), [], 30000);
  const list = useAdminData(() => adminApi.questions({ status: queue, page_size: 200 }), [queue], 30000);
  const subjects = useAdminData(() => adminApi.subjects(), []);
  const items = list.data?.items ?? [];
  const selected: Question | undefined = items.find((q) => q.id === selectedId) ?? items[0];
  const isOwner = session?.staff.roles.includes('OWNER') ?? false;
  const own = selected?.author === session?.staff.email && !isOwner;
  const [ticked, setTicked] = useState<string[]>([]);
  const [allFound, setAllFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const subjectName = (id: string) => subjects.data?.items.find((s) => s.id === id)?.title_ru ?? id;

  const act = async (action: WorkflowAction, text: string) => {
    if (!selected) return;
    if (await runAction(() => adminApi.questionTransition(selected.id, action, notes), text, setResult)) {
      setNotes('');
      setSelectedId('');
      list.reload();
      overview.reload();
      attention.reload();
    }
  };

  const total = list.data?.total ?? 0;
  const count = allFound ? total : ticked.length;
  const allTicked = items.length > 0 && items.every((q) => ticked.includes(q.id));

  const bulk = async (action: 'approve' | 'publish' | 'return', verb: string) => {
    if (count === 0 || busy) return;
    if (action === 'return' && !notes.trim()) {
      setResult({ tone: 'error', text: 'Для возврата укажите замечания для автора.' });
      return;
    }
    if (!window.confirm(`${verb}: ${count}? Вопросы не того статуса и свои вопросы автора (кроме владельца) будут пропущены.`)) return;
    setBusy(true);
    try {
      const r = await adminApi.bulkQuestions({
        action,
        notes,
        ...(allFound ? { filter: { status: queue } } : { ids: ticked }),
      });
      setResult({ tone: 'success', text: `Выполнено: ${r.done}.${r.skipped ? ` Пропущено: ${r.skipped}.` : ''}` });
      setTicked([]);
      setAllFound(false);
      setNotes('');
      setSelectedId('');
      list.reload();
      overview.reload();
      attention.reload();
    } catch (error) {
      setResult(failureResult(error));
    } finally {
      setBusy(false);
    }
  };

  const counts = overview.data?.questions;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Модерация вопросов</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Рецензент проверяет формулировку, ключ и пояснение. Автор не может утверждать и публиковать свои вопросы; владелец платформы может всё.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'На рецензии', value: counts?.in_review, color: 'text-[#FF5A36]' },
          { label: 'Ждут публикации', value: counts?.approved, color: 'text-[#D89B35]' },
          { label: 'Опубликовано', value: counts?.published, color: 'text-[#258568]' },
          { label: 'Черновики', value: counts?.draft, color: 'text-[#171717]' },
        ].map((card) => (
          <div key={card.label} className="bg-white p-4 rounded-xl border border-[#E2DED5]">
            <span className="text-xs text-[#78716C]">{card.label}</span>
            <div className={`text-xl font-bold mt-1 ${card.color}`}>{card.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      {list.error && <ErrorBlock text={list.error} onRetry={list.reload} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#E2DED5] p-4 space-y-2">
          <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-lg border border-[#E2DED5] text-xs">
            {(['in_review', 'approved'] as const).map((value) => (
              <button
                key={value}
                onClick={() => {
                  setQueue(value);
                  setSelectedId('');
                  setTicked([]);
                  setAllFound(false);
                }}
                className={`flex-1 px-2 py-1 rounded-md font-semibold cursor-pointer ${queue === value ? 'bg-white shadow-xs text-[#171717]' : 'text-[#78716C]'}`}
              >
                {value === 'in_review' ? 'На рецензии' : 'Ждут публикации'}
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C574F] px-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allFound || allTicked}
                  onChange={() => {
                    setAllFound(false);
                    setTicked(allTicked || allFound ? [] : items.map((q) => q.id));
                  }}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                Выбрать все
              </label>
              {count > 0 && <span className="font-semibold text-[#171717]">Выбрано: {count}</span>}
              {!allFound && allTicked && total > items.length && (
                <button onClick={() => setAllFound(true)} className="underline text-[#E84D2B] cursor-pointer">
                  Все {total} в очереди
                </button>
              )}
            </div>
          )}
          {count > 0 && (
            <div className="space-y-2 p-2.5 rounded-lg border border-[#FFD9CF] bg-[#FFF7F5]">
              {queue === 'in_review' && (
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Замечания (нужны, чтобы вернуть выбранные)"
                  className="w-full text-xs p-2 bg-white border border-[#E2DED5] rounded-md"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {queue === 'in_review' && can('content.review') && (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => void bulk('approve', 'Утвердить')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md cursor-pointer disabled:opacity-40"
                    >
                      Утвердить выбранные
                    </button>
                    <button
                      disabled={busy || !notes.trim()}
                      onClick={() => void bulk('return', 'Вернуть автору')}
                      className="px-3 py-1.5 text-xs font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded-md cursor-pointer disabled:opacity-40"
                    >
                      Вернуть
                    </button>
                  </>
                )}
                {queue === 'approved' && can('content.publish') && (
                  <button
                    disabled={busy}
                    onClick={() => void bulk('publish', 'Опубликовать')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md cursor-pointer disabled:opacity-40"
                  >
                    Опубликовать выбранные
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78716C]">{list.loading ? 'Загрузка…' : 'Очередь пуста.'}</div>
            ) : (
              items.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  className={`p-3 rounded-lg border cursor-pointer ${
                    q.id === selected?.id ? 'border-[#FF5A36] bg-[#FFF7F5]' : 'border-[#E2DED5] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#A8A29E]">
                    <span className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={allFound || ticked.includes(q.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => {
                          setAllFound(false);
                          setTicked(ticked.includes(q.id) ? ticked.filter((id) => id !== q.id) : [...ticked, q.id]);
                        }}
                        className="w-3.5 h-3.5 cursor-pointer"
                        aria-label="Выбрать вопрос"
                      />
                      {subjectName(q.subject_id)}
                    </span>
                    <span>{fmtDate(q.updated_at)}</span>
                  </div>
                  <p className="text-xs font-medium text-[#171717] line-clamp-2 mt-1">{q.text_ru}</p>
                  <div className="text-[10px] text-[#A8A29E] mt-1">Автор: {q.author ?? '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DED5]">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} label={STATUS_LABELS[selected.status]} />
                    <span className="text-xs text-[#78716C]">
                      {subjectName(selected.subject_id)} · {DIFFICULTY_LABELS[selected.difficulty]} · {selected.points} балл.
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A29E] mt-1">
                    Автор {selected.author ?? '—'} · источник: {selected.source_reference || 'не указан'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate(`/admin/content/questions/${selected.id}`)}
                  className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Открыть
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#171717] leading-relaxed">{selected.text_ru}</p>
                {selected.text_kz && <p className="text-xs text-[#5C574F] mt-1 italic">KZ: {selected.text_kz}</p>}
              </div>

              <div className="space-y-2">
                {selected.options.map((opt) => {
                  const correct = opt.label === selected.correct_label;
                  return (
                    <div
                      key={opt.label}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                        correct ? 'border-[#258568] bg-[#F4FAF7] text-[#1D6A53] font-semibold' : 'border-[#E2DED5]'
                      }`}
                    >
                      <span>
                        {opt.label}. {opt.text_ru}
                        {opt.text_kz ? <span className="text-[#A8A29E] font-normal"> / {opt.text_kz}</span> : null}
                      </span>
                      {correct && (
                        <span className="text-[11px] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ВЕРНЫЙ ОТВЕТ
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs space-y-1.5">
                <p className="font-bold text-[#171717] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" /> Пояснение
                </p>
                <p className="text-[#5C574F] leading-relaxed">{selected.explanation_ru || 'Пояснения нет.'}</p>
              </div>

              {selected.status === 'in_review' && can('content.review') && (
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Замечания для автора (обязательны при возврате)"
                  className="w-full text-xs p-2.5 bg-white border border-[#E2DED5] rounded-md"
                />
              )}

              <div className="pt-4 border-t border-[#E2DED5] flex flex-wrap items-center justify-end gap-2.5">
                {own && <span className="text-[11px] text-[#9A6715] mr-auto">Это ваш вопрос: утвердить и опубликовать его может только другой сотрудник или владелец платформы.</span>}
                {selected.status === 'in_review' && can('content.review') && (
                  <>
                    <button
                      disabled={!notes.trim()}
                      onClick={() => void act('return', 'Вопрос возвращён автору.')}
                      className="px-3.5 py-1.5 text-xs font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded-md cursor-pointer disabled:opacity-40"
                    >
                      Вернуть на доработку
                    </button>
                    <button
                      disabled={own}
                      onClick={() => void act('approve', 'Вопрос утверждён.')}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Check className="w-4 h-4" /> Утвердить
                    </button>
                  </>
                )}
                {selected.status === 'approved' && can('content.publish') && (
                  <button
                    disabled={own}
                    onClick={() => void act('publish', 'Вопрос опубликован.')}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md cursor-pointer disabled:opacity-40"
                  >
                    Опубликовать
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-12 text-center text-xs text-[#78716C]">
              Выберите вопрос в очереди.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
