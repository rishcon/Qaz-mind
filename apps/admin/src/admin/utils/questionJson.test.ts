import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseQuestionJson, QUESTION_JSON_EXAMPLE, shuffleOptions } from './questionJson';

const SUBJECTS = ['history_kz', 'physics', 'chemistry'];

test('the example file is readable: three questions, all kept', () => {
  const result = parseQuestionJson(JSON.stringify(QUESTION_JSON_EXAMPLE), SUBJECTS);
  assert.equal(result.blockedReason, null);
  assert.equal(result.issues.length, 0);
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[2].keepOrder, true);
  assert.equal(result.rows[0].options[1].textKz, 'Астана');
});

test('a plain list and one question per line read the same as the object form', () => {
  const list = JSON.stringify(QUESTION_JSON_EXAMPLE.questions);
  const lines = QUESTION_JSON_EXAMPLE.questions.map((q) => JSON.stringify(q)).join('\n');
  assert.equal(parseQuestionJson(list, SUBJECTS).rows.length, 3);
  assert.equal(parseQuestionJson(lines, SUBJECTS).rows.length, 3);
});

test('a broken question is reported with its number and the others are kept', () => {
  const bad = { ...QUESTION_JSON_EXAMPLE.questions[0], external_id: 'x-2', correct: 'F', difficulty: 'hardest' };
  const result = parseQuestionJson(JSON.stringify([QUESTION_JSON_EXAMPLE.questions[0], bad]), SUBJECTS);
  assert.equal(result.rows.length, 1);
  assert.equal(result.issues[0].line, 2);
  assert.match(result.issues[0].message, /difficulty/);
  assert.match(result.issues[0].message, /correct/);
});

test('an unknown subject, a repeated id and a missing option text are rejected', () => {
  const first = QUESTION_JSON_EXAMPLE.questions[0];
  const unknown = { ...first, external_id: 'u-1', subject: 'astrology' };
  const noText = { ...first, external_id: 'u-2', options: [{ ru: 'a' }, { ru: '' }] };
  const result = parseQuestionJson(JSON.stringify([first, first, unknown, noText]), SUBJECTS);
  assert.equal(result.rows.length, 1);
  assert.equal(result.duplicateIds, 1);
  assert.match(result.issues.find((i) => i.line === 3)!.message, /не найден в справочнике/);
  assert.match(result.issues.find((i) => i.line === 4)!.message, /у варианта B нет ru/);
});

test('text that is not JSON blocks the import and says so', () => {
  const result = parseQuestionJson('это не json', SUBJECTS);
  assert.ok(result.blockedReason);
  assert.equal(result.rows.length, 0);
});

test('without a subject list nothing is accepted', () => {
  const result = parseQuestionJson(JSON.stringify(QUESTION_JSON_EXAMPLE), []);
  assert.ok(result.blockedReason);
});

test('shuffling moves the answer key with the correct option', () => {
  const row = parseQuestionJson(JSON.stringify(QUESTION_JSON_EXAMPLE), SUBJECTS).rows[0];
  const correctText = row.options.find((o) => o.label === row.correctLabel)!.textRu;
  for (let seed = 1; seed <= 20; seed += 1) {
    let state = seed;
    const random = () => ((state = (state * 48271) % 2147483647) / 2147483647);
    const shuffled = shuffleOptions(row, random);
    assert.equal(shuffled.options.find((o) => o.label === shuffled.correctLabel)!.textRu, correctText);
    assert.deepEqual(shuffled.options.map((o) => o.label), ['A', 'B', 'C', 'D']);
    assert.deepEqual([...shuffled.options.map((o) => o.textRu)].sort(), [...row.options.map((o) => o.textRu)].sort());
  }
});

test('a question marked keep_order is not shuffled', () => {
  const row = parseQuestionJson(JSON.stringify(QUESTION_JSON_EXAMPLE), SUBJECTS).rows[2];
  assert.equal(shuffleOptions(row, () => 0.1), row);
});

test('the example in the docs matches the one in the admin', () => {
  const path = new URL('../../../../../docs/examples/questions.import.example.json', import.meta.url);
  if (!existsSync(path)) return; // the docs folder is not part of the admin container
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf-8')), JSON.parse(JSON.stringify(QUESTION_JSON_EXAMPLE)));
});
