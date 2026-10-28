import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENT_SUBJECTS } from './ent';

const mandatory = ENT_SUBJECTS.filter((s) => s.category === 'mandatory');
const profile = ENT_SUBJECTS.filter((s) => s.category === 'profile');

test('mandatory subjects have 20, 10 and 10 tasks as in the ENT specification', () => {
  assert.deepEqual(
    mandatory.map((s) => s.examTasks),
    [20, 10, 10],
  );
});

test('every profile subject has 40 tasks worth 50 points', () => {
  assert.equal(profile.length, 6);
  for (const subject of profile) {
    assert.equal(subject.examTasks, 40, subject.id);
    assert.equal(subject.examPoints, 50, subject.id);
  }
});

test('the applicant takes two profile subjects: 120 tasks in total and 100 profile points', () => {
  const tasks = mandatory.reduce((sum, s) => sum + s.examTasks, 0) + 2 * profile[0].examTasks;
  const profilePoints = 2 * (profile[0].examPoints ?? 0);
  assert.equal(tasks, 120);
  assert.equal(profilePoints, 100);
});

test('subject ids and codes are unique', () => {
  assert.equal(new Set(ENT_SUBJECTS.map((s) => s.id)).size, ENT_SUBJECTS.length);
  assert.equal(new Set(ENT_SUBJECTS.map((s) => s.code)).size, ENT_SUBJECTS.length);
});
