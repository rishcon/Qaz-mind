import React, { useCallback, useEffect, useState } from 'react';
import { ApiMyClass, ApiMyJoinRequest, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

const STATUS_TEXT = { pending: 'ждёт решения учителя', approved: 'принята', rejected: 'отклонена' } as const;

/**
 * Joining a school class with a code. The request waits for a decision by the teacher or the school
 * administrator; personal progress is independent of any school.
 */
export const MySchoolCard: React.FC = () => {
  const [classes, setClasses] = useState<ApiMyClass[]>([]);
  const [requests, setRequests] = useState<ApiMyJoinRequest[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const load = useCallback(async () => {
    try {
      const [mine, asked] = await Promise.all([schoolApi.mySchoolClasses(), schoolApi.myJoinRequests()]);
      setClasses(mine);
      setRequests(asked);
    } catch {
      setClasses([]);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSent('');
    try {
      const request = await schoolApi.requestJoin(code.trim());
      setSent(`Заявка в класс ${request.class_name} («${request.organization_name}») отправлена.`);
      setCode('');
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const open = requests.filter((r) => r.status !== 'approved');

  return (
    <section className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs space-y-5">
      <div>
        <h2 className="text-lg font-bold">Школа и класс</h2>
        <p className="text-xs text-[#74736F] mt-1">Код класса выдаёт учитель. Ваш личный прогресс не зависит от школы.</p>
      </div>

      {classes.length > 0 && (
        <ul className="text-sm space-y-1">
          {classes.map((c) => (
            <li key={c.class_id}>
              <b>{c.class_name}</b> · {c.organization_name} · {c.academic_year}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
        <label className="text-xs font-bold space-y-1">
          <span className="block">Код класса</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX"
            maxLength={40}
            required
            className="px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm font-mono uppercase focus:outline-none focus:border-[#171717]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || code.trim().length < 4}
          className="px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm"
        >
          Отправить заявку
        </button>
      </form>
      {sent && <p className="text-xs text-[#258568] font-medium">{sent}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}

      {open.length > 0 && (
        <ul className="text-xs text-[#74736F] space-y-1">
          {open.map((r) => (
            <li key={r.id}>
              {r.class_name} · {r.organization_name}: {STATUS_TEXT[r.status]}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
