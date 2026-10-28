import React, { useState } from 'react';
import { Upload, AlertTriangle, ArrowRight, ArrowLeft, Download, Check, X } from 'lucide-react';
import { adminApi, ApiError, errorText, ImportReport, QuestionBody } from '../../api/client';
import { useAdminData } from '../../api/useAdminData';
import { ActionResultNotice, type ActionResult } from '../ui/ConnectionNotice';
import { parseQuestionCsv, QUESTION_CSV_HEADER, type ImportedQuestionRow } from '../../utils/questionCsv';
import { parseQuestionJson, QUESTION_JSON_EXAMPLE, shuffleOptions } from '../../utils/questionJson';

/** The server takes at most this many questions per request; all selected files are sent together. */
const MAX_ROWS = 500;
const PASTED = 'вставленный текст';

/** The limits of the server, so a too long value is reported with its line instead of failing the whole request. */
const LIMITS = { text: 4000, option: 1000, explanation: 4000, source: 1000, id: 80 };

function limitProblem(row: ImportedQuestionRow): string | null {
  if (row.textRu.length > LIMITS.text || row.textKz.length > LIMITS.text) return `текст вопроса длиннее ${LIMITS.text} символов`;
  if (row.options.some((o) => o.textRu.length > LIMITS.option || o.textKz.length > LIMITS.option)) return `вариант ответа длиннее ${LIMITS.option} символов`;
  if (row.explanationRu.length > LIMITS.explanation || row.explanationKz.length > LIMITS.explanation) return `пояснение длиннее ${LIMITS.explanation} символов`;
  if (row.source.length > LIMITS.source) return `источник длиннее ${LIMITS.source} символов (сейчас ${row.source.length})`;
  if ((row.externalId ?? '').length > LIMITS.id) return `ID длиннее ${LIMITS.id} символов`;
  return null;
}

/** A refused request names the field that failed, not only "check the data". */
function describeError(error: unknown): string {
  if (error instanceof ApiError && error.details.length > 0) {
    const first = error.details.slice(0, 3).map((d) => `${d.field}: ${d.message}`).join('; ');
    return `${error.message}. ${first}${error.details.length > 3 ? ` и ещё ${error.details.length - 3}` : ''}`;
  }
  return errorText(error);
}

interface ImportWizardProps {
  onDone: () => void;
  onCancel: () => void;
}

interface SourceFile {
  name: string;
  text: string;
}

type Tagged = ImportedQuestionRow & { file: string };

interface FileCheck {
  name: string;
  rows: number;
  issues: { line: number; message: string }[];
  missingColumns: string[];
  blockedReason: string | null;
}

interface Combined {
  rows: Tagged[];
  files: FileCheck[];
  issueCount: number;
  duplicateIds: number;
  blockedReason: string | null;
}

/**
 * Bulk import of questions from one or several files (JSON, JSONL or CSV in the template layout). Each file is checked here
 * and then all of them together on the server, so the same ID in two files is found too. A row that fails a check is listed
 * with its file and line number and is never imported with a guessed value. The selected files are accepted whole or not at all.
 */
export const ImportWizard: React.FC<ImportWizardProps> = ({ onDone, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [pasted, setPasted] = useState('');
  const [parsed, setParsed] = useState<Combined | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  // Subject codes and IDs from the server catalog. While the list is not loaded, the import is blocked.
  const subjects = useAdminData(() => adminApi.subjects(), []);
  const catalog = subjects.data?.items ?? [];
  const knownSubjectCodes = catalog.flatMap((subject) => [subject.code, subject.id]);
  const [importing, setImporting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  // Answer positions in the bank should not follow the order the author wrote them in.
  const [shuffle, setShuffle] = useState(true);
  // The rows that were sent to the check. The server counts rows in this order, not in file order.
  const [sent, setSent] = useState<Tagged[]>([]);

  const toBody = (source: ImportedQuestionRow): QuestionBody => {
    const row = shuffle ? shuffleOptions(source) : source;
    const subject = catalog.find((s) => s.id === row.subjectCode || s.code === row.subjectCode)!;
    return {
      subject_id: subject.id,
      topic_id: null,
      difficulty: row.difficulty,
      points: row.points,
      text_ru: row.textRu,
      text_kz: row.textKz,
      options: row.options.map((o) => ({ label: o.label, text_ru: o.textRu, text_kz: o.textKz })),
      correct_label: row.correctLabel,
      explanation_ru: row.explanationRu,
      explanation_kz: row.explanationKz,
      source_reference: row.source,
      external_id: row.externalId,
    };
  };

  /** The file and line of a row the server reported, from its position among the rows that were sent. */
  const placeOf = (serverRow: number): string => {
    const row = sent[serverRow - 1];
    if (!row) return `№ ${serverRow}`;
    return files.length + (pasted.trim() ? 1 : 0) > 1 ? `${row.file} · строка ${row.line}` : `№ ${row.line}`;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = ''; // the same file can be chosen again after it was removed
    if (chosen.length === 0) return;
    const read: SourceFile[] = [];
    for (const file of chosen) read.push({ name: file.name, text: await file.text() });
    setFiles((current) => {
      const names = new Set(current.map((f) => f.name));
      return [...current, ...read.filter((f) => !names.has(f.name))];
    });
    setResult(null);
  };

  const parseAll = (list: SourceFile[]): Combined => {
    const rows: Tagged[] = [];
    const checks: FileCheck[] = [];
    let duplicateIds = 0;
    let blockedReason: string | null = null;
    for (const source of list) {
      const isJson = /^[\s﻿]*[[{]/.test(source.text);
      const next = isJson ? parseQuestionJson(source.text, knownSubjectCodes) : parseQuestionCsv(source.text, knownSubjectCodes);
      rows.push(...next.rows.map((r) => ({ ...r, file: source.name })));
      duplicateIds += next.duplicateIds;
      blockedReason = blockedReason ?? next.blockedReason ?? null;
      checks.push({
        name: source.name,
        rows: next.rows.length,
        issues: next.issues,
        missingColumns: next.missingColumns,
        blockedReason: next.blockedReason ?? null,
      });
    }
    for (const row of rows) {
      const problem = limitProblem(row);
      if (problem) checks.find((c) => c.name === row.file)?.issues.push({ line: row.line, message: problem });
    }
    // The same ID in two different files is as wrong as twice in one file.
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (!row.externalId) continue;
      const first = seen.get(row.externalId);
      if (first && first !== row.file) {
        const check = checks.find((c) => c.name === row.file);
        check?.issues.push({ line: row.line, message: `ID «${row.externalId}» уже есть в файле ${first}` });
      } else if (!first) seen.set(row.externalId, row.file);
    }
    if (rows.length > MAX_ROWS) {
      blockedReason = `Во всех файлах вместе ${rows.length} вопросов, за один раз можно не больше ${MAX_ROWS}. Уберите часть файлов и импортируйте их отдельно.`;
    }
    return { rows: blockedReason ? [] : rows, files: checks, issueCount: checks.reduce((n, c) => n + c.issues.length, 0), duplicateIds, blockedReason };
  };

  const handleCheck = () => {
    setStep(2);
    void handleCheckWith(files, pasted);
  };

  const removeFile = (name: string) => setFiles((current) => current.filter((f) => f.name !== name));

  /** Drops a file that has errors and checks the rest again. */
  const dropAndRecheck = (name: string) => {
    if (name === PASTED) {
      setPasted('');
      void handleCheckWith(files, '');
      return;
    }
    const rest = files.filter((f) => f.name !== name);
    setFiles(rest);
    void handleCheckWith(rest, pasted);
  };

  const handleCheckWith = async (list: SourceFile[], pastedText: string) => {
    const all = pastedText.trim() ? [...list, { name: PASTED, text: pastedText }] : list;
    if (all.length === 0) {
      setParsed(null);
      setStep(1);
      return;
    }
    const next = parseAll(all);
    setParsed(next);
    setReport(null);
    setResult(null);
    setSent(next.rows);
    if (next.rows.length === 0) return;
    setChecking(true);
    try {
      setReport(await adminApi.checkQuestionImport(next.rows.map(toBody)));
    } catch (error) {
      setResult({ tone: 'error', text: describeError(error) });
    } finally {
      setChecking(false);
    }
  };

  const download = (content: string, type: string, name: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDownloadTemplate = () =>
    download(`${QUESTION_CSV_HEADER.join(',')}\n`, 'text/csv;charset=utf-8;', 'qazmind_ent_questions_template.csv');
  const handleDownloadJson = () =>
    download(JSON.stringify(QUESTION_JSON_EXAMPLE, null, 2), 'application/json', 'qazmind_questions_example.json');

  // A refused import keeps the preview on screen; the step changes only when the server accepts the rows.
  const handleImport = async () => {
    if (!parsed || !canImport) return;
    setImporting(true);
    try {
      await adminApi.importQuestions(parsed.rows.map(toBody));
      setStep(4);
    } catch (error) {
      setResult({ tone: 'error', text: describeError(error) });
    } finally {
      setImporting(false);
    }
  };

  // Import opens only when neither the page nor the server found an error: the chosen files are accepted whole or not at all.
  const canImport =
    !!parsed && parsed.issueCount === 0 && parsed.rows.length > 0 && !!report && report.errors.length === 0 && !checking;
  const hasInput = files.length > 0 || pasted.trim().length > 0;
  const fileCount = files.length + (pasted.trim() ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-[#EBE8E0] text-[#78716C] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#171717]">
              Массовый импорт вопросов ЕНТ (JSON / CSV)
            </h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              Один или несколько файлов, проверка каждой строки на странице и на сервере, отправка в банк как черновики. Пустые поля не заполняются автоматически.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FF5A36]" /> Пример JSON
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FF5A36]" /> Шаблон CSV
          </button>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="flex items-center justify-between max-w-xl mx-auto py-2">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-[#FF5A36]' : 'text-[#A8A29E]'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
          <span>Загрузка</span>
        </div>
        <div className="h-0.5 w-10 bg-[#E2DED5]" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-[#FF5A36]' : 'text-[#A8A29E]'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
          <span>Проверка</span>
        </div>
        <div className="h-0.5 w-10 bg-[#E2DED5]" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 3 ? 'text-[#FF5A36]' : 'text-[#A8A29E]'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
          <span>Предпросмотр</span>
        </div>
        <div className="h-0.5 w-10 bg-[#E2DED5]" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 4 ? 'text-[#258568]' : 'text-[#A8A29E]'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
          <span>Готово</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-2xl mx-auto space-y-4">
          <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

          <label className="block border-2 border-dashed border-[#D5D0C5] rounded-xl p-8 text-center bg-[#FAF9F6] space-y-3 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-[#FFF7F5] flex items-center justify-center mx-auto text-[#FF5A36]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#171717]">Выберите один или несколько файлов JSON, JSONL или CSV</p>
              <p className="text-xs text-[#78716C] mt-1">
                Кодировка UTF-8. Формат каждого файла определяется по содержимому. Файлы можно добавлять по частям
              </p>
            </div>
            <input
              type="file"
              multiple
              accept=".json,.jsonl,.csv,application/json,text/csv"
              onChange={handleFileChange}
              className="block mx-auto text-xs text-[#5C574F]"
            />
          </label>

          {files.length > 0 && (
            <ul className="divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg text-xs">
              {files.map((f) => (
                <li key={f.name} className="p-2.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[#171717] truncate">{f.name}</span>
                  <span className="flex items-center gap-3 shrink-0 text-[#78716C]">
                    {Math.max(1, Math.round(f.text.length / 1024))} КБ
                    <button
                      type="button"
                      onClick={() => removeFile(f.name)}
                      aria-label={`Убрать ${f.name}`}
                      className="p-1 rounded hover:bg-[#F5F3EE] text-[#78716C] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label className="text-xs font-medium text-[#78716C] block mb-1">
              Или вставьте содержимое вручную (считается ещё одним файлом):
            </label>
            <textarea
              rows={5}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'{"format": "qazmind.questions.v1", "questions": [ … ]}'}
              className="w-full text-xs font-mono p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717]"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs text-[#78716C]">{hasInput ? `Выбрано файлов: ${fileCount}` : ''}</span>
            <button
              type="button"
              onClick={handleCheck}
              disabled={!hasInput}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {fileCount > 1 ? 'Проверить файлы' : 'Проверить файл'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 2 && parsed && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-2xl mx-auto space-y-5">
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            Результаты проверки {parsed.files.length > 1 ? 'файлов' : 'файла'}
          </h2>

          {parsed.blockedReason && (
            <div className="p-3.5 rounded-lg bg-[#FEF7EA] border border-[#D89B35]/30 text-xs text-[#9A6715] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              <span>{parsed.blockedReason}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-[#EBF7F2] border border-[#258568]/20">
              <div className="text-xs text-[#1D6A53]">Корректных строк</div>
              <div className="text-xl font-bold text-[#258568] mt-1">{parsed.rows.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Строк с ошибками</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{parsed.issueCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Повторов ID в файлах</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{parsed.duplicateIds}</div>
            </div>
          </div>

          {/* Each file with its own result */}
          <div className="space-y-3">
            {parsed.files.map((file) => {
              const bad = file.issues.length > 0 || file.missingColumns.length > 0 || !!file.blockedReason;
              return (
                <div key={file.name} className={`rounded-lg border text-xs ${bad ? 'border-[#FCA5A5]' : 'border-[#E2DED5]'}`}>
                  <div className="p-2.5 flex items-center justify-between gap-3 bg-[#FAF9F6] rounded-t-lg">
                    <span className="font-mono font-bold text-[#171717] truncate">{file.name}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className={bad ? 'text-[#9F2F28] font-semibold' : 'text-[#258568] font-semibold'}>
                        {bad ? `ошибок: ${file.issues.length + file.missingColumns.length}` : `без ошибок · ${file.rows} вопр.`}
                      </span>
                      {bad && parsed.files.length > 1 && (
                        <button
                          type="button"
                          onClick={() => dropAndRecheck(file.name)}
                          className="underline underline-offset-2 text-[#78716C] hover:text-[#171717] cursor-pointer"
                        >
                          Убрать файл
                        </button>
                      )}
                    </span>
                  </div>
                  {file.missingColumns.length > 0 && (
                    <div className="p-2.5 text-[#9F2F28]">
                      Нет обязательных колонок: <span className="font-mono">{file.missingColumns.join(', ')}</span>
                    </div>
                  )}
                  {file.issues.length > 0 && (
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-[#E2DED5]">
                      {file.issues.map((issue, i) => (
                        <div key={`${issue.line}-${i}`} className="p-2.5">
                          <span className="font-mono font-bold text-[#171717]">Строка {issue.line}:</span>{' '}
                          <span className="text-[#5C574F]">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-[#E2DED5] pt-4">
            <h3 className="text-xs font-bold text-[#171717] uppercase tracking-wider">Проверка на сервере</h3>
            {checking && <p className="text-xs text-[#78716C]">Проверяю дубли, ID и источники…</p>}
            <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
            {report && (
              <>
                <p className="text-xs text-[#5C574F]">
                  Без ошибок: <b>{report.valid}</b> из {sent.length}. Ошибок: <b>{report.errors.length}</b>, предупреждений:{' '}
                  <b>{report.warnings.length}</b>.
                </p>
                {report.errors.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-[#E2DED5] border border-[#FCA5A5] rounded-lg text-xs">
                    {report.errors.map((e, i) => (
                      <div key={`e${i}`} className="p-2.5">
                        <span className="font-mono font-bold text-[#9F2F28]">{placeOf(e.row)}:</span>{' '}
                        <span className="text-[#5C574F]">{e.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {report.warnings.length > 0 && (
                  <div className="max-h-[160px] overflow-y-auto divide-y divide-[#E2DED5] border border-[#D89B35]/40 rounded-lg text-xs">
                    {report.warnings.map((w, i) => (
                      <div key={`w${i}`} className="p-2.5">
                        <span className="font-mono font-bold text-[#9A6715]">{placeOf(w.row)}:</span>{' '}
                        <span className="text-[#5C574F]">{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <label className="flex items-center gap-2 text-xs text-[#5C574F] pt-1 cursor-pointer">
              <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
              Перемешать варианты ответов (вопросы с keep_order остаются как есть)
            </label>
            {!canImport && !checking && (
              <p className="text-[11px] text-[#78716C]">
                Импорт откроется, когда ни в одном файле не останется ошибок: выбранные файлы принимаются целиком или не принимаются. Файл с ошибками можно
                убрать и импортировать остальные.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E2DED5]">
            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE]"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canImport}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Перейти к предпросмотру <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && parsed && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-3xl mx-auto space-y-5">
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            Предпросмотр строк, которые пойдут в банк (всего {parsed.rows.length}
            {parsed.files.length > 1 ? `, файлов: ${parsed.files.length}` : ''})
          </h2>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {parsed.rows.map((row) => (
              <div key={`${row.file}:${row.line}`} className="p-3.5 rounded-lg border border-[#E2DED5] bg-[#FAF9F6] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#FF5A36]">
                    {row.externalId ?? `строка ${row.line}`}
                    {parsed.files.length > 1 && <span className="ml-2 font-normal text-[#78716C]">{row.file}</span>}
                  </span>
                  <span className="text-[10px] uppercase bg-white border border-[#E2DED5] px-2 py-0.5 rounded text-[#78716C]">
                    {row.subjectCode} • {row.difficulty}
                  </span>
                </div>
                <p className="font-semibold text-[#171717]">{row.textRu}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5C574F]">
                  {row.options.map((option) => (
                    <span
                      key={option.label}
                      className={option.label === row.correctLabel ? 'font-bold text-[#258568]' : ''}
                    >
                      {option.label}: {option.textRu}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-[#78716C]">Источник: {row.source || '—'}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-lg text-xs text-[#9A6715] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Вопросы попадут в банк в статусе «Черновик». Дальше их проверяет методист.</span>
          </div>

          <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

          <div className="flex items-center justify-between pt-4 border-t border-[#E2DED5]">
            <button
              onClick={() => setStep(2)}
              className="px-3.5 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE]"
            >
              Назад
            </button>
            <button
              onClick={() => void handleImport()}
              disabled={importing || !canImport}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
            >
              {importing ? 'Импорт…' : 'Импортировать в банк'} <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done. Reached only when the server has accepted the rows. */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EBF7F2] text-[#258568] flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#171717]">Импорт выполнен</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            В банк добавлено {parsed?.rows.length ?? 0} вопросов в статусе «Черновик»
            {parsed && parsed.files.length > 1 ? ` из файлов: ${parsed.files.length}` : ''}.
          </p>
          <div className="pt-2">
            <button
              onClick={onDone}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#333] rounded-md cursor-pointer"
            >
              Перейти в банк вопросов
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
