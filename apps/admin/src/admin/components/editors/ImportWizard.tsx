import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  ArrowLeft,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { mockDb } from '../../repositories/mockDatabase';
import { adminService } from '../../services/adminService';

interface ImportWizardProps {
  onDone: () => void;
  onCancel: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onDone, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('ent_questions_batch_sample.csv');
  const [fileContent, setFileContent] = useState<string>(`ID,Subject,Type,Difficulty,QuestionTextRu,OptionA,OptionB,OptionC,OptionD,CorrectOption,ExplanationRu
qst-imp-1,hist-kz,single_choice,medium,"В каком году была принята действующая Конституция РК?","1991","1993","1995","1997","C","Действующая Конституция Республики Казахстан была принята на общенациональном референдуме 30 августа 1995 года."
qst-imp-2,math-lit,single_choice,easy,"Периметр квадрата равен 36 см. Чему равна его площадь?","64 см²","81 см²","72 см²","100 см²","B","Сторона квадрата = 36 / 4 = 9 см. Площадь = 9 * 9 = 81 см²."
qst-imp-3,hist-kz,single_choice,medium,"Кто возглавил восстание 1783–1797 годов в Младшем жузе?","Сырым Датулы","Исатай Тайманов","Махамбет Утемисов","Жанкожа Нурмухамедов","A","Национально-освободительное восстание казахов Младшего жуза возглавил батыр Сырым Датулы."`);

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(3);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const handleSimulateUpload = () => {
    // Parse CSV lines
    const lines = fileContent.trim().split('\n');
    const rows = lines.slice(1).map((line, idx) => {
      // simple csv split handling quotes
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
      return {
        id: parts[0] || `imp-${idx + 1}`,
        subject: parts[1] || 'history_kz',
        type: parts[2] || 'single_choice',
        difficulty: parts[3] || 'medium',
        textRu: parts[4] || '',
        optionA: parts[5] || '',
        optionB: parts[6] || '',
        optionC: parts[7] || '',
        optionD: parts[8] || '',
        correct: parts[9] || 'A',
        explanation: parts[10] || '',
      };
    });

    setParsedRows(rows);
    setValidCount(rows.length);
    setStep(2);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `ID,Subject,Type,Difficulty,QuestionTextRu,OptionA,OptionB,OptionC,OptionD,CorrectOption,ExplanationRu
qst-sample-01,hist-kz,single_choice,medium,"Вопрос на русском языке...","Вариант 1","Вариант 2","Вариант 3","Вариант 4","A","Педагогическое пояснение..."`;
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'qazmind_ent_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinishImport = () => {
    // Convert parsed rows to QuestionItems with draft status
    const createdQuestions: QuestionItem[] = parsedRows.map((r) => ({
      id: r.id || `qst-${Date.now().toString(36)}`,
      subjectId: r.subject,
      sectionName: 'Импортированные задания ЕНТ',
      topicId: 'top-hkz-4',
      type: 'single_choice',
      language: 'ru',
      difficulty: r.difficulty as any,
      status: 'draft',
      points: 1,
      textRu: r.textRu,
      textKz: '',
      options: [
        { id: 'opt-a', textRu: r.optionA, textKz: '', isCorrect: r.correct === 'A' },
        { id: 'opt-b', textRu: r.optionB, textKz: '', isCorrect: r.correct === 'B' },
        { id: 'opt-c', textRu: r.optionC, textKz: '', isCorrect: r.correct === 'C' },
        { id: 'opt-d', textRu: r.optionD, textKz: '', isCorrect: r.correct === 'D' },
      ],
      correctOptionIds: [r.correct === 'A' ? 'opt-a' : r.correct === 'B' ? 'opt-b' : r.correct === 'C' ? 'opt-c' : 'opt-d'],
      explanationRu: r.explanation,
      explanationKz: '',
      tags: ['Импорт CSV', 'ЕНТ'],
      author: `${mockDb.currentAdminName} (Batch Import)`,
      version: 1,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    }));

    adminService.importQuestions(createdQuestions);
    setStep(4);
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
              Загрузка пакета заданий, сопоставление колонок, проверка на дубликаты и сохранение в черновики.
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
          <span>Валидация</span>
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
          <div className="border-2 border-dashed border-[#D5D0C5] rounded-xl p-8 text-center bg-[#FAF9F6] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFF7F5] flex items-center justify-center mx-auto text-[#FF5A36]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#171717]">Перетащите файл CSV или нажмите для выбора</p>
              <p className="text-xs text-[#78716C] mt-1">Поддерживается кодировка UTF-8, разделитель запятая</p>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1.5 rounded-md bg-white border border-[#E2DED5] text-xs font-mono text-[#5C574F]">
                {fileName}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#78716C] block mb-1">
              Предпросмотр содержимого CSV:
            </label>
            <textarea
              rows={5}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full text-xs font-mono p-2.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md text-[#171717]"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSimulateUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Распознать строки <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-2xl mx-auto space-y-5">
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            Результаты проверки структуры файла
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-[#EBF7F2] border border-[#258568]/20">
              <div className="text-xs text-[#1D6A53]">Корректных строк</div>
              <div className="text-xl font-bold text-[#258568] mt-1">{validCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Дубликатов найдено</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{duplicateCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DED5]">
              <div className="text-xs text-[#78716C]">Ошибок парсинга</div>
              <div className="text-xl font-bold text-[#171717] mt-1">{errorCount}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E2DED5] text-xs text-[#5C574F] space-y-1">
            <p className="font-semibold text-[#171717]">Колонки успешно сопоставлены:</p>
            <p>• ID вопроса, Предмет, Сложность, Текст задания, 4 варианта ответов, Ключ верного ответа, Пояснение.</p>
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
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Перейти к предпросмотру <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 max-w-3xl mx-auto space-y-5">
          <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
            Предпросмотр импортируемых вопросов (всего {parsedRows.length})
          </h2>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {parsedRows.map((row, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-[#E2DED5] bg-[#FAF9F6] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#FF5A36]">{row.id}</span>
                  <span className="text-[10px] uppercase bg-white border border-[#E2DED5] px-2 py-0.5 rounded text-[#78716C]">
                    {row.subject}
                  </span>
                </div>
                <p className="font-semibold text-[#171717]">{row.textRu}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5C574F]">
                  <span className={row.correct === 'A' ? 'font-bold text-[#258568]' : ''}>A: {row.optionA}</span>
                  <span className={row.correct === 'B' ? 'font-bold text-[#258568]' : ''}>B: {row.optionB}</span>
                  <span className={row.correct === 'C' ? 'font-bold text-[#258568]' : ''}>C: {row.optionC}</span>
                  <span className={row.correct === 'D' ? 'font-bold text-[#258568]' : ''}>D: {row.optionD}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#FEF7EA] border border-[#D89B35]/30 rounded-lg text-xs text-[#9A6715] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Вопросы будут импортированы в статусе «Черновик» для прохождения методической модерации.</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E2DED5]">
            <button
              onClick={() => setStep(2)}
              className="px-3.5 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE]"
            >
              Назад
            </button>
            <button
              onClick={handleFinishImport}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#258568] hover:bg-[#1D6A53] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Импортировать в базу <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-[#E2DED5] p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EBF7F2] text-[#258568] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#171717]">Импорт успешно завершен!</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            В банк заданий добавлено {parsedRows.length} новых вопросов. Создано событие в журнале аудита администратора.
          </p>
          <div className="pt-2">
            <button
              onClick={onDone}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#333] rounded-md cursor-pointer"
            >
              Перейти в Банк вопросов
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
