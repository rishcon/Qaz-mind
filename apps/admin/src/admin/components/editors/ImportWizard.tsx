import React, { useState } from 'react';
import { Upload, AlertTriangle, ArrowRight, ArrowLeft, Download, Check } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ActionResultNotice, failureResult, type ActionResult } from '../ui/ConnectionNotice';
import { parseQuestionCsv, QUESTION_CSV_HEADER, type QuestionCsvResult } from '../../utils/questionCsv';

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

  // Subject codes and IDs from the reference list. While the list is not loaded, the import is blocked.
  const knownSubjectCodes = adminService.getSubjects().flatMap((subject) => [subject.code, subject.id]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsvText(await file.text());
    setResult(null);
  };

  const handleCheck = () => {
    setParsed(parseQuestionCsv(csvText, knownSubjectCodes));
    setResult(null);
    setStep(2);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([`${QUESTION_CSV_HEADER.join(',')}\n`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'qazmind_ent_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // A refused import keeps the preview on screen; the step changes only when the server accepts the rows.
  const handleImport = () => {
    if (!parsed || parsed.rows.length === 0) return;
    try {
      adminService.importQuestions(parsed.rows);
      setStep(4);
    } catch (error) {
      setResult(failureResult(error));
    }
  };

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
              Массовый импорт вопросов ЕНТ (CSV / Таблицы)
            </h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              Загрузка CSV по шаблону, проверка каждой строки и отправка в банк как черновики. Пустые поля не заполняются автоматически.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[#FF5A36]" /> Скачать шаблон CSV
        </button>
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
              <p className="text-sm font-bold text-[#171717]">Выберите файл CSV по шаблону</p>
              <p className="text-xs text-[#78716C] mt-1">Кодировка UTF-8, разделитель запятая</p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
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
              placeholder={QUESTION_CSV_HEADER.join(',')}
              className="w-full text-xs font-mono p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717]"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!csvText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Проверить строки <ArrowRight className="w-4 h-4" />
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

          <p className="text-[11px] text-[#78716C]">
            Совпадения с уже существующими вопросами банка проверяются на сервере при импорте.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-[#E2DED5]">
            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE]"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={parsed.rows.length === 0}
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
              onClick={handleImport}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Импортировать в банк <Check className="w-4 h-4" />
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
