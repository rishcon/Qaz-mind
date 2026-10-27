import { OFFICIAL_PROFILE_PAIRS } from '../types/auth';
import { StudentProfile } from '../types/dashboard';
import { ApiProfile, ProfilePatch } from './endpoints';

// Labels used by the existing screens for each exam period (kept identical to the prototype wording).
export const EXAM_PERIOD_LABELS: Record<ApiProfile['exam_period'], string> = {
  june_main: 'Июнь (основной)',
  march_paid: 'Март (платный)',
  ent_2027: 'ЕНТ 2027',
};

const PERIOD_BY_LABEL: Record<string, ApiProfile['exam_period']> = {
  'Июнь (основной)': 'june_main',
  'Март (платный)': 'march_paid',
  'ЕНТ 2027': 'ent_2027',
};

export function examPeriodCodeFromLabel(label: string): ApiProfile['exam_period'] {
  return PERIOD_BY_LABEL[label] ?? 'june_main';
}

function examDateLabel(period: ApiProfile['exam_period'], year: number): string {
  const label = EXAM_PERIOD_LABELS[period];
  // "ЕНТ 2027" already contains the year; avoid printing it twice.
  return label.includes(String(year)) ? label : `${label} ${year}`;
}

/** Converts the server profile into the shape used by the existing dashboard components. */
export function toStudentProfile(userName: string, profile: ApiProfile): StudentProfile {
  const pair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === profile.profile_pair_id) ?? OFFICIAL_PROFILE_PAIRS[0];
  return {
    name: userName,
    // Grade and city are not stored on the server yet, so they are left empty instead of invented.
    grade: '',
    city: '',
    targetScore: profile.target_score,
    examLanguage: profile.exam_lang,
    profilePairId: pair.id,
    profilePairLabelRu: `${pair.titleRu} (${pair.clusterRu})`,
    profilePairLabelKz: `${pair.titleKz} (${pair.clusterKz})`,
    examDate: examDateLabel(profile.exam_period, profile.exam_year),
    dailyGoalMinutes: profile.daily_goal_minutes,
  };
}

/** Maps the fields the settings screen can change onto the server patch. Other fields are not persisted. */
export function toProfilePatch(updated: Partial<StudentProfile>): ProfilePatch {
  const patch: ProfilePatch = {};
  if (updated.targetScore !== undefined) patch.target_score = updated.targetScore;
  if (updated.examLanguage !== undefined) {
    patch.exam_lang = updated.examLanguage;
  }
  if (updated.profilePairId !== undefined) patch.profile_pair_id = updated.profilePairId;
  if (updated.dailyGoalMinutes !== undefined) patch.daily_goal_minutes = updated.dailyGoalMinutes;
  return patch;
}
