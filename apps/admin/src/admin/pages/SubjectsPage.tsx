import React, { useState } from 'react';
import { Plus, X, HelpCircle, FileText } from 'lucide-react';
import { adminApi } from '../api/client';
import { runAction, useAdminData } from '../api/useAdminData';
import { useStaff } from '../auth/StaffAuth';
import { ActionResultNotice, type ActionResult } from '../components/ui/ConnectionNotice';
import { ErrorBlock, LoadingBlock } from '../components/ui/PageState';

interface SubjectsPageProps {
  onNavigate: (path: string) => void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const field = 'w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md';

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onNavigate }) => {
  const { can } = useStaff();
  const subjects = useAdminData(() => adminApi.subjects(), [], 60000);
  const [selected, setSelected] = useState<string>('');
  const active = subjects.data?.items.find((s) => s.id === selected) ?? subjects.data?.items[0];
  const topics = useAdminData(() => (active ? adminApi.topics(active.id) : Promise.resolve({ items: [] })), [active?.id]);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ slug: '', title_ru: '', title_kz: '' });

  if (!subjects.data) {
    return subjects.loading ? <LoadingBlock /> : <ErrorBlock text={subjects.error ?? ''} onRetry={subjects.reload} />;
  }

  const createTopic = async () => {
    if (!active) return;
    const ok = await runAction(
      () => adminApi.createTopic({ subject_id: active.id, ...form, slug: form.slug.trim() }),
      'Тема создана.',
      setResult,
    );
    if (ok) {
      setModal(false);
      setForm({ slug: '', title_ru: '', title_kz: '' });
      topics.reload();
      subjects.reload();
    }
  };
  const formValid = SLUG_RE.test(form.slug.trim()) && form.title_ru.trim() && form.title_kz.trim();

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Предметы и учебная программа ЕНТ</h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Каталог предметов задан на сервере. Темы и уроки создаются здесь; количество считается по базе.
        </p>
      </div>

      {!modal && <ActionResultNotice result={result} onDismiss={() => setResult(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#E2DED5] p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#78716C] px-2 mb-2">
            Предметы ({subjects.data.items.length})
          </h2>
          <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {subjects.data.items.map((sub) => {
              const isSelected = sub.id === active?.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelected(sub.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-[#FF5A36] bg-[#FFF7F5]' : 'border-[#E2DED5] bg-white hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#FF5A36]' : 'text-[#171717]'}`}>{sub.title_ru}</span>
                    <span
                      className={`px-1.5 rounded text-[10px] font-bold ${
                        sub.category === 'mandatory' ? 'bg-[#EBF7F2] text-[#258568]' : 'bg-[#F0EEE8] text-[#5C574F]'
                      }`}
                    >
                      {sub.category === 'mandatory' ? 'Обязательный' : 'Профильный'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C] mt-0.5">{sub.title_kz}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#A8A29E] font-medium">
                    <span>{sub.topics} тем</span>•<span>{sub.lessons_published} из {sub.lessons} уроков опубл.</span>•
                    <span>{sub.questions} вопросов</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2DED5] p-6 space-y-4">
          {active && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2DED5]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A36]">
                    Код {active.code} · {active.id}
                  </span>
                  <h2 className="text-lg font-bold text-[#171717] mt-0.5">{active.title_ru}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {can('content.create') && (
                    <button
                      onClick={() => setModal(true)}
                      className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF5A36]" /> Добавить тему
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate(`/admin/content/questions?subject=${active.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Вопросы предмета
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                Темы ({topics.data?.items.length ?? '—'})
              </h3>
              {topics.error && <ErrorBlock text={topics.error} onRetry={topics.reload} />}
              {topics.data && topics.data.items.length === 0 && (
                <div className="p-8 text-center text-xs text-[#78716C] bg-[#FAF9F6] rounded-lg border border-[#E2DED5]">
                  В этом предмете ещё нет тем.
                </div>
              )}
              <div className="space-y-2.5">
                {topics.data?.items.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-lg border border-[#E2DED5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-[#F0EEE8] flex items-center justify-center font-mono text-xs font-bold text-[#5C574F]">
                        {t.position}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#171717]">{t.title_ru}</div>
                        <div className="text-[11px] text-[#78716C]">
                          {t.title_kz} · <span className="font-mono">{t.slug}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate(`/admin/content/lessons?subject=${active.id}`)}
                      className="px-2.5 py-1 text-xs text-[#78716C] hover:text-[#FF5A36] bg-[#FAF9F6] border border-[#E2DED5] rounded flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" /> Уроки ({t.lessons})
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modal && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Новая тема: {active.title_ru}</h3>
              <button onClick={() => setModal(false)} className="text-[#A8A29E] hover:text-[#171717] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
              <label className="block text-xs font-medium text-[#78716C]">
                Код темы (латиница, цифры, дефис)
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="kod-temy" className={`${field} font-mono mt-1`} />
              </label>
              <label className="block text-xs font-medium text-[#78716C]">
                Название (RU)
                <input value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className="block text-xs font-medium text-[#78716C]">
                Название (KZ)
                <input value={form.title_kz} onChange={(e) => setForm({ ...form, title_kz: e.target.value })} className={`${field} mt-1`} />
              </label>
            </div>
            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex justify-end gap-2">
              <button onClick={() => setModal(false)} className="px-3 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded cursor-pointer">
                Отмена
              </button>
              <button
                disabled={!formValid}
                onClick={() => void createTopic()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] rounded cursor-pointer disabled:opacity-40"
              >
                Создать тему
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
