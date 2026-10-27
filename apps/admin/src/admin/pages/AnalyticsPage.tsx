import React from 'react';
import { adminApi } from '../api/client';
import { useAdminData } from '../api/useAdminData';
import { MetricCard } from '../components/ui/MetricCard';
import { ErrorBlock, LoadingBlock, fmtDate } from '../components/ui/PageState';

const share = (part: number, whole: number) => (whole > 0 ? `${part} из ${whole} (${Math.round((part / whole) * 100)}%)` : `${part} из ${whole}`);

/** Every figure is counted on the server from the database. Numerator and denominator are shown together. */
export const AnalyticsPage: React.FC = () => {
  const { data, error, loading, reload } = useAdminData(() => adminApi.overview(), [], 60000);
  if (!data) return loading ? <LoadingBlock /> : <ErrorBlock text={error ?? ''} onRetry={reload} />;

  const funnel = [
    { label: 'Зарегистрировались', value: data.users_total },
    { label: 'Подтвердили email', value: data.users_verified },
    { label: 'Прошли онбординг', value: data.onboarding_completed },
    { label: 'Активны за 24 часа', value: data.active_24h },
  ];
  const q = data.questions;
  const maxDay = Math.max(1, ...data.registrations_by_day.map((d) => d.count));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-[#E2DED5]">
        <h1 className="text-xl font-bold text-[#171717]">Аналитика</h1>
        <p className="text-xs text-[#78716C] mt-0.5">Посчитано по базе на {fmtDate(data.generated_at, true)}. Прогнозов и оценок здесь нет.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Воронка учеников</h2>
        {funnel.map((step) => (
          <div key={step.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#5C574F]">{step.label}</span>
              <span className="font-mono text-[#171717]">{share(step.value, data.users_total)}</span>
            </div>
            <div className="h-2 rounded bg-[#F0EEE8] overflow-hidden">
              <div className="h-full bg-[#FF5A36]" style={{ width: `${data.users_total ? (step.value / data.users_total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Новые за 7 дней" value={data.new_7d} />
        <MetricCard title="Опубликовано уроков" value={data.lessons_published} subtitle={`${data.lessons_in_review} версий на рецензии`} />
        <MetricCard title="Завершений уроков" value={data.lessons_completed} />
        <MetricCard title="Вопросов опубликовано" value={q.published} subtitle={`${q.draft + q.in_review + q.approved} в работе · ${q.archived} в архиве`} />
      </div>

      <div className="bg-white rounded-xl border border-[#E2DED5] p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-3">Регистрации по дням (14 дней)</h2>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-[#E2DED5]">
            {data.registrations_by_day.map((d) => (
              <tr key={d.date}>
                <td className="py-1.5 font-mono text-[#78716C] w-28">{d.date}</td>
                <td className="py-1.5">
                  <div className="h-2 rounded bg-[#FF5A36]/80" style={{ width: `${(d.count / maxDay) * 100}%`, minWidth: d.count ? 4 : 0 }} />
                </td>
                <td className="py-1.5 text-right font-mono w-12">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[#78716C]">
        Пробные экзамены, школы и лицензии появятся в аналитике вместе с их серверной частью.
      </p>
    </div>
  );
};
