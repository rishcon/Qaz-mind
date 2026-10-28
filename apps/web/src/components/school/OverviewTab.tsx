import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ApiSchoolOverview, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

export type SchoolTab = 'overview' | 'classes' | 'students' | 'staff' | 'questions' | 'assignments';

interface OverviewTabProps {
  orgId: string;
  isAdmin: boolean;
  onGo: (tab: SchoolTab) => void;
  /** Bumped by the cabinet after a change, so the numbers are read again. */
  version: number;
}

const stat = 'bg-white border border-[#E2DED5] rounded-sm p-4 text-left';

/** Start page of the school: the numbers that matter today and the first steps for a new school. */
export const OverviewTab: React.FC<OverviewTabProps> = ({ orgId, isAdmin, onGo, version }) => {
  const [data, setData] = useState<ApiSchoolOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    schoolApi
      .overview(orgId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, [orgId, version]);

  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-[#74736F]">Загрузка…</p>;

  const lic = data.license;
  const used = lic ? Math.min(100, Math.round((lic.seats_used / lic.seat_limit) * 100)) : 0;
  const a = data.assignments;
  const steps = [
    { done: data.classes > 0, title: 'Создайте классы', hint: 'Вкладка «Классы»: 11 А, 11 Б и так далее.', tab: 'classes' as const },
    { done: !!lic, title: 'Лицензия платформы', hint: 'Её выдаёт QazMind. Пока её нет, создать учеников нельзя.', tab: null },
    { done: data.teachers > 0, title: 'Пригласите учителей', hint: 'Вкладка «Сотрудники»: создайте логин и пароль учителя и отметьте его классы.', tab: 'staff' as const },
    { done: data.students > 0, title: 'Создайте логины для учеников', hint: 'В классе нажмите «Управлять», впишите список имён и получите логины с паролями.', tab: 'classes' as const },
    { done: a.published + a.closed > 0, title: 'Назначьте первое задание', hint: 'Вкладка «Задания»: выберите предмет, классы и срок.', tab: 'assignments' as const },
  ];
  const showSteps = isAdmin && steps.some((s) => !s.done);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" className={`${stat} cursor-pointer`} onClick={() => onGo('classes')}>
          <div className="text-2xl font-extrabold">{data.classes}</div>
          <div className="text-xs text-[#74736F]">классов</div>
        </button>
        <button type="button" className={`${stat} cursor-pointer`} onClick={() => onGo(isAdmin ? 'students' : 'classes')}>
          <div className="text-2xl font-extrabold">{data.students}</div>
          <div className="text-xs text-[#74736F]">учеников</div>
        </button>
        {isAdmin && (
          <button type="button" className={`${stat} cursor-pointer`} onClick={() => onGo('staff')}>
            <div className="text-2xl font-extrabold">{data.teachers}</div>
            <div className="text-xs text-[#74736F]">учителей</div>
          </button>
        )}
        <button type="button" className={`${stat} cursor-pointer`} onClick={() => onGo('assignments')}>
          <div className="text-2xl font-extrabold">{a.published}</div>
          <div className="text-xs text-[#74736F]">заданий идёт · закрыто {a.closed} · черновиков {a.draft}</div>
        </button>
      </div>

      {isAdmin && (
        <div className="bg-white border border-[#E2DED5] rounded-sm p-4 space-y-2">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Лицензия</h2>
          {lic ? (
            <>
              <div className="text-sm">
                <b>{lic.plan}</b>: занято мест {lic.seats_used} из {lic.seat_limit}, действует до {new Date(lic.expires_at).toLocaleDateString('ru-RU')}
              </div>
              <div className="h-2 bg-[#EFECE4] rounded-full overflow-hidden">
                <div className={`h-full ${used >= 90 ? 'bg-red-500' : 'bg-[#258568]'}`} style={{ width: `${used}%` }} />
              </div>
              {used >= 90 && <p className="text-xs text-red-700">Места почти закончились: напишите в QazMind, чтобы расширить лицензию.</p>}
            </>
          ) : (
            <p className="text-sm text-[#74736F]">
              Действующей лицензии нет. Пока её не выдала платформа, создать логины учеников нельзя; всё остальное работает.
            </p>
          )}
        </div>
      )}

      {showSteps && (
        <div className="bg-white border border-[#E2DED5] rounded-sm p-4 space-y-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">С чего начать</h2>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3 text-sm">
                <span
                  className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step.done ? 'bg-[#258568] text-white' : 'bg-[#EFECE4] text-[#74736F]'
                  }`}
                >
                  {step.done ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span>
                  {step.tab && !step.done ? (
                    <button type="button" className="font-bold underline underline-offset-4 cursor-pointer" onClick={() => onGo(step.tab!)}>
                      {step.title}
                    </button>
                  ) : (
                    <b>{step.title}</b>
                  )}
                  {!step.done && <span className="block text-xs text-[#74736F]">{step.hint}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
