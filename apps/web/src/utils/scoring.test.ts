import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExamScore,
  getScoreTargetFeedback,
  calculateMasteryPercentage,
  detectKnowledgeGaps,
} from './scoring';

test('calculateExamScore returns exact score, counts, and percentage', () => {
  const mockQuestions = [
    { id: 1, correctId: 'B' },
    { id: 2, correctId: 'A' },
    { id: 3, correctId: 'C' },
    { id: 4, correctId: 'D' },
  ];

  const answers = {
    1: 'B', // correct
    2: 'C', // incorrect
    3: 'C', // correct
    // 4 is unanswered
  };

  const res = calculateExamScore(answers, mockQuestions);
  assert.equal(res.score, 2);
  assert.equal(res.total, 4);
  assert.equal(res.percentage, 50);
  assert.equal(res.correctCount, 2);
  assert.equal(res.incorrectCount, 1);
  assert.equal(res.unansweredCount, 1);
});

test('calculateExamScore handles empty questions without NaN', () => {
  const res = calculateExamScore({}, []);
  assert.equal(res.score, 0);
  assert.equal(res.percentage, 0);
});

test('getScoreTargetFeedback computes gap to 140 maximum score and bands', () => {
  const feedbackTop = getScoreTargetFeedback(135, 140);
  assert.equal(feedbackTop.gap, 5);
  assert.equal(feedbackTop.targetAchieved, false);
  assert.match(feedbackTop.bandRu, /Грантовый уровень/);

  const feedbackPerfect = getScoreTargetFeedback(140, 140);
  assert.equal(feedbackPerfect.gap, 0);
  assert.equal(feedbackPerfect.targetAchieved, true);
});

test('calculateMasteryPercentage clamps within 0 and 100', () => {
  assert.equal(calculateMasteryPercentage(3, 8), 38);
  assert.equal(calculateMasteryPercentage(0, 5), 0);
  assert.equal(calculateMasteryPercentage(10, 10), 100);
});

test('detectKnowledgeGaps isolates subjects with wrong answers sorted descending', () => {
  const mockQuestions = [
    { id: 1, correctId: 'A', subjectRu: 'История Казахстана' },
    { id: 2, correctId: 'B', subjectRu: 'История Казахстана' },
    { id: 3, correctId: 'C', subjectRu: 'Математическая грамотность' },
  ];

  const answers = {
    1: 'D', // wrong Historia
    2: 'C', // wrong Historia
    3: 'C', // correct Math
  };

  const gaps = detectKnowledgeGaps(answers, mockQuestions);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].subject, 'История Казахстана');
  assert.equal(gaps[0].mistakesCount, 2);
});
