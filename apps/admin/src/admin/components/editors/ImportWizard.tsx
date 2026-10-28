import React, { useState } from 'react';
import { Upload, AlertTriangle, ArrowRight, ArrowLeft, Download, Check } from 'lucide-react';
import { adminApi, errorText, ImportReport, QuestionBody } from '../../api/client';
import { useAdminData } from '../../api/useAdminData';
import { ActionResultNotice, type ActionResult } from '../ui/ConnectionNotice';
import { parseQuestionCsv, QUESTION_CSV_HEADER, type ImportedQuestionRow, type QuestionCsvResult } from '../../utils/questionCsv';
import { parseQuestionJson, QUESTION_JSON_EXAMPLE, shuffleOptions } from '../../utils/questionJson';

/** The server takes at most this many questions per request. */
const MAX_ROWS = 500;

interface ImportWizardProps {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Bulk import of questions from a CSV in the template layout. Each row is checked here. A row that fails a check
 * is listed with its line number and is never imported with a guessed value.
 */
export const ImportWizard: React.FC<ImportWizardProps> = ({ onDone, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<QuestionCsvResult | null>(null);
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
  const [sent, setSent] = useState<ImportedQuestionRow[]>([]);

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

  /** The file position of a row the server reported, from its position among the rows that were sent. */
  const lineOf = (serverRow: number): number => sent[serverRow - 1]?.line ?? serverRow;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsvText(await file.text());
    setResult(null);
  };

  const handleCheck = async () => {
    const isJson = /^[\s\uFEFF]*[[{]/.test(csvText);
    const next = isJson ? parseQuestionJson(csvText, knownSubjectCodes) : parseQuestionCsv(csvText, knownSubjectCodes);
    if (next.rows.length > MAX_ROWS) {
      next.blockedReason = `В файле ${next.rows.length} вопросов, за один раз можно не больше ${MAX_ROWS}. Разделите файл на части.`;
      next.rows = [];
    }
    setParsed(next);
    setReport(null);
    setResult(null);
    setSent(next.rows);
    setStep(2);
    if (next.rows.length === 0) return;
    setChecking(true);
    try {
      setReport(await adminApi.checkQuestionImport(next.rows.map(toBody)));
    } catch (error) {
      setResult({ tone: 'error', text: errorText(error) });
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
      setResult({ tone: 'error', text: errorText(error) });
    } finally {
      setImporting(false);
    }
  };

  // Import opens only when neither the page nor the server found an error: a file is accepted whole or not at all.
  const canImport =
    !!parsed && parsed.issues.length === 0 && parsed.rows.length > 0 && !!report && report.errors.length === 0 && !checking;

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
              Загрузка файла, проверка каждой строки на странице и на сервере, отправка в банк как черновики. Пустые поля не заполняются автоматически.
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
              <p className="text-sm font-bold text-[#171717]">Выберите файл JSON, JSONL или CSV</p>
              <p className="text-xs text-[#78716C] mt-1">Кодировка UTF-8. Формат определяется по содержимому</p>
            </div>
            <input
              type="file"
              accept=".json,.jsonl,.csv,application/json,text/csv"
              onChange={handleFileChange}
              className="block mx-auto text-xs text-[#5C574F]"
            />
            {fileName && <p className="text-xs font-mono text-[#5C574F]">{fileName}</p>}
          </label>

          <div>
            <label className="text-xs font-medium text-[#78716C] block mb-1">
              Содержимое файла (можно вставить вручную):
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'{"format": "qazmind.questions.v1", "questions": [ … ]}'}
              className="w-full text-xs font-mono p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717]"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void handleCheck()}
              disabled={!csvText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Проверить файл <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 2 && parsed && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-2xl mx-auto space-y-5">
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            Результаты проверки файла
          </h2>

          {parsed.blockedReason && (
            <div className="p-3.5 rounded-lg bg-[#FEF7EA] border border-[#D89B35]/30 text-xs text-[#9A6715] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              <span>{parsed.blockedReason}</span>
            </div>
          )}

          {parsed.missingColumns.length > 0 && (
            <div className="p-3.5 rounded-lg bg-[#FFF1F2] border border-[#FCA5A5] text-xs text-[#9F2F28] space-y-1">
              <p className="font-semibold">В файле нет обязательных колонок:</p>
              <p className="font-mono">{parsed.missingColumns.join(', ')}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-[#EBF7F2] border border-[#258568]/20">
              <div className="text-xs text-[#1D6A53]">Корректных строк</div>
              <div className="text-xl font-bold text-[#258568] mt-1">{parsed.rows.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Строк с ошибками</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{parsed.issues.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Повторов ID в файле</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{parsed.duplicateIds}</div>
            </div>
          </div>

          {parsed.issues.length > 0 && (
            <div className="max-h-[240px] overflow-y-auto divide-y divide-[#E2DED5] border border-[#E2DED5] rounded-lg text-xs">
              {parsed.issues.map((issue) => (
                <div key={issue.line} className="p-2.5">
                  <span className="font-mono font-bold text-[#171717]">Строка {issue.line}:</span>{' '}
                  <span className="text-[#5C574F]">{issue.message}</span>
                </div>
              ))}
            </div>
          )}

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
                        <span className="font-mono font-bold text-[#9F2F28]">№ {lineOf(e.row)}:</span>{' '}
                        <span className="text-[#5C574F]">{e.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {report.warnings.length > 0 && (
                  <div className="max-h-[160px] overflow-y-auto divide-y divide-[#E2DED5] border border-[#D89B35]/40 rounded-lg text-xs">
                    {report.warnings.map((w, i) => (
                      <div key={`w${i}`} className="p-2.5">
                        <span className="font-mono font-bold text-[#9A6715]">№ {lineOf(w.row)}:</span>{' '}
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
                Импорт откроется, когда в файле не останется ошибок: файл принимается целиком или не принимается.
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
            Предпросмотр строк, которые пойдут в банк (всего {parsed.rows.length})
          </h2>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {parsed.rows.map((row) => (
              <div key={row.line} className="p-3.5 rounded-lg border border-[#E2DED5] bg-[#FAF9F6] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#FF5A36]">
                    {row.externalId ?? `строка ${row.line}`}
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
            В банк добавлено {parsed?.rows.length ?? 0} вопросов в статусе «Черновик».
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
