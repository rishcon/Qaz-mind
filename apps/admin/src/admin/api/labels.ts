/** Russian names of audit actions. Unknown actions are shown by their code. */
export const ACTION_LABELS: Record<string, string> = {
  'staff.login': 'Вход сотрудника',
  'staff.mfa': 'Проверка кода',
  'staff.mfa_enrolled': 'Настройка второго фактора',
  'staff.mfa_reset': 'Сброс второго фактора',
  'staff.invite': 'Приглашение сотрудника',
  'staff.invite_accepted': 'Приглашение принято',
  'staff.roles_changed': 'Изменение ролей',
  'staff.disabled': 'Отключение сотрудника',
  'staff.enabled': 'Включение сотрудника',
  'staff.sessions_revoked': 'Завершение сессий сотрудника',
  'user.status_changed': 'Изменение статуса ученика',
  'user.sessions_revoked': 'Завершение сессий ученика',
  'topic.created': 'Создание темы',
  'lesson.created': 'Создание урока',
  'lesson.version_created': 'Новая версия урока',
  'lesson.submit': 'Урок на рецензию',
  'lesson.return': 'Урок возвращён автору',
  'lesson.approve': 'Урок утверждён',
  'lesson.publish': 'Урок опубликован',
  'lesson.archive': 'Урок в архиве',
  'question.created': 'Создание вопроса',
  'question.updated': 'Изменение вопроса',
  'question.imported': 'Импорт вопросов',
  'question.submit': 'Вопрос на рецензию',
  'question.return': 'Вопрос возвращён автору',
  'question.approve': 'Вопрос утверждён',
  'question.publish': 'Вопрос опубликован',
  'question.archive': 'Вопрос в архиве',
};

export const actionLabel = (code: string) => ACTION_LABELS[code] ?? code;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_review: 'На рецензии',
  approved: 'Утверждён',
  published: 'Опубликован',
  archived: 'В архиве',
};

export const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Базовый', medium: 'Средний', hard: 'Сложный' };
