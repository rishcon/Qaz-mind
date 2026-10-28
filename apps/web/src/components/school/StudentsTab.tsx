import React, { useEffect, useState } from 'react';
import { schoolApi } from '../../api/endpoints';
import { errorText } from '../../api/client';

interface StudentsTabProps {
  orgId: string;
  version: number;
}

type Row = { user_id: string; name: string; email: string; class_id: string; class_name: string };

/** All students of the school with their classes. Joining and leaving is managed inside each class. */
export const StudentsTab: React.FC<StudentsTabProps> = ({ orgId, version }) => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [klass, setKlass] = useState('all');

  useEffect(() => {
    let cancelled = false;
    schoolApi
      .orgStudents(orgId)
      .then((r) => !cancelled && setRows(r))
      .catch((err) => !cancelled && setError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, [orgId, version]);

  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  if (!rows) return <p className="text-sm text-[#74736F]">Загрузка…</p>;

  const classes = Array.from(new Map(rows.map((r) => [r.class_id, r.class_name])).entries());
  const needle = search.trim().toLowerCase();
  const shown = rows.filter((r) => (klass === 'all' || r.class_id === klass) && (!needle || r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или email"
          className="px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm flex-1 min-w-[200px] focus:outline-none focus:border-[#171717]"
        />
        <select value={klass} onChange={(e) => setKlass(e.target.value)} className="px-3 py-2 bg-white border border-[#E2DED5] rounded-sm text-sm">
          <option value="all">Все классы</option>
          {classes.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[#74736F]">Учеников пока нет. Дайте им код класса или пригласите по email во вкладке «Классы».</p>
      ) : (
        <div className="bg-white border border-[#E2DED5] rounded-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-mono uppercase text-[#74736F] border-b border-[#EFECE4]">
              <tr>
                <th className="p-3">Ученик</th>
                <th className="p-3">Email</th>
                <th className="p-3">Класс</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.class_id}:${r.user_id}`} className="border-t border-[#EFECE4]">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-[#74736F]">{r.email}</td>
                  <td className="p-3">{r.class_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
