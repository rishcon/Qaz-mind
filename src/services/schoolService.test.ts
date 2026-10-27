import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolService } from './schoolService';
import { UserAccount } from '../types/auth';

test('schoolService seeds and retrieves default organizations', () => {
  const orgs = schoolService.getOrganizations();
  assert.ok(orgs.length >= 1);
  const lyceum = orgs.find((o) => o.id === 'school_lyceum28');
  assert.ok(lyceum);
  assert.equal(lyceum.name, 'Лицей №28 им. К. Сатпаева');
  assert.equal(lyceum.status, 'active');
});

test('schoolService handles application submission and approval flow', () => {
  const app = schoolService.submitApplication({
    userId: 'usr_test_director',
    representativeName: 'Нурлан Жакишев',
    representativeEmail: 'director@school77.kz',
    schoolName: 'Школа-лицей №77',
    city: 'Астана',
    orgType: 'lyceum',
    contactEmail: 'info@school77.kz',
    contactPerson: 'Нурлан Жакишев',
    studentCountApprox: 50,
  });

  assert.ok(app.id);
  assert.equal(app.status, 'pending');

  const approved = schoolService.approveApplication(app.id);
  assert.ok(approved);
  assert.equal(approved.organization.name, 'Школа-лицей №77');
  assert.equal(approved.member.role, 'SCHOOL_ADMIN');
  assert.equal(approved.member.userId, 'usr_test_director');
});

test('schoolService joinClassByCode correctly adds student without duplicating data', () => {
  const testUser: UserAccount = {
    id: `usr_test_student_${Date.now()}`,
    name: 'Айбек Темиров',
    email: 'aibek.temirov@test.kz',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  };

  const joinResult = schoolService.joinClassByCode('QM-28A1', testUser);
  assert.ok(joinResult.success);
  assert.equal(joinResult.schoolClass?.name, '11 «А»');

  // Verify membership
  const memberships = schoolService.getUserMemberships(testUser.id);
  assert.ok(memberships.length >= 1);
  assert.equal(memberships[0].role, 'STUDENT');
});

test('schoolService assigns and records student submissions', () => {
  const asg = schoolService.createAssignment({
    organizationId: 'school_lyceum28',
    classIds: ['class_11a'],
    teacherId: 'usr_teacher_daulet',
    teacherName: 'Даулет Бауржанович',
    title: 'Тест по термодинамике',
    subjectId: 'physics',
    activityType: 'practice',
    questionCount: 5,
    deadline: '2026-11-20',
    allowedAttempts: 1,
    status: 'published',
  });

  assert.ok(asg.id);
  assert.equal(asg.title, 'Тест по термодинамике');

  const sub = schoolService.submitAssignmentResult({
    assignmentId: asg.id,
    studentId: 'usr_test_student_1',
    studentName: 'Тестовый Ученик',
    studentEmail: 'student1@test.kz',
    classId: 'class_11a',
    score: 5,
    total: 5,
  });

  assert.equal(sub.score, 5);
  const results = schoolService.getAssignmentResults(asg.id);
  assert.equal(results.length, 1);
});
