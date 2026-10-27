import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEntQuestionScore, validateQuestionDraft } from './entRules';
import { QuestionItem } from '../types';

test('Single choice question scoring: full points for correct option', () => {
  const result = calculateEntQuestionScore({
    questionType: 'single_choice',
    points: 1,
    selectedSingleId: 'opt-b',
    correctSingleId: 'opt-b',
  });
  assert.equal(result.earnedPoints, 1);
  assert.equal(result.isFullyCorrect, true);
});

test('Single choice question scoring: 0 points for incorrect option', () => {
  const result = calculateEntQuestionScore({
    questionType: 'single_choice',
    points: 1,
    selectedSingleId: 'opt-a',
    correctSingleId: 'opt-b',
  });
  assert.equal(result.earnedPoints, 0);
  assert.equal(result.isFullyCorrect, false);
});

test('Multiple choice question scoring: 2 points for full match', () => {
  const result = calculateEntQuestionScore({
    questionType: 'multiple_choice',
    points: 2,
    selectedMultiIds: ['opt-1', 'opt-3'],
    correctMultiIds: ['opt-1', 'opt-3'],
  });
  assert.equal(result.earnedPoints, 2);
  assert.equal(result.isFullyCorrect, true);
});

test('Multiple choice question scoring: 1 point for 1 error (1 missed)', () => {
  const result = calculateEntQuestionScore({
    questionType: 'multiple_choice',
    points: 2,
    selectedMultiIds: ['opt-1'],
    correctMultiIds: ['opt-1', 'opt-3'],
  });
  assert.equal(result.earnedPoints, 1);
  assert.equal(result.isFullyCorrect, false);
});

test('Multiple choice question scoring: 0 points for 2 errors', () => {
  const result = calculateEntQuestionScore({
    questionType: 'multiple_choice',
    points: 2,
    selectedMultiIds: ['opt-2', 'opt-4'],
    correctMultiIds: ['opt-1', 'opt-3'],
  });
  assert.equal(result.earnedPoints, 0);
  assert.equal(result.isFullyCorrect, false);
});

test('Question validation detects missing text and explanations', () => {
  const incompleteQuestion: Partial<QuestionItem> = {
    subjectId: 'history_kz',
    type: 'single_choice',
    textRu: '',
  };
  const errors = validateQuestionDraft(incompleteQuestion);
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.includes('Текст вопроса')));
});

test('Question validation passes for complete single-choice question', () => {
  const validQuestion: Partial<QuestionItem> = {
    textRu: 'В каком году образовалось Казахское ханство?',
    subjectId: 'history_kz',
    topicId: 'topic-khanate',
    type: 'single_choice',
    options: [
      { id: '1', textRu: '1465 год', textKz: '1465 жыл', isCorrect: true },
      { id: '2', textRu: '1511 год', textKz: '1511 жыл', isCorrect: false },
      { id: '3', textRu: '1723 год', textKz: '1723 жыл', isCorrect: false },
    ],
    explanationRu: 'Казахское ханство было основано в урочище Козыбасы в 1465 году ханами Кереем и Жанибеком.',
  };
  const errors = validateQuestionDraft(validQuestion);
  assert.equal(errors.length, 0);
});
