import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, Send } from 'lucide-react';
import { adminApi, LessonBody, LessonStep, LessonVersion, WorkflowAction } from '../../api/client';
import { runAction, useAdminData } from '../../api/useAdminData';
import { STATUS_LABELS } from '../../api/labels';
import { useStaff } from '../../auth/StaffAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ActionResultNotice, type ActionResult } from '../ui/ConnectionNotice';
import { ErrorBlock, LoadingBlock, fmtDate } from '../ui/PageState';

interface LessonEditorProps {
  /** Slug of an existing lesson; absent for a new one. */
  slug?: string;
  onClose: () => void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const field = 'w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md text-[#171717]';
const emptyStep = (): LessonStep => ({ heading_ru: '', heading_kz: '', body_ru: '', body_kz: '', key_fact_ru: '', key_fact_kz: '', example_ru: '', example_kz: '' });
const emptyBody = (): LessonBody => ({ title_ru: '', title_kz: '', estimated_minutes: 15, source_reference: '', steps: [emptyStep()] });

// Which permission each workflow button needs (the server checks the same).
const ACTIONS: Array<{ action: WorkflowAction; from: string; label: string; permission: string }> = [
  { action: 'submit', from: 'draft', label: 'На рецензию', permission: 'content.edit' },
  { action: 'return', from: 'in_review', label: 'Вернуть автору', permission: 'content.review' },
  { action: 'approve', from: 'in_review', label: 'Утвердить', permission: 'content.review' },
  { action: 'publish', from: 'approved', label: 'Опубликовать', permission: 'content.publish' },
  { action: 'archive', from: 'published', label: 'Снять с публикации', permission: 'content.publish' },
];

/** Optional step fields are sent as null when empty, so the server stores no blank text. */
function clean(body: LessonBody): LessonBody {
  const opt = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    ...body,
    title_ru: body.title_ru.trim(),
    title_kz: body.title_kz.trim(),
    source_reference: body.source_reference.trim(),
    steps: body.steps.map((s) => ({
      heading_ru: s.heading_ru.trim(),
      heading_kz: s.heading_kz.trim(),
      body_ru: s.body_ru.trim(),
      body_kz: s.body_kz.trim(),
      key_fact_ru: opt(s.key_fact_ru),
      key_fact_kz: opt(s.key_fact_kz),
      example_ru: opt(s.example_ru),
      example_kz: opt(s.example_kz),
    })),
  };
}

function problems(body: LessonBody): string[] {
  const list: string[] = [];
  if (!body.title_ru.trim() || !body.title_kz.trim()) list.push('название на русском и казахском');
  if (body.source_reference.trim().length < 3) list.push('источник (учебник, страницы)');
  if (body.steps.length === 0) list.push('хотя бы один шаг');
  body.steps.forEach((s, i) => {
    if (!s.heading_ru.trim() || !s.heading_kz.trim() || !s.body_ru.trim() || !s.body_kz.trim()) {
      list.push(`шаг ${i + 1}: заголовок и текст на обоих языках`);
    }
  });
  return list;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ slug, onClose }) => {
  const { can, session } = useStaff();
  const isNew = !slug;
  const detail = useAdminData(() => (slug ? adminApi.lesson(slug) : Promise.resolve(null)), [slug]);
  const subjects = useAdminData(() => adminApi.subjects(), []);
  const [subjectId, setSubjectId] = useState('');
  const topics = useAdminData(() => (subjectId ? adminApi.topics(subjectId) : Promise.resolve({ items: [] })), [subjectId]);
  const [topicId, setTopicId] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [body, setBody] = useState<LessonBody>(emptyBody());
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const latest: LessonVersion | undefined = detail.data?.versions[0];
  // An existing lesson is edited by saving a new draft version based on the latest one.
  useEffect(() => {
    if (latest) {
      setBody({
        title_ru: latest.title_ru,
        title_kz: latest.title_kz,
        estimated_minutes: latest.estimated_minutes,
        source_reference: latest.source_reference,
        steps: latest.steps.map((s) => ({ ...emptyStep(), ...s })),
      });
    }
  }, [latest?.id]);

  const issues = useMemo(() => problems(body), [body]);
  const canSave = isNew ? can('content.create') : can('content.edit');

  const save = async () => {
    if (issues.length) {
      setResult({ tone: 'error', text: `Не сохранено. Заполните: ${issues.join('; ')}.` });
      return;
    }
    setBusy(true);
    if (isNew) {
      if (!topicId || !SLUG_RE.test(newSlug)) {
        setResult({ tone: 'error', text: 'Выберите тему и укажите код урока латиницей (например, lesson-code).' });
        setBusy(false);
        return;
      }
      const ok = await runAction(() => adminApi.createLesson({ ...clean(body), topic_id: topicId, slug: newSlug }), 'Урок создан как черновик.', setResult);
      setBusy(false);
      if (ok) onClose();
      return;
    }
    const ok = await runAction(() => adminApi.createLessonVersion(slug!, clean(body)), 'Сохранена новая версия-черновик.', setResult);
    setBusy(false);
    if (ok) detail.reload();
  };

  const transition = async (version: LessonVersion, action: WorkflowAction, label: string) => {
    if (await runAction(() => adminApi.lessonTransition(slug!, version.version, action), `${label}: готово.`, setResult)) detail.reload();
  };

  const updateStep = (index: number, key: keyof LessonStep, value: string) =>
    setBody({ ...body, steps: body.steps.map((s, i) => (i === index ? { ...s, [key]: value } : s)) });
  const moveStep = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= body.steps.length) return;
    const steps = [...body.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    setBody({ ...body, steps });
  };

  if (slug && !detail.data) {
    return detail.loading ? <LoadingBlock /> : <ErrorBlock text={detail.error ?? ''} onRetry={detail.reload} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#EBE8E0] cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#171717]">{isNew ? 'Новый урок' : `Урок ${slug}`}</h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              {isNew
                ? 'Урок создаётся черновиком. Ученики увидят его только после рецензии и публикации.'
                : `${detail.data?.topic_title} · правка сохраняется как новая версия-черновик`}
            </p>
          </div>
        </div>
        {canSave && (
          <button
            onClick={() => void save()}
            disabled={busy}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {isNew ? 'Создать черновик' : 'Сохранить новую версию'}
          </button>
        )}
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {!isNew && detail.data && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Версии</h2>
          <div className="divide-y divide-[#E2DED5] text-xs">
            {detail.data.versions.map((v) => (
              <div key={v.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#171717]">v{v.version}</span>
                  <StatusBadge status={v.status} label={STATUS_LABELS[v.status]} />
                  <span className="text-[#78716C]">
                    автор {v.author}
                    {v.reviewer ? ` · рецензент ${v.reviewer}` : ''} · {fmtDate(v.created_at, true)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {ACTIONS.filter((a) => a.from === v.status && can(a.permission)).map((a) => {
                    const own = (a.action === 'approve' || a.action === 'publish') && v.author === session?.staff.email;
                    return (
                      <button
                        key={a.action}
                        disabled={own}
                        title={own ? 'Автор не может утверждать и публиковать свою версию' : undefined}
                        onClick={() => void transition(v, a.action, a.label)}
                        className="px-2.5 py-1 text-[11px] font-semibold border border-[#E2DED5] rounded bg-white hover:bg-[#F5F3EE] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-4">
        {isNew && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs font-medium text-[#78716C]">
              Предмет
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId(''); }} className={`${field} mt-1`}>
                <option value="">— выберите —</option>
                {subjects.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>{s.title_ru}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-[#78716C]">
              Тема
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!subjectId} className={`${field} mt-1`}>
                <option value="">{subjectId && topics.data?.items.length === 0 ? 'нет тем — создайте в «Предметах»' : '— выберите —'}</option>
                {topics.data?.items.map((t) => (
                  <option key={t.id} value={t.id}>{t.title_ru}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-[#78716C]">
              Код урока (латиница, дефис)
              <input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase())} className={`${field} font-mono mt-1`} />
            </label>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[#78716C]">
            Название (RU)
            <input value={body.title_ru} onChange={(e) => setBody({ ...body, title_ru: e.target.value })} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Название (KZ)
            <input value={body.title_kz} onChange={(e) => setBody({ ...body, title_kz: e.target.value })} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Источник
            <input value={body.source_reference} onChange={(e) => setBody({ ...body, source_reference: e.target.value })} placeholder="Учебник, класс, страницы" className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-medium text-[#78716C]">
            Длительность, минут
            <input type="number" min={1} max={180} value={body.estimated_minutes} onChange={(e) => setBody({ ...body, estimated_minutes: Number(e.target.value) })} className={`${field} mt-1`} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {body.steps.map((step, index) => (
          <div key={index} className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">Шаг {index + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveStep(index, -1)} className="p-1 text-[#A8A29E] hover:text-[#171717] cursor-pointer" title="Выше"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveStep(index, 1)} className="p-1 text-[#A8A29E] hover:text-[#171717] cursor-pointer" title="Ниже"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => setBody({ ...body, steps: body.steps.filter((_, i) => i !== index) })} className="p-1 text-[#A8A29E] hover:text-[#C94A43] cursor-pointer" title="Удалить шаг"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['ru', 'kz'] as const).map((lang) => (
                <div key={lang} className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#A8A29E]">{lang === 'ru' ? 'Русский' : 'Қазақша'}</span>
                  <input placeholder="Заголовок шага" value={step[`heading_${lang}`]} onChange={(e) => updateStep(index, `heading_${lang}`, e.target.value)} className={field} />
                  <textarea rows={4} placeholder="Текст шага" value={step[`body_${lang}`]} onChange={(e) => updateStep(index, `body_${lang}`, e.target.value)} className={field} />
                  <textarea rows={2} placeholder="Ключевой факт (необязательно)" value={step[`key_fact_${lang}`] ?? ''} onChange={(e) => updateStep(index, `key_fact_${lang}`, e.target.value)} className={field} />
                  <textarea rows={2} placeholder="Пример (необязательно)" value={step[`example_${lang}`] ?? ''} onChange={(e) => updateStep(index, `example_${lang}`, e.target.value)} className={field} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => setBody({ ...body, steps: [...body.steps, emptyStep()] })}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF5A36]" /> Добавить шаг
        </button>
      </div>

      {issues.length > 0 && (
        <p className="text-[11px] text-[#78716C] flex items-center gap-1.5">
          <Send className="w-3 h-3" /> Чтобы сохранить, заполните: {issues.join('; ')}.
        </p>
      )}
    </div>
  );
};
