/**
 * Business logic for Kazakhstan ENT (ҰБТ) assessments, scoring rules, and question validation.
 * Decoupled from UI components for pure deterministic testing.
 */

import { QuestionItem, ExamSpecification, QuestionType } from '../types';

export interface ScoreCalculationInput {
  questionType: QuestionType;
  points: number;
  // For single_choice
  selectedSingleId?: string;
  correctSingleId?: string;
  // For multiple_choice
  selectedMultiIds?: string[];
  correctMultiIds?: string[];
  // For matching
  userMatches?: Record<string, string>; // leftId -> rightId
  correctMatches?: Record<string, string>;
  // For numerical
  userNumber?: number;
  correctNumber?: number;
  tolerance?: number;
}

export interface ScoreCalculationResult {
  earnedPoints: number;
  maxPoints: number;
  isFullyCorrect: boolean;
  feedbackMessageRu: string;
}

/**
 * Calculates score for a given ENT question answer according to official test scoring guidelines.
 * Single choice: 1 point if correct.
 * Multiple choice: usually 2 points max (full match = 2, 1 mistake = 1 point, >1 mistake = 0).
 * Matching: up to points max proportionally.
 * Numerical: 1 or 2 points if within tolerance.
 */
export function calculateEntQuestionScore(input: ScoreCalculationInput): ScoreCalculationResult {
  const maxPoints = Math.max(1, input.points || 1);

  switch (input.questionType) {
    case 'single_choice': {
      const isCorrect = !!input.selectedSingleId && input.selectedSingleId === input.correctSingleId;
      return {
        earnedPoints: isCorrect ? maxPoints : 0,
        maxPoints,
        isFullyCorrect: isCorrect,
        feedbackMessageRu: isCorrect ? 'Верный ответ' : 'Неверный ответ',
      };
    }

    case 'multiple_choice': {
      const selected = new Set(input.selectedMultiIds || []);
      const correct = new Set(input.correctMultiIds || []);

      if (selected.size === 0 || correct.size === 0) {
        return { earnedPoints: 0, maxPoints, isFullyCorrect: false, feedbackMessageRu: 'Ответ не выбран' };
      }

      // Count false positives and missed correct answers
      let falsePositives = 0;
      for (const id of selected) {
        if (!correct.has(id)) falsePositives++;
      }

      let correctChosen = 0;
      for (const id of selected) {
        if (correct.has(id)) correctChosen++;
      }

      const missed = correct.size - correctChosen;
      const totalErrors = falsePositives + missed;

      let earned = 0;
      if (totalErrors === 0) {
        earned = maxPoints;
      } else if (totalErrors === 1 && maxPoints >= 2) {
        earned = 1;
      } else {
        earned = 0;
      }

      return {
        earnedPoints: earned,
        maxPoints,
        isFullyCorrect: totalErrors === 0,
        feedbackMessageRu:
          totalErrors === 0
            ? 'Полностью верно (+2)'
            : totalErrors === 1 && maxPoints >= 2
            ? 'Частично верно (+1 балл, допущена 1 ошибка)'
            : 'Неверно (более 1 ошибки)',
      };
    }

    case 'matching': {
      const userMatches = input.userMatches || {};
      const correctMatches = input.correctMatches || {};
      const totalPairs = Object.keys(correctMatches).length;

      if (totalPairs === 0) {
        return { earnedPoints: 0, maxPoints, isFullyCorrect: false, feedbackMessageRu: 'Нет соответствий' };
      }

      let correctCount = 0;
      for (const [leftId, expectedRightId] of Object.entries(correctMatches)) {
        if (userMatches[leftId] === expectedRightId) {
          correctCount++;
        }
      }

      const ratio = correctCount / totalPairs;
      let earned = 0;
      if (ratio === 1) earned = maxPoints;
      else if (ratio >= 0.5 && maxPoints >= 2) earned = Math.floor(maxPoints * ratio);

      return {
        earnedPoints: earned,
        maxPoints,
        isFullyCorrect: correctCount === totalPairs,
        feedbackMessageRu: `${correctCount} из ${totalPairs} верно`,
      };
    }

    case 'numerical': {
      if (input.userNumber === undefined || input.correctNumber === undefined) {
        return { earnedPoints: 0, maxPoints, isFullyCorrect: false, feedbackMessageRu: 'Число не введено' };
      }
      const tol = input.tolerance ?? 0.01;
      const diff = Math.abs(input.userNumber - input.correctNumber);
      const isCorrect = diff <= tol;
      return {
        earnedPoints: isCorrect ? maxPoints : 0,
        maxPoints,
        isFullyCorrect: isCorrect,
        feedbackMessageRu: isCorrect ? 'Числовой ответ верен' : 'Числовой ответ неверен',
      };
    }

    default:
      return {
        earnedPoints: 0,
        maxPoints,
        isFullyCorrect: false,
        feedbackMessageRu: 'Неизвестный тип вопроса',
      };
  }
}

/**
 * Validates a question draft before submission or publication.
 * Returns array of validation error messages in Russian.
 */
export function validateQuestionDraft(q: Partial<QuestionItem>): string[] {
  const errors: string[] = [];

  if (!q.textRu || q.textRu.trim().length < 5) {
    errors.push('Текст вопроса на русском языке должен содержать минимум 5 символов');
  }

  if (!q.subjectId) {
    errors.push('Не выбран учебный предмет');
  }

  if (!q.topicId) {
    errors.push('Не указана тема учебной программы');
  }

  if (q.type === 'single_choice') {
    if (!q.options || q.options.length < 2) {
      errors.push('Вопрос с одиночным выбором должен содержать минимум 2 варианта ответа');
    }
    const correctOptions = (q.options || []).filter((o) => o.isCorrect);
    if (correctOptions.length !== 1) {
      errors.push('Для одиночного выбора необходимо указать ровно один правильный вариант');
    }
  }

  if (q.type === 'multiple_choice') {
    if (!q.options || q.options.length < 3) {
      errors.push('Вопрос с множественным выбором должен содержать минимум 3 варианта ответа');
    }
    const correctCount = (q.options || []).filter((o) => o.isCorrect).length;
    if (correctCount < 2) {
      errors.push('Для множественного выбора выберите хотя бы 2 правильных варианта');
    }
  }

  if (q.type === 'matching') {
    if (!q.matchingPairs || q.matchingPairs.length < 2) {
      errors.push('Вопрос на соответствие должен содержать минимум 2 пары');
    }
  }

  if (q.type === 'context_group') {
    if (!q.contextPassageRu || q.contextPassageRu.trim().length < 20) {
      errors.push('Контекстный вопрос должен содержать исходный текст (минимум 20 символов)');
    }
    if (!q.subQuestions || q.subQuestions.length < 2) {
      errors.push('Контекстная группа должна содержать минимум 2 связанных вопроса');
    }
  }

  if (!q.explanationRu || q.explanationRu.trim().length < 10) {
    errors.push('Необходимо указать педагогическое пояснение к ответу (минимум 10 символов)');
  }

  return errors;
}

/**
 * Validates exam builder configuration against an ENT specification.
 */
export function validateExamSpecification(
  spec: ExamSpecification,
  selectedQuestionIdsBySubject: Record<string, string[]>
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  let totalQuestionsCount = 0;
  for (const mandatory of spec.mandatorySubjectConfigs) {
    const questions = selectedQuestionIdsBySubject[mandatory.subjectId] || [];
    totalQuestionsCount += questions.length;
    if (questions.length < mandatory.questionCount) {
      issues.push(
        `Недостаточно вопросов по предмету (id: ${mandatory.subjectId}): выбрано ${questions.length} из ${mandatory.questionCount}`
      );
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Format CSV rows for questions export
 */
export function formatQuestionsCsv(questions: QuestionItem[]): string {
  const headers = ['ID', 'Subject', 'Type', 'Difficulty', 'Status', 'Points', 'QuestionTextRu', 'ExplanationRu'];
  const rows = questions.map((q) => [
    q.id,
    q.subjectId,
    q.type,
    q.difficulty,
    q.status,
    q.points,
    `"${(q.textRu || '').replace(/"/g, '""')}"`,
    `"${(q.explanationRu || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
