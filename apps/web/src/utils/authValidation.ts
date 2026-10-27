/**
 * Authentication and validation utilities for QAZMIND.
 * Pure email and password validation (no phone numbers).
 */

export function validateEmail(email: string): { isValid: boolean; errorRu?: string; errorKz?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      isValid: false,
      errorRu: 'Введите адрес электронной почты',
      errorKz: 'Электрондық поштаны енгізіңіз',
    };
  }

  // Standard RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      errorRu: 'Введите корректный email (например, student@gmail.com)',
      errorKz: 'Дұрыс email мекенжайын енгізіңіз (мысалы, student@gmail.com)',
    };
  }

  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; errorRu?: string; errorKz?: string } {
  if (!password) {
    return {
      isValid: false,
      errorRu: 'Введите пароль',
      errorKz: 'Құпиясөзді енгізіңіз',
    };
  }

  // Must match the backend rule (app/schemas/auth.py: Password min_length=8).
  if (password.length < 8) {
    return {
      isValid: false,
      errorRu: 'Пароль должен содержать не менее 8 символов',
      errorKz: 'Құпиясөз кемінде 8 таңбадан тұруы керек',
    };
  }

  return { isValid: true };
}

export function validateRegistration(data: {
  name: string;
  email: string;
  password: string;
}): {
  isValid: boolean;
  errorField?: 'name' | 'email' | 'password';
  messageRu?: string;
  messageKz?: string;
} {
  const nameTrimmed = data.name.trim();
  if (!nameTrimmed || nameTrimmed.length < 2) {
    return {
      isValid: false,
      errorField: 'name',
      messageRu: 'Пожалуйста, введите ваше имя (не менее 2 символов)',
      messageKz: 'Атыңызды енгізіңіз (кемінде 2 таңба)',
    };
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    return {
      isValid: false,
      errorField: 'email',
      messageRu: emailResult.errorRu,
      messageKz: emailResult.errorKz,
    };
  }

  const passResult = validatePassword(data.password);
  if (!passResult.isValid) {
    return {
      isValid: false,
      errorField: 'password',
      messageRu: passResult.errorRu,
      messageKz: passResult.errorKz,
    };
  }

  return { isValid: true };
}

export function validateLogin(data: {
  email: string;
  password: string;
}): {
  isValid: boolean;
  errorField?: 'email' | 'password';
  messageRu?: string;
  messageKz?: string;
} {
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    return {
      isValid: false,
      errorField: 'email',
      messageRu: emailResult.errorRu,
      messageKz: emailResult.errorKz,
    };
  }

  const passResult = validatePassword(data.password);
  if (!passResult.isValid) {
    return {
      isValid: false,
      errorField: 'password',
      messageRu: passResult.errorRu,
      messageKz: passResult.errorKz,
    };
  }

  return { isValid: true };
}
