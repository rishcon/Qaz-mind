import type { Difficulty, ImportedQuestionRow, OptionLabel, QuestionCsvIssue, QuestionCsvResult } from './questionCsv';

/**
 * Reads a question file in the QazMind JSON format: a list of questions, an object {"questions": [...]}, or one
 * question per line (JSONL). Each question is checked on its own and nothing is filled in for a missing value.
 * The server repeats the checks and adds the ones that need the database (duplicates, taken IDs).
 */

const LABELS: readonly OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
const DIFFICULTIES: readonly string[] = ['easy', 'medium', 'hard'];

type Raw = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Splits file text into raw records, each with its number in the file (the first record is 1). */
function readRecords(source: string): { records: Array<{ line: number; value: unknown }>; error: string | null } {
  const body = source.replace(/^﻿/, '').trim();
  if (!body) return { records: [], error: 'Файл пуст.' };

  try {
    const parsed: unknown = JSON.parse(body);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as Raw).questions)
        ? ((parsed as Raw).questions as unknown[])
        : null;
    if (!list) return { records: [], error: 'Ожидается список вопросов или объект {"questions": [...]}.' };
    return { records: list.map((value, index) => ({ line: index + 1, value })), error: null };
  } catch {
    // Not a single JSON document: try one JSON object per line.
  }

  const records: Array<{ line: number; value: unknown }> = [];
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    try {
      records.push({ line: records.length + 1, value: JSON.parse(lines[i]) });
    } catch {
      return { records: [], error: `Файл не является корректным JSON. Строка ${i + 1} не читается как JSON.` };
    }
  }
  return { records, error: null };
}

export function parseQuestionJson(source: string, knownSubjectCodes: readonly string[]): QuestionCsvResult {
  const empty: QuestionCsvResult = { blockedReason: null, missingColumns: [], rows: [], issues: [], duplicateIds: 0 };
  const { records, error } = readRecords(source);
  if (error) return { ...empty, blockedReason: error };

  const knownCodes = new Set(knownSubjectCodes.map((c) => c.trim().toLowerCase()).filter(Boolean));
  if (knownCodes.size === 0) {
    return { ...empty, blockedReason: 'Справочник предметов не загружен: предмет проверить нельзя, поэтому импорт недоступен.' };
  }

  const rows: ImportedQuestionRow[] = [];
  const issues: QuestionCsvIssue[] = [];
  const seenIds = new Set<string>();
  let duplicateIds = 0;

  for (const { line, value } of records) {
    const problems: string[] = [];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      issues.push({ line, message: 'вопрос должен быть объектом' });
      continue;
    }
    const q = value as Raw;

    const subjectCode = text(q.subject);
    const difficulty = text(q.difficulty).toLowerCase();
    const textRu = text(q.text_ru);
    const correct = text(q.correct).toUpperCase();
    const externalId = text(q.external_id) || null;
    const points = typeof q.points === 'number' ? q.points : 1;

    if (!subjectCode) problems.push('не указан предмет (subject)');
    else if (!knownCodes.has(subjectCode.toLowerCase())) problems.push(`предмет «${subjectCode}» не найден в справочнике`);
    if (!DIFFICULTIES.includes(difficulty)) problems.push('difficulty: easy, medium или hard');
    if (!textRu) problems.push('не заполнен text_ru');
    if (!Number.isInteger(points) || points < 1 || points > 5) problems.push('points: целое число от 1 до 5');

    const rawOptions = Array.isArray(q.options) ? q.options : [];
    if (rawOptions.length < 2 || rawOptions.length > 5) problems.push('options: от 2 до 5 вариантов');
    const options = rawOptions.slice(0, 5).map((option, index) => {
      const o = (option && typeof option === 'object' ? option : {}) as Raw;
      return { label: LABELS[index], textRu: text(o.ru), textKz: text(o.kz) };
    });
    options.forEach((o) => {
      if (!o.textRu) problems.push(`у варианта ${o.label} нет ru`);
    });
    if (!LABELS.slice(0, options.length).includes(correct as OptionLabel)) {
      problems.push(`correct: одна из букв ${LABELS.slice(0, Math.max(options.length, 2)).join(', ')}`);
    }

    if (externalId) {
      if (seenIds.has(externalId)) {
        duplicateIds += 1;
        problems.push(`external_id «${externalId}» повторяется в файле`);
      } else {
        seenIds.add(externalId);
      }
    }

    if (problems.length > 0) {
      issues.push({ line, message: problems.join('; ') });
      continue;
    }
    rows.push({
      line,
      externalId,
      subjectCode,
      difficulty: difficulty as Difficulty,
      textRu,
      textKz: text(q.text_kz),
      options,
      correctLabel: correct as OptionLabel,
      explanationRu: text(q.explanation_ru),
      explanationKz: text(q.explanation_kz),
      source: text(q.source),
      points,
      keepOrder: q.keep_order === true,
    });
  }
  return { blockedReason: null, missingColumns: [], rows, issues, duplicateIds };
}

/**
 * Shuffles the options of a question and moves the answer key with the option, so answer positions in the bank do
 * not follow the order the author wrote them in. A question marked keep_order is returned unchanged.
 */
export function shuffleOptions(row: ImportedQuestionRow, random: () => number = Math.random): ImportedQuestionRow {
  if (row.keepOrder || row.options.length < 2) return row;
  const correctIndex = LABELS.indexOf(row.correctLabel);
  const order = row.options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...row,
    options: order.map((from, position) => ({ ...row.options[from], label: LABELS[position] })),
    correctLabel: LABELS[order.indexOf(correctIndex)],
  };
}

/** The example file offered for download. The same content lives in docs/examples/questions.import.example.json. */
export const QUESTION_JSON_EXAMPLE = {
  format: 'qazmind.questions.v1',
  questions: [
    {
      external_id: 'EXAMPLE-001',
      subject: 'history_kz',
      difficulty: 'easy',
      points: 1,
      text_ru: 'Какой город является столицей Республики Казахстан?',
      text_kz: 'Қазақстан Республикасының астанасы қай қала?',
      options: [
        { ru: 'Алматы', kz: 'Алматы' },
        { ru: 'Астана', kz: 'Астана' },
        { ru: 'Шымкент', kz: 'Шымкент' },
        { ru: 'Караганда', kz: 'Қарағанды' },
      ],
      correct: 'B',
      explanation_ru: 'Столица Казахстана — Астана.',
      explanation_kz: 'Қазақстанның астанасы — Астана.',
      source: 'ПРИМЕР формата. Не загружать.',
      keep_order: false,
    },
    {
      external_id: 'EXAMPLE-002',
      subject: 'physics',
      difficulty: 'easy',
      points: 1,
      text_ru: 'В каких единицах в СИ измеряется сила?',
      text_kz: 'СИ жүйесінде күш қандай бірлікпен өлшенеді?',
      options: [
        { ru: 'Джоуль', kz: 'Джоуль' },
        { ru: 'Ньютон', kz: 'Ньютон' },
        { ru: 'Ватт', kz: 'Ватт' },
        { ru: 'Паскаль', kz: 'Паскаль' },
      ],
      correct: 'B',
      explanation_ru: 'Сила измеряется в ньютонах (Н).',
      explanation_kz: 'Күш ньютонмен (Н) өлшенеді.',
      source: 'ПРИМЕР формата. Не загружать.',
      keep_order: false,
    },
    {
      external_id: 'EXAMPLE-003',
      subject: 'chemistry',
      difficulty: 'medium',
      points: 1,
      text_ru: 'Какая из формул соответствует воде?',
      text_kz: 'Төмендегі формулалардың қайсысы суға сәйкес келеді?',
      options: [
        { ru: 'CO2', kz: 'CO2' },
        { ru: 'NaCl', kz: 'NaCl' },
        { ru: 'H2O', kz: 'H2O' },
        { ru: 'Ни одна из перечисленных', kz: 'Аталғандардың ешқайсысы емес' },
      ],
      correct: 'C',
      explanation_ru: 'Молекула воды состоит из двух атомов водорода и одного атома кислорода.',
      explanation_kz: 'Су молекуласы екі сутек және бір оттек атомынан тұрады.',
      source: 'ПРИМЕР формата. Не загружать.',
      keep_order: true,
    },
  ],
} as const;
