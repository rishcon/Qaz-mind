import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestionCsv, splitCsv } from './questionCsv';

const HEADER = 'ID,Subject,Type,Difficulty,QuestionTextRu,OptionA,OptionB,OptionC,OptionD,CorrectOption,ExplanationRu';
const GOOD_ROW = 'q-1,HIST,single_choice,medium,"В каком году образовано ханство?",1450,1465,1500,1600,B,"Ханство образовано в 1465 году."';

test('splitCsv keeps quoted commas, doubled quotes and line breaks inside fields', () => {
  const records = splitCsv('a,"b, c","say ""hi""","line\nbreak"\n');
  assert.deepEqual(records, [['a', 'b, c', 'say "hi"', 'line\nbreak']]);
});

test('a row with every field filled is accepted and keeps its line number', () => {
  const result = parseQuestionCsv(`${HEADER}\n${GOOD_ROW}\n`, ['HIST']);
  assert.equal(result.blockedReason, null);
  assert.equal(result.issues.length, 0);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].line, 2);
  assert.equal(result.rows[0].correctLabel, 'B');
  assert.equal(result.rows[0].options.length, 4);
});

test('nothing is defaulted: a missing difficulty or answer key rejects the row with its line', () => {
  const noDifficulty = 'q-2,HIST,single_choice,,"Текст","a","b","c","d",A,""';
  const noKey = 'q-3,HIST,single_choice,easy,"Текст","a","b","c","d",,""';
  const result = parseQuestionCsv(`${HEADER}\n${noDifficulty}\n${noKey}\n`, ['HIST']);
  assert.equal(result.rows.length, 0);
  assert.deepEqual(
    result.issues.map((issue) => issue.line),
    [2, 3]
  );
  assert.match(result.issues[0].message, /сложность/);
  assert.match(result.issues[1].message, /правильный ответ/);
});

test('an empty subject reference list blocks the import instead of accepting unchecked subjects', () => {
  const result = parseQuestionCsv(`${HEADER}\n${GOOD_ROW}\n`, []);
  assert.ok(result.blockedReason);
  assert.equal(result.rows.length, 0);
});

test('a subject outside the reference list is rejected', () => {
  const result = parseQuestionCsv(`${HEADER}\n${GOOD_ROW}\n`, ['MATH']);
  assert.equal(result.rows.length, 0);
  assert.match(result.issues[0].message, /не найден в справочнике/);
});

test('a repeated ID is counted and reported, and the first occurrence is kept', () => {
  const result = parseQuestionCsv(`${HEADER}\n${GOOD_ROW}\n${GOOD_ROW}\n`, ['HIST']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.duplicateIds, 1);
  assert.equal(result.issues[0].line, 3);
});

test('missing required columns are listed and no row is read', () => {
  const result = parseQuestionCsv('ID,Subject,QuestionTextRu\nq-1,HIST,Текст\n', ['HIST']);
  assert.ok(result.missingColumns.includes('CorrectOption'));
  assert.equal(result.rows.length, 0);
  assert.equal(result.issues.length, 0);
});

test('an empty file has no header and is blocked', () => {
  const result = parseQuestionCsv('', ['HIST']);
  assert.ok(result.blockedReason);
  assert.equal(result.rows.length, 0);
});
