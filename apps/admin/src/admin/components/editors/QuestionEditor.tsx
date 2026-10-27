import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Send, Trash2, Check } from 'lucide-react';
import { adminApi, Question, QuestionBody, QuestionOption, WorkflowAction } from '../../api/client';
import { runAction, useAdminData } from '../../api/useAdminData';
import { STATUS_LABELS } from '../../api/labels';
import { useStaff } from '../../auth/StaffAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ActionResultNotice, type ActionResult } from '../ui/ConnectionNotice';
import { ErrorBlock, LoadingBlock, fmtDate } from '../ui/PageState';

interface QuestionEditorProps {
  /** Absent for a new question. */
  questionId?: string;
  onClose: () => void;
}

const LABELS: QuestionOption['label'][] = ['A', 'B', 'C', 'D', 'E'];
const field = 'w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]';

const emptyBody = (): QuestionBody => ({
  subject_id: '',
  topic_id: null,
  difficulty: 'medium',
  points: 1,
  text_ru: '',
  text_kz: '',
  options: LABELS.slice(0, 4).map((label) => ({ label, text_ru: '', text_kz: '' })),
  correct_label: 'A',
  explanation_ru: '',
  explanation_kz: '',
  source_reference: '',
  external_id: null,
});

const ACTIONS: Array<{ action: WorkflowAction; from: Question['status']; label: string; permission: string; review: boolean }> = [
  { action: 'approve', from: 'in_review', label: 'Утвердить', permission: 'content.review', review: true },
  { action: 'publish', from: 'approved', label: 'Опубликовать', permission: 'content.publish', review: true },
  { action: 'archive', from: 'published', label: 'Снять с публикации', permission: 'content.publish', review: false },
];

function problems(body: QuestionBody): string[] {
  const list: string[] = [];
  if (!body.subject_id) list.push('предмет');
  if (body.text_ru.trim().length < 3) list.push('текст вопроса на русском');
  if (body.options.some((o) => !o.text_ru.trim())) list.push('текст всех вариантов');
  if (!body.options.some((o) => o.label === body.correct_label)) list.push('правильный ответ');
  return list;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ questionId, onClose }) => {
  const { can, session } = useStaff();
  const existing = useAdminData(() => (questionId ? adminApi.question(questionId) : Promise.resolve(null)), [questionId]);
  const subjects = useAdminData(() => adminApi.subjects(), []);
  const [body, setBody] = useState<QuestionBody>(emptyBody());
  const topics = useAdminData(() => (body.subject_id ? adminApi.topics(body.subject_id) : Promise.resolve({ items: [] })), [body.subject_id]);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const q = existing.data;
  useEffect(() => {
    if (q) {
      const { subject_id, topic_id, difficulty, points, text_ru, text_kz, options, correct_label, explanation_ru, explanation_kz, source_reference, external_id } = q;
      setBody({ subject_id, topic_id, difficulty, points, text_ru, text_kz, options, correct_label, explanation_ru, explanation_kz, source_reference, external_id });
    }
  }, [q?.id, q?.version, q?.status]);

  if (questionId && !q) {
    return existing.loading ? <LoadingBlock /> : <ErrorBlock text={existing.error ?? ''} onRetry={existing.reload} />;
  }

  const editable = !q || q.status === 'draft';
  const canSave = q ? can('content.edit') : can('content.create');
  const isAuthor = q?.author === session?.staff.email;
  const issues = problems(body);

  const save = async (andSubmit: boolean) => {
    if (issues.length) {
      setResult({ tone: 'error', text: `Не сохранено. Заполните: ${issues.join(', ')}.` });
      return;
    }
    setBusy(true);
    const payload: QuestionBody = {
      ...body,
      text_ru: body.text_ru.trim(),
      text_kz: body.text_kz.trim(),
      external_id: body.external_id?.trim() || null,
    };
    let id = q?.id;
    const saved = await runAction(
      async () => {
        if (id) await adminApi.updateQuestion(id, payload);
        else id = (await adminApi.createQuestion(payload)).id;
        if (andSubmit) await adminApi.questionTransition(id!, 'submit');
      },
      andSubmit ? 'Вопрос сохранён и отправлен на рецензию.' : 'Черновик сохранён.',
      setResult,
    );
    setBusy(false);
    if (saved) onClose();
  };

  const transition = async (action: WorkflowAction, label: string) => {
    if (await runAction(() => adminApi.questionTransition(q!.id, action, notes), `${label}: готово.`, setResult)) {
      setNotes('');
      existing.reload();
    }
  };

  const setOption = (index: number, patch: Partial<QuestionOption>) =>
    setBody({ ...body, options: body.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#EBE8E0] cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#171717]">{q ? 'Вопрос' : 'Новый вопрос'}</h1>
              {q && <StatusBadge status={q.status} label={STATUS_LABELS[q.status]} />}
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              {q
                ? `Автор ${q.author ?? '—'}${q.reviewer ? ` · рецензент ${q.reviewer}` : ''} · версия ${q.version} · изменён ${fmtDate(q.updated_at, true)}`
                : 'Вопрос сохраняется черновиком. В банк для учеников он попадёт после рецензии и публикации.'}
            </p>
          </div>
        </div>
        {editable && canSave && (
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={() => void save(false)}
              className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Сохранить черновик
            </button>
            <button
              disabled={busy}
              onClick={() => void save(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#D89B35] hover:bg-[#C2892C] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> На рецензию
            </button>
          </div>
        )}
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {q?.review_notes && (
        <div className="p-3.5 rounded-lg bg-[#FEF7EA] border border-[#D89B35]/30 text-xs text-[#9A6715]">
          <span className="font-semibold">Замечания рецензента:</span> {q.review_notes}
        </div>
      )}

      {q && q.status !== 'draft' && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Рецензия и публикация</h2>
          {q.status === 'in_review' && can('content.review') && (
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Замечания для автора (обязательны при возврате)" className={field} />
          )}
          <div className="flex flex-wrap gap-2">
            {q.status === 'in_review' && can('content.review') && (
              <button
                disabled={!notes.trim()}
                onClick={() => void transition('return', 'Возвращено автору')}
                className="px-3 py-1.5 text-xs font-medium text-[#C94A43] bg-white border border-[#FCA5A5] rounded-md cursor-pointer disabled:opacity-40"
              >
                Вернуть на доработку
              </button>
            )}
            {ACTIONS.filter((a) => a.from === q.status && can(a.permission)).map((a) => (
              <button
                key={a.action}
                disabled={a.review && isAuthor}
                title={a.review && isAuthor ? 'Автор не может утверждать и публиковать свой вопрос' : undefined}
                onClick={() => void transition(a.action, a.label)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {a.label}
              </button>
            ))}
          </div>
          {!editable && <p className="text-[11px] text-[#78716C]">Текст можно менять только в черновике. Рецензент может вернуть вопрос на доработку.</p>}
        </div>
      )}

      <fieldset disabled={!editable || !canSave} className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4 disabled:opacity-80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-xs font-medium text-[#78716C] md:col-span-2">
            Предмет
            <select value={body.subject_id} onChange={(e) => setBody({ ...body, subject_id: e.target.value, topic_id: null })} className={`${field} mt-1`}>
              <option value="">— выберите —</option>
              {subjects.data?.items.map((s) => (
                <option key={s.id} value={s.id}>{s.title_ru}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[#78716C] md:col-span-2">
            Тема (необязательно)
            <select value={body.topic_id ?? ''} onChange={(e) => setBody({ ...body, topic_id: e.target.value || null })} className={`${field} mt-1`}>
              <option value="">— без темы —</option>
              {topics.data?.items.map((t) => (
                <option key={t.id} value={t.id}>{t.title_ru}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Сложность
            <select value={body.difficulty} onChange={(e) => setBody({ ...body, difficulty: e.target.value as QuestionBody['difficulty'] })} className={`${field} mt-1`}>
              <option value="easy">Базовый</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Баллы
            <input type="number" min={1} max={5} value={body.points} onChange={(e) => setBody({ ...body, points: Number(e.target.value) })} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Внешний ID (необязательно)
            <input value={body.external_id ?? ''} onChange={(e) => setBody({ ...body, external_id: e.target.value })} className={`${field} font-mono mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Источник
            <input value={body.source_reference} onChange={(e) => setBody({ ...body, source_reference: e.target.value })} placeholder="Учебник, класс, страницы" className={`${field} mt-1`} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[#78716C]">
            Текст вопроса (RU)
            <textarea rows={4} value={body.text_ru} onChange={(e) => setBody({ ...body, text_ru: e.target.value })} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Текст вопроса (KZ)
            <textarea rows={4} value={body.text_kz} onChange={(e) => setBody({ ...body, text_kz: e.target.value })} className={`${field} mt-1`} />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">Варианты ответа</span>
          {body.options.map((option, index) => (
            <div key={option.label} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => setBody({ ...body, correct_label: option.label })}
                title="Отметить как правильный"
                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer ${
                  body.correct_label === option.label ? 'bg-[#258568] text-white border-[#258568]' : 'border-[#D5D0C5] text-[#78716C]'
                }`}
              >
                {body.correct_label === option.label ? <Check className="w-3.5 h-3.5" /> : option.label}
              </button>
              <input value={option.text_ru} onChange={(e) => setOption(index, { text_ru: e.target.value })} placeholder={`Вариант ${option.label} (RU)`} className={field} />
              <input value={option.text_kz} onChange={(e) => setOption(index, { text_kz: e.target.value })} placeholder={`Нұсқа ${option.label} (KZ)`} className={field} />
              {body.options.length > 2 && index === body.options.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const options = body.options.slice(0, -1);
                    setBody({ ...body, options, correct_label: options.some((o) => o.label === body.correct_label) ? body.correct_label : 'A' });
                  }}
                  className="p-1.5 text-[#A8A29E] hover:text-[#C94A43] cursor-pointer"
                  title="Убрать вариант"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {body.options.length < 5 && (
            <button
              type="button"
              onClick={() => setBody({ ...body, options: [...body.options, { label: LABELS[body.options.length], text_ru: '', text_kz: '' }] })}
              className="text-xs text-[#FF5A36] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить вариант
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[#78716C]">
            Пояснение к ответу (RU)
            <textarea rows={3} value={body.explanation_ru} onChange={(e) => setBody({ ...body, explanation_ru: e.target.value })} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Пояснение к ответу (KZ)
            <textarea rows={3} value={body.explanation_kz} onChange={(e) => setBody({ ...body, explanation_kz: e.target.value })} className={`${field} mt-1`} />
          </label>
        </div>
      </fieldset>
    </div>
  );
};
