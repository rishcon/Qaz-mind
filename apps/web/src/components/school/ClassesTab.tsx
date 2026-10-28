import React, { useState } from 'react';
import { ApiSchoolClass, schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';
import { ClassPanel } from './ClassPanel';

interface ClassesTabProps {
  orgId: string;
  classes: ApiSchoolClass[];
  isAdmin: boolean;
  writable: boolean;
  onChanged: () => void;
}

const field = 'px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm focus:outline-none focus:border-[#171717]';
const button =
  'px-4 py-2 bg-[#171717] hover:bg-[#FF5A36] disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer rounded-sm';

/** The academic year starts in September: from September 2026 it is 2026-2027. */
function currentAcademicYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** Classes of the school. An administrator creates and archives them; a teacher sees the assigned ones. */
export const ClassesTab: React.FC<ClassesTabProps> = ({ orgId, classes, isAdmin, writable, onChanged }) => {
  const [open, setOpen] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [year, setYear] = useState(currentAcademicYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      onChanged();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(() => schoolApi.createClass(orgId, { name, academic_year: year, grade: grade ? Number(grade) : null }));
    if (ok) {
      setName('');
      setGrade('');
    }
  };

  const shown = classes.filter((c) => showArchived || c.status === 'active');
  const archivedCount = classes.filter((c) => c.status !== 'active').length;

  return (
    <section className="space-y-4">
      {error && (
        <div role="alert" className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 rounded-sm">
          {error}
        </div>
      )}

      {writable && isAdmin && (
        <form onSubmit={create} className="bg-white border border-[#E2DED5] p-4 rounded-sm flex flex-wrap gap-3 items-end">
          <label className="text-xs font-bold space-y-1">
            <span className="block">Класс</span>
            <input className={`${field} w-32`} value={name} onChange={(e) => setName(e.target.value)} placeholder="11 А" required maxLength={80} />
          </label>
          <label className="text-xs font-bold space-y-1">
            <span className="block">Параллель</span>
            <input className={`${field} w-20`} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="11" inputMode="numeric" />
          </label>
          <label className="text-xs font-bold space-y-1">
            <span className="block">Учебный год</span>
            <input className={`${field} w-32`} value={year} onChange={(e) => setYear(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy} className={button}>
            Создать класс
          </button>
        </form>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-[#74736F]">{isAdmin ? 'Классов пока нет. Создайте первый.' : 'Вам ещё не назначены классы. Их назначает администратор школы.'}</p>
      ) : (
        <div className="bg-white border border-[#E2DED5] rounded-sm divide-y divide-[#EFECE4]">
          {shown.map((c) => (
            <div key={c.id}>
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold">
                    {c.name}
                    {c.status === 'archived' && <span className="ml-2 text-xs font-mono text-[#74736F]">в архиве</span>}
                  </div>
                  <div className="text-xs text-[#74736F]">
                    {c.academic_year} · учеников: {c.student_count} · учителей: {c.teacher_count}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setOpen(open === c.id ? '' : c.id)} className="text-xs font-mono font-bold underline underline-offset-4 cursor-pointer">
                    {open === c.id ? 'Свернуть' : 'Управлять'}
                  </button>
                  {writable && isAdmin && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => schoolApi.updateClass(orgId, c.id, { status: c.status === 'active' ? 'archived' : 'active' }))}
                      className="text-xs font-mono font-bold underline underline-offset-4 text-[#74736F] hover:text-[#171717] cursor-pointer"
                    >
                      {c.status === 'active' ? 'В архив' : 'Вернуть'}
                    </button>
                  )}
                </div>
              </div>
              {open === c.id && <ClassPanel orgId={orgId} classId={c.id} writable={writable} onChanged={onChanged} />}
            </div>
          ))}
        </div>
      )}
      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived(!showArchived)} className="text-xs font-mono font-bold underline underline-offset-4 text-[#74736F] cursor-pointer">
          {showArchived ? 'Скрыть архивные' : `Показать архивные (${archivedCount})`}
        </button>
      )}
    </section>
  );
};
