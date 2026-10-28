import React, { useCallback, useEffect, useState } from 'react';
import { ApiClassJoinRequest, ApiClassStudent, ApiJoinCode, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface ClassPanelProps {
  orgId: string;
  classId: string;
  /** False when the organization is suspended: the lists stay readable, nothing can be changed. */
  writable: boolean;
  onChanged: () => void;
}

const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const small = 'text-xs font-mono font-bold underline underline-offset-4 cursor-pointer disabled:opacity-40';

/** Students, join requests, class codes and student invitations of one class. */
export const ClassPanel: React.FC<ClassPanelProps> = ({ orgId, classId, writable, onChanged }) => {
  const [students, setStudents] = useState<ApiClassStudent[]>([]);
  const [requests, setRequests] = useState<ApiClassJoinRequest[]>([]);
  const [codes, setCodes] = useState<ApiJoinCode[]>([]);
  const [fresh, setFresh] = useState<ApiJoinCode | null>(null);
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('14');
  const [uses, setUses] = useState('50');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, r, c] = await Promise.all([
        schoolApi.students(orgId, classId),
        schoolApi.classRequests(orgId, classId),
        schoolApi.joinCodes(orgId, classId),
      ]);
      setStudents(s);
      setRequests(r);
      setCodes(c);
    } catch (err) {
      setError(errorText(err));
    }
  }, [orgId, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, success = '') => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await action();
      if (success) setNote(success);
      await load();
      onChanged();
    } catch (err) {
      setError(errorText(err));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <div className="border-t border-[#EFECE4] bg-[#FAF9F6] p-4 space-y-5">
      {error && (
        <div role="alert" className="p-2.5 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}
      {note && <div className="text-xs text-[#258568] font-medium">{note}</div>}

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">
          Заявки на вступление ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-xs text-[#74736F]">Новых заявок нет.</p>
        ) : (
          <ul className="space-y-1.5">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {r.name} <span className="text-xs text-[#74736F]">{r.email}</span>
                </span>
                {writable && (
                  <span className="flex gap-4">
                    <button type="button" disabled={busy} className={`${small} text-[#258568]`} onClick={() => run(() => schoolApi.decideRequest(r.id, 'approve'), 'Ученик добавлен в класс.')}>
                      Принять
                    </button>
                    <button type="button" disabled={busy} className={`${small} text-red-700`} onClick={() => run(() => schoolApi.decideRequest(r.id, 'reject'))}>
                      Отклонить
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F] mb-2">Ученики ({students.length})</h3>
        {students.length === 0 ? (
          <p className="text-xs text-[#74736F]">В классе пока нет учеников.</p>
        ) : (
          <ul className="space-y-1.5">
            {students.map((s) => (
              <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {s.name} <span className="text-xs text-[#74736F]">{s.email}</span>
                </span>
                {writable && (
                  <button type="button" disabled={busy} className={`${small} text-[#74736F] hover:text-red-700`} onClick={() => run(() => schoolApi.removeStudent(orgId, classId, s.user_id))}>
                    Убрать из класса
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {writable && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Пригласить ученика по email</h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await schoolApi.invite(orgId, { email, role: 'STUDENT', class_id: classId });
                  setEmail('');
                }, `Приглашение отправлено на ${email.trim().toLowerCase()}.`);
              }}
            >
              <input className={`${field} flex-1 min-w-0`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ученик@mail.kz" required />
              <button type="submit" disabled={busy} className="px-3 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold cursor-pointer rounded-sm">
                Отправить
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#74736F]">Код класса</h3>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => setFresh(await schoolApi.createJoinCode(orgId, classId, { valid_days: Number(days) || 14, max_uses: Number(uses) || 50 })));
              }}
            >
              <label className="text-[11px] font-bold">
                дней
                <input className={`${field} w-16 block`} value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" />
              </label>
              <label className="text-[11px] font-bold">
                заявок
                <input className={`${field} w-20 block`} value={uses} onChange={(e) => setUses(e.target.value)} inputMode="numeric" />
              </label>
              <button type="submit" disabled={busy} className="px-3 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold cursor-pointer rounded-sm">
                Создать код
              </button>
            </form>
            {fresh?.code && (
              <div className="p-3 border border-[#BFE3D4] bg-[#F4FAF7] rounded-sm text-sm">
                Новый код: <b className="font-mono text-base tracking-wider">{fresh.code}</b>
                <div className="text-xs text-[#74736F] mt-1">Сохраните его сейчас: позже будет виден только конец кода.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {codes.length > 0 && (
        <ul className="text-xs text-[#74736F] space-y-1">
          {codes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3">
              <span className="font-mono">••••-••{c.code_hint}</span>
              <span>
                до {new Date(c.expires_at).toLocaleDateString('ru-RU')} · заявок {c.uses_count}/{c.max_uses}
              </span>
              {c.revoked ? (
                <span>отозван</span>
              ) : (
                writable && (
                  <button type="button" disabled={busy} className={`${small} text-red-700`} onClick={() => run(() => schoolApi.revokeJoinCode(orgId, classId, c.id))}>
                    Отозвать
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
