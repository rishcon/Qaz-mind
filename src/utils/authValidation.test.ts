import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
} from './authValidation';

test('validateEmail correctly accepts valid email addresses', () => {
  assert.equal(validateEmail('student@gmail.com').isValid, true);
  assert.equal(validateEmail('user.name+tag@domain.kz').isValid, true);
  assert.equal(validateEmail('aliya@qazmind.kz').isValid, true);
});

test('validateEmail rejects malformed and empty emails', () => {
  assert.equal(validateEmail('').isValid, false);
  assert.equal(validateEmail('not-an-email').isValid, false);
  assert.equal(validateEmail('student@').isValid, false);
  assert.equal(validateEmail('@domain.com').isValid, false);
  assert.equal(validateEmail('student@domain').isValid, false);
});

test('validatePassword requires at least 8 characters (same rule as the API)', () => {
  assert.equal(validatePassword('').isValid, false);
  assert.equal(validatePassword('12345').isValid, false);
  assert.equal(validatePassword('1234567').isValid, false);
  assert.equal(validatePassword('12345678').isValid, true);
  assert.equal(validatePassword('StrongPassword2026').isValid, true);
});

test('validateRegistration checks name, email, and password hierarchy', () => {
  // Empty or short name
  const res1 = validateRegistration({ name: 'A', email: 'aliya@mail.kz', password: 'secret123' });
  assert.equal(res1.isValid, false);
  assert.equal(res1.errorField, 'name');

  // Invalid email
  const res2 = validateRegistration({ name: 'Алия', email: 'bad-email', password: 'secret123' });
  assert.equal(res2.isValid, false);
  assert.equal(res2.errorField, 'email');

  // Short password
  const res3 = validateRegistration({ name: 'Алия', email: 'aliya@mail.kz', password: '123' });
  assert.equal(res3.isValid, false);
  assert.equal(res3.errorField, 'password');

  // Valid registration
  const res4 = validateRegistration({ name: 'Алия', email: 'aliya@mail.kz', password: 'secret123' });
  assert.equal(res4.isValid, true);
});

test('validateLogin checks email and password', () => {
  const invalidEmail = validateLogin({ email: 'bad', password: 'secret123' });
  assert.equal(invalidEmail.isValid, false);
  assert.equal(invalidEmail.errorField, 'email');

  const invalidPass = validateLogin({ email: 'aliya@mail.kz', password: '123' });
  assert.equal(invalidPass.isValid, false);
  assert.equal(invalidPass.errorField, 'password');

  const valid = validateLogin({ email: 'aliya@mail.kz', password: 'secret123' });
  assert.equal(valid.isValid, true);
});
