/**
 * Reads a question CSV in the import template layout. Every row is checked on its own. Nothing is filled in for a
 * missing value: an empty or unknown field makes the row invalid, and the row is reported with its line number.
 */

export const QUESTION_CSV_HEADER = [
  'ID',
  'Subject',
  'Type',
  'Difficulty',
  'QuestionTextRu',
  'OptionA',
  'OptionB',
  'OptionC',
  'OptionD',
  'CorrectOption',
  'ExplanationRu',
  'QuestionTextKz',
  'OptionAKz',
  'OptionBKz',
  'OptionCKz',
  'OptionDKz',
  'ExplanationKz',
  'Source',
] as const;

const REQUIRED_COLUMNS = [
  'Subject',
  'Difficulty',
  'QuestionTextRu',
  'OptionA',
  'OptionB',
  'OptionC',
  'OptionD',
  'CorrectOption',
] as const;

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
const CSV_LABELS = ['A', 'B', 'C', 'D'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type OptionLabel = (typeof LABELS)[number];

export interface ImportedQuestionRow {
  /** Record number in the file, with the header as record 1. */
  line: number;
  externalId: string | null;
  subjectCode: string;
  difficulty: Difficulty;
  textRu: string;
  textKz: string;
  options: Array<{ label: OptionLabel; textRu: string; textKz: string }>;
  correctLabel: OptionLabel;
  explanationRu: string;
  explanationKz: string;
  /** Where the question comes from. The server refuses an import row without it. */
  source: string;
  points: number;
  /** The file asks to keep the options in the written order, so they are not shuffled on import. */
  keepOrder: boolean;
}

export interface QuestionCsvIssue {
  line: number;
  message: string;
}

export interface QuestionCsvResult {
  /** Why nothing can be imported yet, for example when the subject reference list is not loaded. */
  blockedReason: string | null;
  /** Required columns the header does not contain. When any is missing, no row is read. */
  missingColumns: string[];
  /** Rows that passed every check. Empty while the import is blocked. */
  rows: ImportedQuestionRow[];
  issues: QuestionCsvIssue[];
  /** Rows whose ID repeats an earlier row in the same file. */
  duplicateIds: number;
}

/** Splits CSV text into records. Supports quoted fields, doubled quotes and line breaks inside quotes. */
export function splitCsv(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

export function parseQuestionCsv(text: string, knownSubjectCodes: readonly string[]): QuestionCsvResult {
  const emptyResult: QuestionCsvResult = { blockedReason: null, missingColumns: [], rows: [], issues: [], duplicateIds: 0 };
  const records = splitCsv(text.replace(/^﻿/, ''));
  if (records.length === 0) {
    return { ...emptyResult, blockedReason: 'Файл пуст: нет строки заголовка.' };
  }

  const header = records[0].map((name) => name.trim().toLowerCase());
  const columnIndex = (name: string) => header.indexOf(name.toLowerCase());
  const missingColumns: string[] = REQUIRED_COLUMNS.filter((name) => columnIndex(name) === -1);
  if (missingColumns.length > 0) {
    return { ...emptyResult, missingColumns };
  }

  const knownCodes = new Set(knownSubjectCodes.map((code) => code.trim().toLowerCase()).filter(Boolean));
  const subjectsKnown = knownCodes.size > 0;
  const cell = (record: string[], name: string) => (record[columnIndex(name)] ?? '').trim();

  const issues: QuestionCsvIssue[] = [];
  const rows: ImportedQuestionRow[] = [];
  const seenIds = new Set<string>();
  let duplicateIds = 0;

  records.slice(1).forEach((record, index) => {
    const line = index + 2;
    const problems: string[] = [];

    const subjectCode = cell(record, 'Subject');
    const type = cell(record, 'Type');
    const difficulty = cell(record, 'Difficulty').toLowerCase();
    const textRu = cell(record, 'QuestionTextRu');
    const options = CSV_LABELS.map((label) => ({
      label,
      textRu: cell(record, `Option${label}`),
      textKz: cell(record, `Option${label}Kz`),
    }));
    const correct = cell(record, 'CorrectOption').toUpperCase();
    const externalId = cell(record, 'ID') || null;
    const explanationRu = cell(record, 'ExplanationRu');

    if (!subjectCode) {
      problems.push('не указан предмет');
    } else if (subjectsKnown && !knownCodes.has(subjectCode.toLowerCase())) {
      problems.push(`предмет «${subjectCode}» не найден в справочнике`);
    }
    if (type && type !== 'single_choice') problems.push('поддерживается только тип single_choice');
    if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) problems.push('сложность: easy, medium или hard');
    if (!textRu) problems.push('не заполнен текст вопроса');
    for (const option of options) {
      if (!option.textRu) problems.push(`не заполнен вариант ${option.label}`);
    }
    if (!(CSV_LABELS as readonly string[]).includes(correct)) problems.push('правильный ответ: A, B, C или D');
    if (externalId) {
      if (seenIds.has(externalId)) {
        duplicateIds += 1;
        problems.push(`ID «${externalId}» повторяется в файле`);
      } else {
        seenIds.add(externalId);
      }
    }

    if (problems.length > 0) {
      issues.push({ line, message: problems.join('; ') });
      return;
    }
    rows.push({
      line,
      externalId,
      subjectCode,
      difficulty: difficulty as Difficulty,
      textRu,
      options,
      correctLabel: correct as OptionLabel,
      explanationRu,
      textKz: cell(record, 'QuestionTextKz'),
      explanationKz: cell(record, 'ExplanationKz'),
      source: cell(record, 'Source'),
      points: 1,
      keepOrder: false,
    });
  });

  if (!subjectsKnown) {
    return {
      blockedReason: 'Справочник предметов не загружен: колонку Subject проверить нельзя, поэтому импорт недоступен.',
      missingColumns: [],
      rows: [],
      issues,
      duplicateIds,
    };
  }
  return { blockedReason: null, missingColumns: [], rows, issues, duplicateIds };
}
