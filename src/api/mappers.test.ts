import test from 'node:test';
import assert from 'node:assert/strict';
import { examPeriodCodeFromLabel, toProfilePatch, toStudentProfile } from './mappers';
import { ApiProfile } from './endpoints';

const serverProfile: ApiProfile = {
  interface_lang: 'kz',
  exam_lang: 'kz',
  profile_pair_id: 'chem_bio',
  target_score: 120,
  exam_year: 2027,
  exam_period: 'ent_2027',
  daily_goal_minutes: 30,
  onboarding_completed_at: '2026-10-27T10:00:00Z',
};

test('server profile maps to the dashboard shape with the real user name', () => {
  const profile = toStudentProfile('Алия Касымова', serverProfile);
  assert.equal(profile.name, 'Алия Касымова');
  assert.equal(profile.profilePairId, 'chem_bio');
  assert.equal(profile.targetScore, 120);
  assert.equal(profile.examLanguage, 'kz');
  assert.equal(profile.dailyGoalMinutes, 30);
  assert.equal(profile.examDate, 'ЕНТ 2027');
  assert.match(profile.profilePairLabelRu, /^Биология \+ Химия \(/);
});

test('grade and city are left empty instead of being invented', () => {
  const profile = toStudentProfile('Алия', serverProfile);
  assert.equal(profile.grade, '');
  assert.equal(profile.city, '');
});

test('settings changes map to server field names and unknown fields are dropped', () => {
  const patch = toProfilePatch({
    targetScore: 130,
    examLanguage: 'ru',
    profilePairId: 'math_phys',
    dailyGoalMinutes: 60,
    name: 'Не сохраняется на сервере',
    grade: '11 класс',
    profilePairLabelRu: 'надпись',
  });
  assert.deepEqual(patch, {
    target_score: 130,
    exam_lang: 'ru',
    profile_pair_id: 'math_phys',
    daily_goal_minutes: 60,
  });
});

test('exam period labels map back to server codes', () => {
  assert.equal(examPeriodCodeFromLabel('Июнь (основной)'), 'june_main');
  assert.equal(examPeriodCodeFromLabel('Март (платный)'), 'march_paid');
  assert.equal(examPeriodCodeFromLabel('ЕНТ 2027'), 'ent_2027');
  assert.equal(examPeriodCodeFromLabel('что-то другое'), 'june_main');
});
