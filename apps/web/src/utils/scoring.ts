/**
 * Pure scoring and diagnostic calculation logic for QAZMIND ENT simulator.
 */

export interface ExamAnswerRecord {
  [questionId: number]: string;
}

export interface MinimalExamQuestion {
  id: number;
  correctId: string;
  subjectRu?: string;
  topicRu?: string;
}

export interface ScoreSummary {
  score: number;
  total: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export interface TargetFeedback {
  targetAchieved: boolean;
  gap: number;
  bandRu: string;
  bandKz: string;
}

/**
 * Calculates exam results based on recorded answers and key list.
 */
export function calculateExamScore(
  answers: ExamAnswerRecord,
  questions: MinimalExamQuestion[]
): ScoreSummary {
  const total = questions.length;
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      percentage: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
    };
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    const selected = answers[q.id];
    if (!selected) {
      unansweredCount++;
    } else if (selected === q.correctId) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  const score = correctCount;
  const percentage = Math.round((correctCount / total) * 100);

  return {
    score,
    total,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
  };
}

/**
 * Evaluate student distance to the 140 maximum ENT score or custom target.
 */
export function getScoreTargetFeedback(score: number, target: number = 140): TargetFeedback {
  const gap = Math.max(0, target - score);
  const targetAchieved = gap === 0;

  let bandRu = 'Начальный уровень: требуется разбор базовых тем';
  let bandKz = 'Бастапқы деңгей: негізгі тақырыптарды талдау қажет';

  if (score >= 130) {
    bandRu = 'Грантовый уровень топ-вузов (130-140)';
    bandKz = 'Топ-университеттер гранты деңгейі (130-140)';
  } else if (score >= 110) {
    bandRu = 'Уверенный проходной балл (110-129)';
    bandKz = 'Сенімді өту балы (110-129)';
  } else if (score >= 85) {
    bandRu = 'Базовый порог преодолен (85-109)';
    bandKz = 'Базалық шекті балл жиналды (85-109)';
  }

  return {
    targetAchieved,
    gap,
    bandRu,
    bandKz,
  };
}

/**
 * Calculate learning route progress percentage clamped to 0-100.
 */
export function calculateMasteryPercentage(completedSteps: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  const val = Math.round((completedSteps / totalSteps) * 100);
  return Math.min(100, Math.max(0, val));
}

/**
 * Identifies subjects with the highest number of mistakes.
 */
export function detectKnowledgeGaps(
  answers: ExamAnswerRecord,
  questions: MinimalExamQuestion[]
): { subject: string; mistakesCount: number }[] {
  const subjectMistakes: Record<string, number> = {};

  for (const q of questions) {
    const selected = answers[q.id];
    if (selected && selected !== q.correctId) {
      const subject = q.subjectRu || 'Общие вопросы';
      subjectMistakes[subject] = (subjectMistakes[subject] || 0) + 1;
    }
  }

  return Object.entries(subjectMistakes)
    .map(([subject, mistakesCount]) => ({ subject, mistakesCount }))
    .sort((a, b) => b.mistakesCount - a.mistakesCount);
}
